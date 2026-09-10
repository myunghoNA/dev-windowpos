#!/usr/bin/node

const slash = require('slash');
const { createServer, build, normalizePath, loadEnv } = require('vite');
const { join, relative } = require('path');
const { spawn } = require('child_process');
const electronPath = require('electron');

const mode = process.env.MODE || 'dev';
process.env.NODE_ENV = mode;
process.env.MODE = mode;

/**
 * @name startElectron
 * @description 컴파일 완료된 메인 프로세스 바이너리를 기반으로 Electron 런타임을 자식 프로세스로 가동
 */
function startElectron() {
  // 하드웨어 포트 트래킹 및 IPC 소켓 디버깅 필요시
  // chrome://inspect -> inspect
  let debugSwitch = [];

  if (process.env.DEBUG_MODE === 'true') {
    debugSwitch = [
      '--inspect=5858', // 메인 프로세스 디버거 연동
      '--enable-logging', // 터미널 로그 출력
      //'--ignore-certificate-errors',  // 개발서버 사설 HTTPS 인증서 허용
      // '--disable-web-security',      // CORS/CSP 잠시 끄고 싶을 때 주석 해제
    ];
  }

  return spawn(electronPath, [
    ...debugSwitch,
    join(process.cwd(), 'dist/source/main/index.cjs.js'),
  ]);
}

(async () => {
  // ===========================================
  // Vite 렌더러(UI) 개발 서버 생성
  // ===========================================
  const server = await createServer({
    mode,
    configFile: join(process.cwd(), 'config/renderer.vite.js'),
    envFile: true,
    server: {
      port: 13300,
    },
  });

  // ===========================================
  // 개발 환경 변수 로드 및 Node 프로세스 복사
  // ===========================================
  const env = loadEnv(mode, process.cwd(), '');
  server.config.env = env;

  // .env.development 파일의 모든 설정을 일렉트론 모든 프로세스가 공유하도록 바인딩
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }

  // ===========================================
  // Preload 브릿지 스크립트 초기 컴파일
  // ===========================================
  const buildPreload = () =>
    build({ mode, configFile: join(process.cwd(), 'config/preload.vite.js') });
  await buildPreload();

  // ===========================================
  // Preload 소스 변경 감지 -> 실시간 재빌드 트리거
  // ===========================================
  server.watcher.add(join(process.cwd(), 'src/preload/**'));
  server.watcher.on('change', (file) => {
    file = normalizePath(file);

    if (!file.includes('/src/preload/')) {
      return;
    }
    return buildPreload();
  });

  // ===========================================
  // Preload 산출물 변경 감지 -> 브라우저 웹소켓(WS) HMR 새로고침
  // ===========================================
  server.watcher.add(join(process.cwd(), 'dist/source/preload/**'));
  server.watcher.on('change', (file) => {
    file = normalizePath(file);

    if (!file.includes('/dist/source/preload/')) {
      return;
    }

    server.ws.send({
      type: 'full-reload',
      path: '/' + slash(relative(server.config.root, file)),
    });
  });

  // ===========================================
  // Vite 개발 서버 포트 리스닝 가동
  // ===========================================
  await server.listen();

  // ===========================================
  // 메인 프로세스 타깃팅용 로컬 웹서버 URL 환경변수 주입
  // ===========================================
  {
    const protocol = `http${server.config.server.https ? 's' : ''}:`;
    const host = server.config.server.host || 'localhost';
    const port = server.config.server.port;
    const path = '/';
    process.env.VITE_DEV_SERVER_URL = `${protocol}//${host}:${port}${path}`;
  }

  // ===========================================
  // Main 코어 프로세스 초기 컴파일
  // ===========================================
  const buildMain = () =>
    build({ mode, configFile: join(process.cwd(), 'config/main.vite.js') });
  await buildMain();

  // ===========================================
  // Main 소스 변경 감지 -> 실시간 백엔드 재빌드 트리거
  // ===========================================
  server.watcher.add(join(process.cwd(), 'src/main/**'));
  server.watcher.on('change', (file) => {
    file = normalizePath(file);

    if (!file.includes('/src/main/')) {
      return;
    }

    return buildMain();
  });

  // ===========================================
  // 최종 데스크톱 일렉트론 애플리케이션 실행
  // ===========================================
  startElectron();
})();
