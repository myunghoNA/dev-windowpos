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
  appId: 'kr.flownet.pos',
  productName: 'flownet POS',
  copyright: 'Copyright ⓒ 2026 flownet Co., Ltd. All Rights Reserved.',

  // ===========================================
  //  ASAR 패키징 및 압축 예외 설정
  // ===========================================
  asar: false,
  extends: null,

  // ===========================================
  //  인풋 / 아웃풋 디렉터리 경로
  // ===========================================
  directories: {
    output: 'dist/app/prod',
    buildResources: 'build',
    app: 'dist/source',
  },

  // ===========================================
  //  외장 자원(Assets) 패키지 복사 설정
  // ===========================================
  extraResources: [
    {
      from: 'assets',
      to: 'assets', // 빌드 후 resources/assets 폴더로 복사
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
  },

  // ===========================================
  //  NSIS 인스톨러 / 언인스톨러 커스텀
  // ===========================================
  nsis: {
    createDesktopShortcut: 'always',
    shortcutName: '${productName}',
    artifactName: '${productName}_Setup_${version}.${ext}',
    uninstallDisplayName: '${productName} ${version}',
    installerLanguages: ['en_US', 'ko_KR'],
  },
  publish: {
    provider: 'generic',
    url: 'https://objectstorage.ap-chuncheon-1.oraclecloud.com/n/ax6h0epeabcw/b/nmh-pos-update/o/',
  },
  releaseInfo: {
    releaseNotesFile: 'config/release-notes-last.md',
  },
};
