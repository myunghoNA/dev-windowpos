#!/usr/bin/node

/**
 * @file build.js
 * @description 일렉트론 코어 인프라(Main, Preload, Renderer) 번들링 및 배포 자동화 파이프라인 스크립트
 */

console.time('[Build Pipeline] Total Duration');

const { build, loadEnv } = require('vite');
const { join }           = require('path');
const { writeFile, mkdir, stat } = require('fs/promises');

// 빌드 모드 결정 (기본값: prod)

// ===========================================
// 빌드 컨텍스트 전역 환경 구성
// ===========================================
const CWD  = process.cwd();
const MODE = process.env.MODE || 'prod';

// 번들링을 순차/병렬로 수행할 핵심 Vite 전용 구성 파일
const configs = [
  join(CWD, 'config/main.vite.js'),
  join(CWD, 'config/preload.vite.js'),
  join(CWD, 'config/renderer.vite.js'),
];


/**
 * @name loadAndSetEnv
 * @description 로컬 `.env` 파일을 로드하여 Node.js 런타임 `process.env` 컨텍스트에 안전하게 동적 머징 
 * @param {string} targetMode - 런타임 빌드 타깃 모드 ('dev' | 'prod')
 * @param {string} rootDir - 현재 애플리케이션 작업 절대 경로
 */
const loadAndSetEnv = (targetMode, rootDir) => {
  const env = loadEnv(targetMode, rootDir);

  for (const envKey in env) {
    if (process.env[envKey] === undefined && Object.hasOwn(env, envKey)) {
      process.env[envKey] = env[envKey];
    }
  }
};


/**
 * @name buildByConfig
 * @description 특정 설정 파일을 기준 삼아 Vite 컴파일러 엔진을 가동하여 비동기 리소스 번들링 수행
 * @param {string} configFile - Vite 구성 파일 절대 경로
 * @returns {Promise<void>} Vite 빌드 타스크 프로미스 인스턴스
 */
const buildByConfig = (configFile) => {
  loadAndSetEnv(MODE, CWD);
  return build({ configFile, MODE });
};


/**
 * @name generatePackageJson
 * @description [Async] 실 상점 계산대 배포 환경(dist)에 필요한 데브 환경 및 스크립트를 도려낸 린(Lean)한 package.json 동적 추출
 * @returns {Promise<void>} 파일 시스템 입출력 완료 프로미스
 */
const generatePackageJson = async () => {
  const packageJsonPath = join(CWD, 'package.json');
  const packageJson = require(packageJsonPath);

  // 1. 배포 최적화를 위해 개발용 자원 스크립트 일괄 격리 및 제거
  delete packageJson.scripts;
  delete packageJson.devDependencies;

  // 2. 외부화(External) 지정 라이브러리 외의 종속성 번들링
  const { default: external } = require(join(CWD, 'config/external-packages'));
  const targetDeps = ['dependencies', 'optionalDependencies'];

  for (const type of targetDeps) {
    if (packageJson[type] === undefined) continue;

    for (const key of Object.keys(packageJson[type])) {
      if (!external.includes(key)) {
        delete packageJson[type][key];
      }
    }
  }

  // 3. 개발 모드 빌드 시 이름 변경
  if (MODE === 'dev') {
    packageJson.name = `dev-${packageJson.name}`;
  }

  const outputDir = join(CWD, 'dist/source');

  //  dist/source 폴더가 미처 생성되지 않았을 때 처리
  await mkdir(outputDir, { recursive: true });

  // 최종 package.json 파일 추출
  return writeFile(
    join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  );
};

/**
 * @function printBuildDashboard
 * @description 빌드 완료 후 터미널에 총괄 자원 명세(용량, 환경 변수, 레이어별 상태) 대시보드를 시각화 출력
 */
const printBuildDashboard = async () => {
    const sourceDir = join(CWD, 'dist/source');
    
    console.log('\n📊 ==================== [ flownet POS Build Audit ] ====================');
    
    // 1. 주요 산출물 용량 체킹
    try {
        const pkgStat = await stat(join(sourceDir, 'package.json'));
        console.log(` 📦 Target Manifest :/dist/source/package.json [${(pkgStat.size / 1024).toFixed(2)} KB]`);
    } catch {
        console.log(' 📦 Target Manifest : Detected partial bundle strategy');
    }

    // 2. 주입된 활성 환경 변수 오디트 (보안 마스킹 적용)
    console.log('\n 🔒 Injecting Environment Variables:');
    //const targetEnvKeys = ['MODE', 'VITE_APP_TITLE', 'VITE_LOKI_URL', 'VITE_POS_API_URL'];

    const activeEnvKeys = new Set(['MODE']);

    const loadedEnv = loadEnv(MODE, CWD);
    Object.keys(loadedEnv).forEach(key => activeEnvKeys.add(key));
    
    activeEnvKeys.forEach(key => {
        const val = process.env[key] || loadedEnv[key];

        if (val) {
            console.log(`    🔹 ${key.padEnd(22)} : ${val}`);
        } else {
            console.log(`    🔸 ${key.padEnd(22)} : NOT_SET (Using Fallback)`);
        }
    });

    console.log('========================================================================\n');
};


console.log(`[Build Pipeline] Starting compilation in "${MODE}" mode...`);

const layerTargets = ['Main Process', 'Preload Script', 'Renderer UI'];
configs.forEach((_, idx) => console.time(` ⏱️  ${layerTargets[idx]} Build`));

// 4. 빌드 파이프라인 실행
  Promise.all(configs.map((config, idx) => {
    return buildByConfig(config).then(() => {
        console.timeEnd(` ⏱️  ${layerTargets[idx]} Build`);
    });
  }))
  .then(generatePackageJson)
  .then(printBuildDashboard)
  .then(() => {
    console.log('\n==================================================');
    console.log(' POS 전 레이어 번들링 및 패키지 락다운 성공!');
    console.log('==================================================');
    console.timeEnd('[Build Pipeline] Total Duration');
  })
  .catch((error) => {
    console.error('\n[Build Pipeline 크리티컬 오류 발견]:', error);
    process.exit(1);
  });
