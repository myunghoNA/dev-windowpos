import { BrowserWindowConstructorOptions } from 'electron';

import { CONFIG } from '@main/config/common.config';

const { PATH, MAIN_WINDOW, DID_WINDOW, WIDGET_WINDOW, APP } = CONFIG;


/**
 * @private
 * @description 일렉트론 프레임워크 보안 표준(Security Checklist)을 준수하는 공통 웹 환경 최적화 설정
 */
const commonWebPreferences: BrowserWindowConstructorOptions['webPreferences'] = {
  preload: PATH.PRELOAD,
  nodeIntegration: false,              // [보안] 렌더러에서 Node.js API 직접 사용 허용 여부 
  contextIsolation: true,              // [보안] 메인과 렌더러의 컨텍스트를 격리
  webSecurity: false,                   // [보안] 브라우저의 방화벽(CORS, 로컬파일 접근 제한)
  allowRunningInsecureContent: false,  // [보안] 비보안 컨텐츠 실행 차단
};

/**
 * @description POS 멀티 스크린(메인 포스, 듀얼 DID, 미니 위젯) 구동용 네이티브 윈도우 옵션 셋 (Readonly)
 */
export const WINDOW_OPTIONS = {

  // ===========================================
  // 메인 포스 전면 스크린 옵션
  // ===========================================
  MAIN: {
    width: MAIN_WINDOW.DEFAULT_SIZE.WIDTH,
    height: MAIN_WINDOW.DEFAULT_SIZE.HEIGHT,
    minWidth: MAIN_WINDOW.DEFAULT_SIZE.MIN_WIDTH,
    minHeight: MAIN_WINDOW.DEFAULT_SIZE.MIN_HEIGHT,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#FFF',
    icon: APP.ICON,
    webPreferences: {
      ...commonWebPreferences,
      webviewTag: false,
    },
  },

  // ===========================================
  // 보조 모니터 고객 안내 및 결제 유도 DID 스크린 옵션
  // ===========================================
  DID: {
    width: DID_WINDOW.WIDTH,
    height: DID_WINDOW.HEIGHT,
    frame: true,
    show: false,
    fullscreen: true,
    autoHideMenuBar: true,
    closable: false,
    backgroundColor: '#FFF',
    icon: APP.ICON,
    webPreferences: commonWebPreferences,
  },

  // ===========================================
  // 바탕화면 상주형 미니 알림 위젯 스크린 옵션
  // ===========================================
  WIDGET: {
    width: WIDGET_WINDOW.WIDTH,
    height: WIDGET_WINDOW.HEIGHT,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: commonWebPreferences,
  },
} as const;