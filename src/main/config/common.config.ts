import { join } from 'path';
import { pathToFileURL } from 'url';

import { isDev } from '@main/common/helper/env.helper';

const env = import.meta.env;


/**
 * @private
 * @name getWindowUrl
 * @description [Helper] 개발(Vite HMR) 및 배포(File URL) 환경에 맞추어 리소스를 빌드
 */
const getWindowUrl = (fileName: string = 'index.html') => {
  if (isDev()) {
    return fileName === 'index.html' 
      ? env.VITE_DEV_SERVER_URL 
      : `${env.VITE_DEV_SERVER_URL.replace(/\/$/, '')}/${fileName}`;
  }
  return pathToFileURL(join(__dirname, `../renderer/${fileName}`)).toString();
};

/**
 * @description POS 일렉트론 메인 프로세스 글로벌 코어 인프라 설정 상수 맵 (Readonly)
 */
export const CONFIG = {

  // ===========================================
  // 애플리케이션 식별자 및 메타 정보
  // ===========================================
  APP: {
    TITLE: env.VITE_APP_TITLE || 'Flownet POS',
    ICON: join(__dirname, 'app_icon.ico'),
    VERSION: env.VITE_APP_VERSION || '1.0.0',
  },

  // ===========================================
  // 일렉트론 컨텍스트 브릿지 분리 아키텍처 경로
  // ===========================================
  PATH: {
    PRELOAD: join(__dirname, '../preload/index.cjs.js'),
  },

  // ===========================================
  // 메인 포스 스크린 레이아웃 규격 설정
  // ===========================================
  MAIN_WINDOW: {
    URL: getWindowUrl('index.html'),
    DEFAULT_SIZE: {
      WIDTH: 1024,
      HEIGHT: 750,
      MIN_WIDTH: 800,
      MIN_HEIGHT: 750,
    },
    PRESETS: {
      MEDIUM: { width: 345, height: 695 },
      SMALL: { width: 345, height: 385 },
    },
  },

  // ===========================================
  // 듀얼 모니터 고객 DID 광고/결제 스크린 설정
  // ===========================================
  DID_WINDOW: {
    URL: getWindowUrl('did-index.html'),
    WIDTH: 800,
    HEIGHT: 800,
  },

  // ===========================================
  // 바탕화면 상주용 초미니 알림 위젯 스크린 설정
  // ===========================================
  WIDGET_WINDOW: {
    URL: `${getWindowUrl('index.html')}#/mini-widget`,
    WIDTH: 200,
    HEIGHT: 80,
  },
} as const;


