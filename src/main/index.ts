import { App, app, BrowserWindow, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';

import * as listener from '@main/listener';
//# Import Service
import {
  checkOpenPort,
  closeRabbitMQService,
  createWindow,
  initIpcBridge,
  sendLogToRenderer,
  setupEnvironment,
  setupTray,
  setupUpdateService,
  setupWebviewService,
  setupWindowEvents,
} from '@main/services';


const VITE_ES_URL = import.meta.env.VITE_ES_URL;

let mainWindow: BrowserWindow;

/**
 * @name initializeApp
 * @description Electron 앱 전체 초기화 
 */
function initializeApp(app: App) {

  const LOG_TITLE  = '[MAIN.INDEX]';
  const isSingleInstanceLock = app.requestSingleInstanceLock();  

  // ===========================================
  // 1. 중복 실행 방지
  //    이미 실행 중인 인스턴스가 있으면 즉시 종료
  // ===========================================
  if (!isSingleInstanceLock) {
    app.quit(); 
    return;
  }

  // ===========================================
  // 2. 앱 메타 정보
  // ===========================================
  app.setAppUserModelId('Flownet POS');


  // ===========================================
  // 3. 앱 레벨 이벤트/IPC 등록
  // ===========================================

  // 업데이트 관련 IPC 핸들러 등록
  listener.handleIpcAppUpdate(app, autoUpdater);

  // 앱 종료 직전 리소스 해제
  app.on('will-quit', async () => {
    await closeRabbitMQService();
  });

  // 모든 창이 닫혔을때 처리
  app.on('window-all-closed', () => {
    listener.onAllWindowsClosed(app);
  });

  // 중복 실행 시도 시 기존 창 활성화
  app.on('second-instance', () => {
    if (mainWindow) {
      listener.onSecondInstance(mainWindow)();
    }
  });

  // 허용사이트 인증서 무시
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      if (url.startsWith(VITE_ES_URL)) {
          event.preventDefault();
          callback(true); // 이 호스트는 인증서 오류를 무시하고 진행
      } else {
          callback(false); // 그 외는 기본 동작(차단) 유지
      }
  });


  // ===========================================
  // 4. 앱 준비 완료 후 
  // ===========================================
  app.whenReady().then(async () => {

    // 환경별 설정 주입
    await setupEnvironment();

    // 메인 윈도우 생성
    mainWindow = await createWindow();

    // Renderer ↔ Main IPC 브릿지 연결
    initIpcBridge(mainWindow);

    // 업데이트 알림/진행률 등 윈도우 연동 서비스 초기화
    setupUpdateService(mainWindow);

    // 웹뷰 서비스 초기화
    setupWebviewService(mainWindow);

    // 윈도우 라이프사이클 이벤트 초기화
    setupWindowEvents(mainWindow);
    
    // 트레이 아이콘 및 메뉴 구성
    setupTray(mainWindow);

    // 하드웨어/네트워크 포트 점유 상태 체크
    checkOpenPort();

    // 앱 업데이트 체크 : 렌더러에서 호출로 변경
    // autoUpdater.checkForUpdates().catch((e) => {
    //   sendLogToRenderer(`${LOG_TITLE} UPDATE_CHECK_FAILED `, { error: String(e) });
    // });
  })
  .catch((e) => {
    const errorMessage = e instanceof Error ? e.message : String(e);
    sendLogToRenderer(`${LOG_TITLE} APP_INIT_FAILED `, { error: errorMessage });
    
    dialog.showErrorBox(
      'Application Startup Error',
      `애플리케이션을 초기화하는 도중 오류가 발생.\n\n${errorMessage}`,
    );

  });
}

// 앱 진입점
initializeApp(app);