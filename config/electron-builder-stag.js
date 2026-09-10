
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
  appId: 'stag.flownet.pos',
  productName: 'flownet POS (Stag)',
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
    output: 'dist/app/stag',
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
   // requestedExecutionLevel: 'requireAdministrator',
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
  publish: {
    provider: 'generic',
    url: 'https://ax6h0epeabcw.objectstorage.ap-chuncheon-1.oci.customer-oci.com/p/xHDEbrBnPo25498rJ7_CsYXBVVrE3czCAoqsA2qFI_JS_Y-YFymAv97BQJjcqyqc/n/ax6h0epeabcw/b/nmh-pos-update/o/stag-flow-pos/',
  },
  releaseInfo: {
    releaseNotesFile: 'config/release-notes-last.md',
  },
};
