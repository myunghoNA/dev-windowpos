import { BrowserWindow, Menu, app, screen } from 'electron';

import { isDev, isProd } from '@main/common/helper';
import { CONFIG, WINDOW_OPTIONS } from '@main/config';
import { appState, sendLogToRenderer } from '@main/services';

import {
  handleAlarm,
  handleDidWindow,
  handleIpcCommon,
  handleIpcPrinter,
  handleIpcRabbitMQ,
  handleIpcZatcaAPI,
  handleWidgetWindow,
} from '@main/listener';



const LOG_TITLE = '[CREATE-WINDOW.SERVICE]';

const MAIN_CONFIG   = CONFIG.MAIN_WINDOW;
const DID_CONFIG    = CONFIG.DID_WINDOW;
const WIDGET_CONFIG = CONFIG.WIDGET_WINDOW;

const WINDOWS = {
    main: null as BrowserWindow | null,
    did: null as BrowserWindow | null,
    widget: null as BrowserWindow | null,
};


/**
 * @name createWindow
 * @description [Core] POS 앱 기동 및 핵심 하드웨어 및 IPC 서비스 리스너를 매핑
 */
export async function createWindow(): Promise<BrowserWindow> {

  const appName = CONFIG.APP.TITLE;

  // =============================================================
  // 1.메인 윈도우 생성 및 빌드
  // =============================================================
  const mainWindowInstance = new BrowserWindow({
      ...WINDOW_OPTIONS.MAIN,
      show: false,
  });
  WINDOWS.main = mainWindowInstance;

  //# 네이티브 속성 및 데코레이터 주입
  const appTitle = `${appName} (v ${app.getVersion()})`;
  WINDOWS.main.setTitle(appTitle);

  //# IPC 메인 리스너 선등록
  initMainEventListeners(WINDOWS.main);
  setupMenu(WINDOWS.main);
  setupShortcuts(WINDOWS.main);

  //# 개발자 도구 조기 오픈 (디버깅 편의성)
  openDevTools(WINDOWS.main);


  // =============================================================
  // 2. 서브 윈도우(DID, 미니 위젯) 동기식 인스턴스 조기 확보
  // =============================================================
  setupDidWindow(WINDOWS.main, appName);
  setupMiniWidget(WINDOWS.main);


  // =============================================================
  // 3. UI 렌더링 화면 표출 이벤트 훅 바인딩
  // =============================================================
  WINDOWS.main.once('ready-to-show', () => {
      appState.runSafeWindowAction(WINDOWS.main, (win) => {
          if (isProd()) win.maximize();
          win.show();
      });
  });


  // =============================================================
  // 4. [UX 최적화] 무거운 웹 자원 로딩(loadURL) 비동기 병렬 처리
  // =============================================================
  const loadTasks: Promise<void>[] = [];

  // 메인 창 로드 태스크 추가
  loadTasks.push(
      mainWindowInstance.loadURL(MAIN_CONFIG.URL).catch((error) => {
          sendLogToRenderer(`${LOG_TITLE} MAIN_LOAD_ERROR`, `메인 화면 로드 실패: ${error}`);
      }),
  );
  
  // DID 창 로드 태스크 추가
  if (appState.isWindowValid(WINDOWS.did)) {
      const didUrl = DID_CONFIG.URL.includes('?') ? `${DID_CONFIG.URL}&windowType=did` : `${DID_CONFIG.URL}?windowType=did`;
      loadTasks.push(
          WINDOWS.did.loadURL(didUrl).catch((error) => {
              sendLogToRenderer(`${LOG_TITLE} DID_LOAD_ERROR`, `고객 DID 화면 로드 실패: ${error}`);
          }),
      );
  }

  // 위젯 창 로드 태스크 추가
  if (appState.isWindowValid(WINDOWS.widget)) {
      const widgetUrl = WIDGET_CONFIG.URL.includes('?') ? `${WIDGET_CONFIG.URL}&windowType=widget` : `${WIDGET_CONFIG.URL}?windowType=widget`;
      loadTasks.push(
          WINDOWS.widget.loadURL(widgetUrl).catch((error) => {
              sendLogToRenderer(`${LOG_TITLE} WIDGET_LOAD_ERROR`, `미니 위젯 화면 로드 실패: ${error}`);
          }),
      );
  }

  // 모든 윈도우 리소스 동시 병렬 처리
  await Promise.all(loadTasks);

  return WINDOWS.main;
}


/**
 * @private
 * @name initMainEventListeners
 * @description 공통 통신, 프린터 연동, 알림 제어용 IPC 리스너 일괄 바인딩
 */
function initMainEventListeners(main: BrowserWindow): void{
  handleIpcRabbitMQ(main);
  handleIpcCommon(main, app);
  handleIpcPrinter(main);
  handleAlarm(main);
  handleIpcZatcaAPI();
}


/**
 * @private
 * @name setupDidWindow
 * @description 매장 듀얼 모니터 세팅을 감지하여 보조 디스플레이 영역에 고객 안내용 DID 윈도우 빌드
 */
function setupDidWindow(mainWindow: BrowserWindow, appName: string) {
  const displays        = screen.getAllDisplays();
  const externalDisplay = displays.find((d) => d.bounds.x !== 0 || d.bounds.y !== 0);

  const options = externalDisplay 
    ? { ...WINDOW_OPTIONS.DID, x: externalDisplay.bounds.x + 50, y: externalDisplay.bounds.y + 50 }
    : { ...WINDOW_OPTIONS.DID, fullscreen: false };
  
  WINDOWS.did = new BrowserWindow(options);
  
  // DID 이벤트 리스너 설정
  handleDidWindow(WINDOWS.did);
  WINDOWS.did.setTitle(appName);

  //개발툴 오픈
  // openDevTools(Windows.did);
}



/**
 * @private
 * @name setupMiniWidget
 * @description 기본 모니터 우측 하단 워크스페이스 영역 좌표를 계산 및 대기용 미니 위젯 윈도우 빌드
 */
function setupMiniWidget(mainWindow: BrowserWindow): void {
  
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  const widgetW = WIDGET_CONFIG.WIDTH;
  const widgetH = WIDGET_CONFIG.HEIGHT;

  const x = screenW - widgetW - 20;
  const y = screenH - widgetH - 20;

  WINDOWS.widget = new BrowserWindow({ ...WINDOW_OPTIONS.WIDGET, x, y });

  handleWidgetWindow(mainWindow, WINDOWS.widget);
}



/**
 * @private
 * @function setupMenu
 * @description 시스템 가속기 및 포스기 네이티브 컨텍스트 탑 메뉴 맵 빌드
 */
function setupMenu(mainWindow: BrowserWindow): void {
  const menuTemplate: any = [
    {
      label: '창',
      submenu: [
        { label: '전체 화면 전환', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: '실제 크기', role: 'resetzoom' },
        { label: '확대 (+)', role: 'zoomIn', accelerator: 'CommandOrControl+=' },
        { label: '축소 (-)', role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { type: 'separator' },
        { label: '강제 새로고침', role: 'forceReload' },
      ],
    },
    {
      label: '네트워크',
      submenu: [
        { 
          label: '서버 연결 상태 확인', 
          click: () => {
            // // 간단한 fetch 테스트 후 결과 전달
            // window.webContents.send('check-server-status');
          }, 
        },
        { 
          label: '현재 모드: ' + (process.env.MODE === 'dev' ? '개발' : '운영'),
          enabled: false,
        },
      ],
    },
  ];

  const newMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(newMenu);
  mainWindow.setMenu(newMenu);
}


/**
 * @private
 * @function setupShortcuts
 * @description 포스기 유지보수 및 현장 장애 테스트용 단축키(Ctrl+D 개발자도구 토글) 인젝션
 */
function setupShortcuts(mainWindow: BrowserWindow): void {
    // 개발자도구
    mainWindow.webContents.on('before-input-event', (event, input) => {
      const isKeyCtrlD = input.control && input.key.toLowerCase() === 'd' && input.type === 'keyDown';
      if (isKeyCtrlD) {
            appState.runSafeWindowAction(mainWindow, (win) => {
              win.webContents.toggleDevTools();
              sendLogToRenderer('개발자도구 Toggle', 'Local Shortcut: Ctrl+D');
          });
          event.preventDefault();
      }
    });
}



/**
 * @private
 * @name openDevTools
 * @description 개발 환경 실행 시 윈도우 인스턴스로부터 DevTools 독립 분리 레이어로 팝업
 */
function openDevTools(win: BrowserWindow) {
  if (isDev()) win.webContents.openDevTools({ mode: 'detach' });
}


// =============================================================
// 5. 프로세스 파괴 전 자원 일괄 정리 (OS Resource Cleanup)
// =============================================================
app.on('before-quit', () => {
  [WINDOWS.did, WINDOWS.widget, WINDOWS.main].forEach((win) => {
      if (appState.isWindowValid(win)) {
          win.destroy();
      }
  });
});