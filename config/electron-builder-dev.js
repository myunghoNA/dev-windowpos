
/**
 * @module electron-builder-configuration
 * @description 일렉트론 애플리케이션을 윈도우 설치 파일(.exe) 및 상용 아티팩트로 
 *              빌드하기 위한 electron-builder 핵심 환경 설정 명세서.
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  
  // ===========================================
  //  환경설정 & 앱 메타 정보
  // ===========================================
  appId: 'dev.flownet.pos',
  productName: 'flownet POS (Dev)',
  copyright: 'Copyright ⓒ 2026 Flownet Co., Ltd. All Rights Reserved.',

  // ===========================================
  //  ASAR 패키징 및 압축 예외 설정
  // ===========================================
  asar: true,
  asarUnpack: 'node_modules/canvas/**',
  extends: null,

  // ===========================================
  //  인풋 / 아웃풋 디렉터리 경로
  // ===========================================
  directories: {
    output: 'dist/app/dev',
    buildResources: 'build',
    app: 'dist/source',
  },

  // ===========================================
  //  외장 자원(Assets) 패키지 복사 설정
  // ===========================================
  extraResources: [
    {
      from: 'assets', 
      to: 'assets',   // 빌드 후 resources/assets 폴더로 복사
      filter: ['**/*'],
    },
  ],

  // ===========================================
  //  OS별 빌드 타깃 및 아키텍처 (Windows)
  // ===========================================
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['ia32'],
      },
    ],
    icon: 'dist/source/main/icon_pos.png',
    forceCodeSigning: false,
    // signtoolOptions: {
    //   sign: async (configuration) => {
    //     const { execFile } = require('child_process');
    //     const path = require('path');

    //     const codeSignToolDir = 'C:\\Temp\\CodeSignTool-v1.3.3-windows';

    //     await new Promise((resolve, reject) => {
    //       execFile(
    //         path.join(codeSignToolDir, 'jdk-11.0.2', 'bin', 'java.exe'),
    //         [
    //           '-jar', path.join(codeSignToolDir, 'jar', 'code_sign_tool-1.3.3.jar'),
    //           'sign',
    //           `-input_file_path=${configuration.path}`,
    //           '-override',
    //           '-username=esigner_demo',
    //           '-password=esignerDemo#1',
    //           '-totp_secret=RDXYgV9qju+6/7GnMf1vCbKexXVJmUVr+86Wq/8aIGg=',
    //           '-credential_id=8b072e22-7685-4771-b5c6-48e46614915f',
    //         ],
    //         { cwd: codeSignToolDir },
    //         (error, stdout, stderr) => {
    //           if (error) {
    //             console.error(stderr);
    //             return reject(error);
    //           }
    //           console.log(stdout);
    //           resolve();
    //         },
    //       );
    //     });
    //   },
    // },
  },

  // ===========================================
  //  NSIS 인스톨러 / 언인스톨러 커스텀
  // ===========================================
  nsis: {
    createDesktopShortcut: 'always',
    shortcutName: '${productName}',
    artifactName: '${productName}_Setup_${version}.${ext}',
    uninstallDisplayName: '${productName} ${version}',
  },
  
  // ===========================================
  //  업데이트 배포 및 릴리즈 정보
  // https://objectstorage.<리전-코드>.oraclecloud.com/n/<네임스페이스>/b/<버킷이름>/o/
  // ===========================================
  // publish: {
  //   provider: 'generic',
  //   url: 'https://objectstorage.ap-chuncheon-1.oraclecloud.com/n/ax6h0epeabcw/b/nmh-pos-update/o/',
  // },
  publish: {
    provider: 'generic',
    url: 'https://objectstorage.ap-chuncheon-1.oraclecloud.com/p/CtIr4Aqo82S9MltYvqOW-xjMJL_XY3NNHgngY5a5sOWX8EHXMTjv4BtxhEx18gLP/n/ax6h0epeabcw/b/nmh-pos-update/o/dev-flow-pos/',
  },
  releaseInfo: {
    releaseNotesFile: 'config/release-notes-last.md',
  },
};

/** private시
 * #####OCI 콘솔에서 PAR 생성:
 * OCI Object Storage ➡️ 버킷 ➡️ 업데이트 파일들이 업로드되는 폴더(또는 파일) 선택 
 * Create Pre-Authenticated Request 클릭.
 * Access Type을 "Object read" 또는 "Bucket read"로 설정하고 만료일을 넉넉하게(또는 무기한으로) 설정
 * 
 * "publish": {
  "provider": "generic",
  "url": "https://objectstorage.<리전>.oraclecloud.com/p/<PAR-토큰-경로>/o/"
         https://objectstorage.ap-seoul-1.oraclecloud.com/p/AbCdEfGhIjKlMnOpQrStUvWxYz123456789/n/my-namespace/b/my-bucket-name/o/
}
 */
