import { App, BrowserWindow, ipcMain, Notification, WebContentsView } from 'electron';
import nodePortScanner from 'node-port-scanner';
import os from 'os';
import { SerialPort } from 'serialport';

import { CONFIG } from '@main/config/common.config';
import { RENDERER_CHANNEL } from '@shared/constants';

//# Import Zatca
import { complianceInvoice, requestCsid, requestInvoiceCheck } from '@main/zatca/main.zatca';
//# Import Printer
import { sendToPrinter } from '@main/printer/com-gateway.printer';
//# Import Services
import { appState, closeRabbitMQService, sendGoPageToRenderer, sendLogToRenderer, setupRabbitMQService } from '@main/services';
//# Import Helper
import { isNewerVersion } from '@main/common/helper';
//# Import Type
import {
    AppControlType,
    AppUpdateCheckResult,
    ComplianceResponse,
    ComResponseType,
    CurrentSession,
    LangType,
    NotificationInfo,
    PrinterSendItem,
    WindowControlType,
} from '@shared/types';


let isWidgetEnabled = false;

/**
 * @name handleIpcAppUpdate
 * @description 앱 업데이트 관련 IPC 핸들러를 등록.
 */
export function handleIpcAppUpdate(app:App, autoUpdater:any): void {

    /**
     * @channels getAppUpdateCheck
     * @description 수동 업데이트 확인 버튼 클릭 시 메인 서비스의 검사 프로세스 트리거
     */
    ipcMain.handle(RENDERER_CHANNEL.common.getAppUpdateCheck, async (): Promise<ComResponseType> => {
        
        try {
           const isEnabled = app.isPackaged;

           if (!isEnabled) {
              return { isSuccess: false, errorMessage: 'NOT_PACKAGED' };
           }

           await autoUpdater.checkForUpdates();
           return { isSuccess: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            sendLogToRenderer('[Update Check Error]', errorMessage);
            return { isSuccess: false, errorMessage: 'CHECK_FAILED' };
        }
    });
    

    /**
     * @channels getUpdateInfoAndProvider
     * @description 렌더러가 구동되거나 설정 창에 진입할 때 최신 버전 정보를 동기적으로 비교 분석하여 반환
     */
    ipcMain.handle(RENDERER_CHANNEL.common.getUpdateInfoAndProvider, async (): Promise<AppUpdateCheckResult> => {
        
        const currentVersion = app.getVersion();
        try {

            // 업데이트 정보 조회
            const result = await autoUpdater.getUpdateInfoAndProvider();

            if (!result) {
                return { isUpdateAble: false, currentVersion, latestVersion: null };
            }

            const latestVersion = result.info.version;
            const isUpdateAble = isNewerVersion(latestVersion, currentVersion);

            return {
              isUpdateAble,
              latestVersion,
              currentVersion,
              releaseDate: result.info.releaseDate,
            };
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            sendLogToRenderer('[Update Check Error]', errorMessage);
            
            return {
                isUpdateAble: false,
                currentVersion,
                latestVersion: null,
                errorMessage: 'CHECK_FAILED',
            };
        }
    });
}

/**
 * @name handleIpcCommon
 * @description RabbitMQ 연결 관리 IPC 핸들러 
 */
export function handleIpcRabbitMQ(mainWindow: BrowserWindow): void {

    const LOG_TITLE = '[IPC:Main] RabbitMQ IPC';

    /**
     * @channels rabbitmq.connect
     * @description 로그인 후 RabbitMQ 연결 요청 수신
     */
    ipcMain.handle(RENDERER_CHANNEL.rabbitmq.connect, async (_event, session:CurrentSession): Promise<ComResponseType> => {
       
        try {
            await setupRabbitMQService(mainWindow, session);
            return { isSuccess: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            sendLogToRenderer(`${LOG_TITLE} Connect Error`, errorMessage);
            return { isSuccess: false, errorMessage };
        }
    });

    /**
     * @channels rabbitmq.disconnect
     * @description  RabbitMQ 연결 해제
     */
    ipcMain.handle(RENDERER_CHANNEL.rabbitmq.disconnect, async (): Promise<ComResponseType> => {
       
        try {
            await closeRabbitMQService();
            return { isSuccess: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            sendLogToRenderer(`${LOG_TITLE} Connect Error`, errorMessage);
            return { isSuccess: false, errorMessage };
        }
    }); 
}


/**
 * @name handleIpcCommon
 * @description 공통 관리 IPC 핸들 
 */
export function handleIpcCommon(mainWindow: BrowserWindow, app:App): void {

    /**
     * @channels getIpcMainReport
     * @description Ipc 메인 이벤트 레포트 확인
     */
    ipcMain.handle(RENDERER_CHANNEL.common.getIpcMainReport, () => {
    
        const report: Array<{ Type: string; Channel: string; Listeners: number }> = [];
        
        const eventNames = ipcMain.eventNames();
        eventNames.forEach((ch) => {
            const channelName = ch as string;
            report.push({
                Type: 'ipcMain.on (이벤트)',
                Channel: channelName,
                Listeners: ipcMain.listenerCount(channelName),
            });
        });

        const invokeHandlers = (ipcMain as any)._invokeHandlers;
        if (invokeHandlers instanceof Map) {
            for (const channelName of invokeHandlers.keys()) {
                report.push({
                    Type: 'ipcMain.handle (비동기)',
                    Channel: channelName,
                    Listeners: 1, 
                });
            }
        }

        if (report.length === 0) {
            const message = '현재 등록된 메인 IPC 채널이 존재하지 않습니다.';
            console.log(message);
            return ;
        } else {
            console.table(report);
            return report;
        }

    });

    /**
     * @channels getSystemInfo
     * @description App 버전 및 시스템 정보 요청 (Form 렌더러)
     */
    ipcMain.handle(RENDERER_CHANNEL.common.getSystemInfo, () => {
        return {
            version: app.getVersion(),
            platform: os.platform(),     // win32, darwin 등
            arch: os.arch(),             // x64, arm64
            osRelease: os.release(),
            locale: app.getLocale(),
            isPackaged: app.isPackaged,
            userDataPath: app.getPath('userData'),
            totalMemory: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB', // GB 단위 변환
        };
    });


    /**
     * @channels getIsOpenPortCheck
     * @description 렌더러 프로세스(UI) 요청에 따라 특정 로컬 포트(127.0.0.1)의 점유 및 개방 여부를 스캔하여 반환
     */
    ipcMain.handle(RENDERER_CHANNEL.common.getIsOpenPortCheck, async (_event, payload): Promise<ComResponseType> => {
        const LOG_TITLE = '[IPC:Main] Open Port Check';
        const checkPort = Number(payload?.checkPort);

        if (!checkPort || isNaN(checkPort) || checkPort < 0 || checkPort > 65535) {
            const errorResponse: ComResponseType = { 
                isSuccess: false, 
                resultMessage: 'INVALID_PORT_NUMBER', 
            };
            sendLogToRenderer(LOG_TITLE, { error: '유효하지 않은 포트 번호 요청', payload });
            return errorResponse;
        }

        try {
            // 로컬 호스트를 대상으로 해당 포트 인덱스가 열려있는지 비동기 스캔
            const results = await nodePortScanner('127.0.0.1', [checkPort]);
            const response: ComResponseType = { 
                isSuccess: true, 
                resultMessage: results, 
            };
            
            sendLogToRenderer(LOG_TITLE, response);
            return response;

        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error);
            
            const response: ComResponseType = { 
                isSuccess: false, 
                resultMessage: `PORT_SCAN_FAILED: ${errorMessage}`, 
            };
            
            sendLogToRenderer(LOG_TITLE, response);
            return response;
        }
    
    }); 


    /**
     * @channels sendAppControlAction
     * @description 커스텀 타이틀바(웹 UI)의 윈도우 컨트롤 버튼(최소화/최대화/종료) 클릭 시 메인 윈도우 창 상태 제어
     */
    ipcMain.handle(RENDERER_CHANNEL.common.sendAppControlAction, (_event, controlId: AppControlType)  => {

        const LOG_TITLE = '[IPC:Main] App Control Action';

        if (!controlId) return;

        if(!appState.isWindowValid(mainWindow)){
           sendLogToRenderer(`${LOG_TITLE} ERROR`, '유효하지 않은 메인 윈도우 참조 인터셉트');
            return;
        }

        switch (controlId) {
            case 'maximize':
                if (mainWindow.isMaximized()) {
                    mainWindow.restore(); // 최대화 상태면 이전 크기로 복구
                } else {
                    mainWindow.maximize(); // 아니면 최대화
                }
                break;

            case 'minimize':
                mainWindow.minimize(); // 최소화
                break;

            case 'close':
                mainWindow.close(); // 앱 종료
                break;

            default:
               sendLogToRenderer(`${LOG_TITLE} WARN`, `정의되지 않은 controlId 수신: ${controlId}`);
            break;
        }
    });

    /**
     * @channels sendSetLangType
     * @description 렌더러의 언어설정 정보를 메인 언어 설정
     */
    ipcMain.handle(RENDERER_CHANNEL.common.sendSetLangType, (_event, langType: LangType)  => {

        const LOG_TITLE = '[IPC:Main] 언어설정';

        sendLogToRenderer(`${LOG_TITLE} INFO`, `${appState.language} -> ${langType}`);

        appState.language = langType;
        
        if (typeof appState.triggerLanguageChange === 'function') {
            appState.triggerLanguageChange();
        }
    });

}


/**
 * @name handleIpcPrinter
 * @description 프린터 관리 IPC 핸들러를 등록 
 */
export function handleIpcPrinter(mainWindow: BrowserWindow): void {
    
    const LOG_TITLE = '[IPC:Main] Printer Service';

   /**
     * @channels getSerialPort
     * @description 장치 관리자에 잡힌 시리얼(RS232C/COM) 프린터 포트 리스트를 동적으로 스캔하여 반환
     */
    ipcMain.handle(RENDERER_CHANNEL.printer.getSerialPorts, async (): Promise<ComResponseType> => {
        try {
            const ports = await SerialPort.list();
            sendLogToRenderer(`${LOG_TITLE} SERIAL_FETCH`, `사용 가능한 시리얼 포트 개수: ${ports.length}`);

            return {
                isSuccess: true,
                resultMessage: ports,
            };

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            sendLogToRenderer(`${LOG_TITLE} SERIAL_ERROR`, `시리얼 포트 스캔 중 예외 발생: ${errorMsg}`);
            
            // 에러 발생 시 규격화된 응답 반환
            return {
                isSuccess: false,
                errorMessage: errorMsg,
            };
        }
    });

   /**
     * @channels getWindowPrinters
     * @description 윈도우 프린터장치의 리스트를 동적으로 스캔하여 반환
     */
    ipcMain.handle(RENDERER_CHANNEL.printer.getWindowPrinters, async (): Promise<ComResponseType> => {
        try {

            const printers:any = await mainWindow.webContents.getPrintersAsync();
            
            return {
                isSuccess: true,
                resultMessage: printers,
            };

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            sendLogToRenderer(`${LOG_TITLE} WINDOW_PRINTER_ERROR`, `윈도우 프린터 스캔 중 예외 발생: ${errorMsg}`);
            
            // 에러 발생 시 규격화된 응답 반환
            return {
                isSuccess: false,
                errorMessage: errorMsg,
            };
        }
    });

   /**
     * @channels sendToPrinter
     * @description 주문 내역 및 결제 영수증 데이터를 로컬/네트워크 프린터 큐(Queue)로 전송
     */
    ipcMain.handle(RENDERER_CHANNEL.printer.sendToPrinter, async (_event, payload:PrinterSendItem) => {
        await sendToPrinter(payload);
    });

}


/**
 * @name handleDidWindow
 * @description 렌더러 프로세스(UI) 요청에 따라 듀얼 모니터 창의 보이기/숨기기 제어
 */
export function handleDidWindow(didWindow: BrowserWindow): void {

    const LOG_TITLE = '[IPC:Main] DID Window Service';

   /**
     * @channels sendDidControlAction
     * @description 고객화면 토글 액션 처리 (show: 활성화 / hide: 숨김)
     */
    ipcMain.handle(RENDERER_CHANNEL.did.sendDidControlAction, async (_event, controlId: WindowControlType) => {

        try {

            if (!controlId) return;

            if(!appState.isWindowValid(didWindow)){
                sendLogToRenderer(`${LOG_TITLE} WARN`, '고객화면(DID) 윈도우 인스턴스가 존재하지 않거나 파괴된 상태입니다.');
                return;
            }

            sendLogToRenderer(LOG_TITLE, `고객화면 제어 요청 수신: ${controlId}`);

            switch (controlId) {
                
                case 'show':
                    didWindow.showInactive();
                    break;

                case 'hide':
                    didWindow.hide();
                    break;
                    
                default:
                    sendLogToRenderer(`${LOG_TITLE} WARN`, `정의되지 않은 controlId 수신: ${controlId}`);
                    break;
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            sendLogToRenderer(`${LOG_TITLE} EXCEPTION`, `DID 창 제어 중 예외 발생: ${errorMsg}`);
        }
    }); 
}


/**
 * @name handleAlarm
 * @description 신규 주문 전송 등 매장 알림 필요 시 윈도우 네이티브 OS 알림 팝업 및 작업 표시줄(Taskbar) 플래시 효과
 */
export function handleAlarm(mainWindow: BrowserWindow): void {

    const LOG_TITLE = '[IPC:Main] Alarm Service';

   /**
     * @channels sendNotification
     * @description 렌더러로부터 신규 알림 요청 수신 시 토스트 알림 실행
     */
    ipcMain.handle(RENDERER_CHANNEL.alarm.sendNotification, async (_event, payload:NotificationInfo) => {
    
        try {
            if(!appState.isWindowValid(mainWindow)){
                sendLogToRenderer(`${LOG_TITLE} WARN`, '메인 윈도우가 없거나 이미 파괴되어 알림 연동을 패스합니다.');
                return;
            }

            sendLogToRenderer(LOG_TITLE, { message: '알림 요청 수신', payload });

            const NOTIFICATION_TITLE = payload.title;
            const NOTIFICATION_BODY  = payload.body;

            const notification = new Notification({
                title: NOTIFICATION_TITLE,
                body: NOTIFICATION_BODY,
                icon: CONFIG.APP.ICON,
                silent: false,        // OS 기본 알림음 활성화
                timeoutType: 'never', // 직원이 인지할 때까지 알림 유지 모드 수립
                urgency: 'critical',  // 주문 누락 방지를 위한 최상위 중요도 마크
            });


            // 매장 직원이 확인할때까지 태스크바 아이콘을 깜빡이게 유도
            mainWindow.flashFrame(true);
            
            // 직원이 포스화면을 터치하거나 클릭(Focus)해 인지하면 깜빡임 자동 해제
            mainWindow.once('focus', () => {
                appState.runSafeWindowAction(mainWindow, (win) => {
                     win.flashFrame(false);
                });
            });


            notification.on('click', () => {
                sendLogToRenderer(`${LOG_TITLE} CLICK`, '사용자가 OS 알림을 클릭하여 주문 상세로 내비게이션 시작');

                appState.runSafeWindowAction(mainWindow, (win) => {
                    if (win.isMinimized()) win.restore();
                    win.show();
                    win.focus();
                    win.flashFrame(false);
                });
                
                //TODO:// 프론트엔드 라우터를 주문 상세 페이지 화면으로 강제 리다이렉트 트리거
                sendGoPageToRenderer({ url: '/order-detail', title: '주문 상세 보기' });
            });

            // 최종 알림 표출
            notification.show();

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            sendLogToRenderer(`${LOG_TITLE} EXCEPTION`, `네이티브 알림 구동 중 예외 발생: ${errorMsg}`);
        }
    });
}


/**
 * @name handleWidgetWindow
 * @description 메인 포스 창의 최소화/복원 생명주기에 맞추어 바탕화면 미니 위젯 창의 노출 상태를 관리
 */
export function handleWidgetWindow(mainWindow: BrowserWindow, widgetWindow: BrowserWindow): void {

    const LOG_TITLE = '[IPC:Main] Widget Window Service';

    if(!appState.isWindowValid(mainWindow)) return;
    
    mainWindow.on('minimize', () => {
        if (isWidgetEnabled) {
            appState.runSafeWindowAction(widgetWindow, (widget) => {
                widget.showInactive();
                sendLogToRenderer(`${LOG_TITLE} LIFECYCLE`, '메인 창 최소화로 인한 위젯 창 노출');
            });
        }
    });

    mainWindow.on('restore', () => {
        appState.runSafeWindowAction(widgetWindow, (widget) => {
            widget.hide();
            sendLogToRenderer(`${LOG_TITLE} LIFECYCLE`, '메인 창 복원으로 인한 위젯 창 숨김 처리');
        });
    });

   /**
     * @channels sendWidgetControlAction
     * @description 리액트 설정 화면 등에서 직원이 '미니 위젯 사용 여부'를 토글할 때 상태 플래그 동기화
     */
    // eslint-disable-next-line complexity
    ipcMain.handle(RENDERER_CHANNEL.widget.sendWidgetControlAction, async (_event, controlId:WindowControlType) => {

        try {
            if (!controlId) return;

            sendLogToRenderer(LOG_TITLE, `위젯 제어 명령 수신: ${controlId}`);

            if (controlId === 'show') {
                isWidgetEnabled = true;
                if (mainWindow.isMinimized()) {
                    appState.runSafeWindowAction(widgetWindow, (widget) => widget.showInactive());
                }
            } else if (controlId === 'hide') {
                isWidgetEnabled = false;
                appState.runSafeWindowAction(widgetWindow, (widget) => widget.hide());
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            sendLogToRenderer(`${LOG_TITLE} EXCEPTION`, `위젯 제어 중 오류: ${errorMsg}`);
        }
    }); 
}

/**
 * @name handleIpcWebview
 * @description 외부 사이트
 */
export function handleIpcWebview(webview: WebContentsView): void {

    /**
     * @channels sendLoadView
     * @description 
     */
    ipcMain.handle(RENDERER_CHANNEL.webview.sendLoadView, (_event, webviewUrl: string)  => {
        webview?.webContents.loadURL(webviewUrl);
    });

    /**
     * @channels sendSetBounds
     * @description 
     */
    ipcMain.handle(RENDERER_CHANNEL.webview.sendSetBounds, (_event, bounds: Electron.Rectangle)  => {
        webview?.setBounds(bounds);
    });

    /**
     * @channels sendHideView
     * @description 
     */
    ipcMain.handle(RENDERER_CHANNEL.webview.sendHideView, ()  => {
        webview?.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    });
}


/**
 * @name handleIpcZatcaAPI
 * @description ZATCA 통신 관리 IPC 핸들러를 등록 
 */
export function handleIpcZatcaAPI(): void {

    /**
     * @channels getRequestCsid
     * @description CSR 제출 → Compliance CSID 발급 (온보딩 1회 시행)
     *              CSR을 전송해서 Compliance CSID + Secret 발급
     */
    ipcMain.handle(RENDERER_CHANNEL.zatca.requestCsid, async (): Promise<ComplianceResponse> => {

        const csrData = 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ0ZUQ0NBYndDQVFBd2RURUxNQWtHQTFVRUJoTUNVMEV4RmpBVUJnTlZCQXNNRFZKcGVXRmthQ0JDY21GdQpZMmd4SmpBa0JnTlZCQW9NSFUxaGVHbHRkVzBnVTNCbFpXUWdWR1ZqYUNCVGRYQndiSGtnVEZSRU1TWXdKQVlEClZRUUREQjFVVTFRdE9EZzJORE14TVRRMUxUTTVPVGs1T1RrNU9Ua3dNREF3TXpCV01CQUdCeXFHU000OUFnRUcKQlN1QkJBQUtBMElBQktGZ2ltdEVtdlJTQkswenI5TGdKQXRWU0NsOFZQWno2Y2RyNVgrTW9USG84dkhOTmx5Vwo1UTZ1N1Q4bmFQSnF0R29UakpqYVBJTUo0dTE3ZFNrL1ZIaWdnZWN3Z2VRR0NTcUdTSWIzRFFFSkRqR0IxakNCCjB6QWhCZ2tyQmdFRUFZSTNGQUlFRkF3U1drRlVRMEV0UTI5a1pTMVRhV2R1YVc1bk1JR3RCZ05WSFJFRWdhVXcKZ2FLa2daOHdnWnd4T3pBNUJnTlZCQVFNTWpFdFZGTlVmREl0VkZOVWZETXRaV1F5TW1ZeFpEZ3RaVFpoTWkweApNVEU0TFRsaU5UZ3RaRGxoT0dZeE1XVTBORFZtTVI4d0hRWUtDWkltaVpQeUxHUUJBUXdQTXprNU9UazVPVGs1Ck9UQXdNREF6TVEwd0N3WURWUVFNREFReE1UQXdNUkV3RHdZRFZRUWFEQWhTVWxKRU1qa3lPVEVhTUJnR0ExVUUKRHd3UlUzVndjR3g1SUdGamRHbDJhWFJwWlhNd0NnWUlLb1pJemowRUF3SURSd0F3UkFJZ1NHVDBxQkJ6TFJHOApJS09melI1L085S0VicHA4bWc3V2VqUlllZkNZN3VRQ0lGWjB0U216MzAybmYvdGo0V2FxbVYwN01qZVVkVnVvClJJckpLYkxtUWZTNwotLS0tLUVORCBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0K';
        const otpData = '123345';

       return requestCsid(csrData,otpData,'en');

    });

    /**
     * @channels requestInvoiceCheck
     * @description 단계 2: Compliance Invoice 검증
     *              Production CSID 발급 전 인보이스 유효성 검사
     */
    ipcMain.handle(RENDERER_CHANNEL.zatca.requestInvoiceCheck, async (): Promise<ComplianceResponse> => {

        const savedBinarySecurityToken = 'TUlJQ1BqQ0NBZU9nQXdJQkFnSUdBWjhtMHptR01Bb0dDQ3FHU000OUJBTUNNQlV4RXpBUkJnTlZCQU1NQ21WSmJuWnZhV05wYm1jd0hoY05Nall3TnpBek1EY3hNekU1V2hjTk16RXdOekF5TWpFd01EQXdXakIxTVFzd0NRWURWUVFHRXdKVFFURVdNQlFHQTFVRUN3d05VbWw1WVdSb0lFSnlZVzVqYURFbU1DUUdBMVVFQ2d3ZFRXRjRhVzExYlNCVGNHVmxaQ0JVWldOb0lGTjFjSEJzZVNCTVZFUXhKakFrQmdOVkJBTU1IVlJUVkMwNE9EWTBNekV4TkRVdE16azVPVGs1T1RrNU9UQXdNREF6TUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVvV0NLYTBTYTlGSUVyVE92MHVBa0MxVklLWHhVOW5QcHgydmxmNHloTWVqeThjMDJYSmJsRHE3dFB5ZG84bXEwYWhPTW1Obzhnd25pN1h0MUtUOVVlS09Cd1RDQnZqQU1CZ05WSFJNQkFmOEVBakFBTUlHdEJnTlZIUkVFZ2FVd2dhS2tnWjh3Z1p3eE96QTVCZ05WQkFRTU1qRXRWRk5VZkRJdFZGTlVmRE10WldReU1tWXhaRGd0WlRaaE1pMHhNVEU0TFRsaU5UZ3RaRGxoT0dZeE1XVTBORFZtTVI4d0hRWUtDWkltaVpQeUxHUUJBUXdQTXprNU9UazVPVGs1T1RBd01EQXpNUTB3Q3dZRFZRUU1EQVF4TVRBd01SRXdEd1lEVlFRYURBaFNVbEpFTWpreU9URWFNQmdHQTFVRUR3d1JVM1Z3Y0d4NUlHRmpkR2wyYVhScFpYTXdDZ1lJS29aSXpqMEVBd0lEU1FBd1JnSWhBSW0xVDRndzNQaHkybWk0MExZK2NrdERpQTNCMG9LdzlrRy9NREZLN3cwekFpRUFoQXF5YnczazE3WHRtdUY5dWlsV0w1ZWdqclRKLzlVMUNTd1UrYmVQZU1BPQ=='.replace(/\s/g, '');
        const savedSecret = 'u8hKfXHSnqJXo8Rn1RZwvk0d5/EH9H3K0onTLP8f0ac='.replace(/\s/g, '');

        const token = btoa(`${savedBinarySecurityToken}:${savedSecret}`);

        const invoiceHash = 'V4U5qlZ3yXQ/Si1AC/R8SLc3F+iNy27wdVe8IWRqFAQ=';
        const encodedInvoice = 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPEludm9pY2UgeG1sbnM9InVybjpvYXNpczpuYW1lczpzcGVjaWZpY2F0aW9uOnVibDpzY2hlbWE6eHNkOkludm9pY2UtMiIgeG1sbnM6Y2FjPSJ1cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6c2NoZW1hOnhzZDpDb21tb25BZ2dyZWdhdGVDb21wb25lbnRzLTIiIHhtbG5zOmNiYz0idXJuOm9hc2lzOm5hbWVzOnNwZWNpZmljYXRpb246dWJsOnNjaGVtYTp4c2Q6Q29tbW9uQmFzaWNDb21wb25lbnRzLTIiIHhtbG5zOmV4dD0idXJuOm9hc2lzOm5hbWVzOnNwZWNpZmljYXRpb246dWJsOnNjaGVtYTp4c2Q6Q29tbW9uRXh0ZW5zaW9uQ29tcG9uZW50cy0yIj48ZXh0OlVCTEV4dGVuc2lvbnM+CiAgICA8ZXh0OlVCTEV4dGVuc2lvbj4KICAgICAgICA8ZXh0OkV4dGVuc2lvblVSST51cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6ZHNpZzplbnZlbG9wZWQ6eGFkZXM8L2V4dDpFeHRlbnNpb25VUkk+CiAgICAgICAgPGV4dDpFeHRlbnNpb25Db250ZW50PgogICAgICAgICAgICA8c2lnOlVCTERvY3VtZW50U2lnbmF0dXJlcyB4bWxuczpzaWc9InVybjpvYXNpczpuYW1lczpzcGVjaWZpY2F0aW9uOnVibDpzY2hlbWE6eHNkOkNvbW1vblNpZ25hdHVyZUNvbXBvbmVudHMtMiIgeG1sbnM6c2FjPSJ1cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6c2NoZW1hOnhzZDpTaWduYXR1cmVBZ2dyZWdhdGVDb21wb25lbnRzLTIiIHhtbG5zOnNiYz0idXJuOm9hc2lzOm5hbWVzOnNwZWNpZmljYXRpb246dWJsOnNjaGVtYTp4c2Q6U2lnbmF0dXJlQmFzaWNDb21wb25lbnRzLTIiPgogICAgICAgICAgICAgICAgPHNhYzpTaWduYXR1cmVJbmZvcm1hdGlvbj4gCiAgICAgICAgICAgICAgICAgICAgPGNiYzpJRD51cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6c2lnbmF0dXJlOjE8L2NiYzpJRD4KICAgICAgICAgICAgICAgICAgICA8c2JjOlJlZmVyZW5jZWRTaWduYXR1cmVJRD51cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6c2lnbmF0dXJlOkludm9pY2U8L3NiYzpSZWZlcmVuY2VkU2lnbmF0dXJlSUQ+CiAgICAgICAgICAgICAgICAgICAgPGRzOlNpZ25hdHVyZSB4bWxuczpkcz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnIyIgSWQ9InNpZ25hdHVyZSI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxkczpTaWduZWRJbmZvPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOkNhbm9uaWNhbGl6YXRpb25NZXRob2QgQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy8yMDA2LzEyL3htbC1jMTRuMTEiLz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpTaWduYXR1cmVNZXRob2QgQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNlY2RzYS1zaGEyNTYiLz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpSZWZlcmVuY2UgSWQ9Imludm9pY2VTaWduZWREYXRhIiBVUkk9IiI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOlRyYW5zZm9ybXM+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpUcmFuc2Zvcm0gQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy9UUi8xOTk5L1JFQy14cGF0aC0xOTk5MTExNiI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZHM6WFBhdGg+bm90KC8vYW5jZXN0b3Itb3Itc2VsZjo6ZXh0OlVCTEV4dGVuc2lvbnMpPC9kczpYUGF0aD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kczpUcmFuc2Zvcm0+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpUcmFuc2Zvcm0gQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy9UUi8xOTk5L1JFQy14cGF0aC0xOTk5MTExNiI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZHM6WFBhdGg+bm90KC8vYW5jZXN0b3Itb3Itc2VsZjo6Y2FjOlNpZ25hdHVyZSk8L2RzOlhQYXRoPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2RzOlRyYW5zZm9ybT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOlRyYW5zZm9ybSBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnL1RSLzE5OTkvUkVDLXhwYXRoLTE5OTkxMTE2Ij4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpYUGF0aD5ub3QoLy9hbmNlc3Rvci1vci1zZWxmOjpjYWM6QWRkaXRpb25hbERvY3VtZW50UmVmZXJlbmNlW2NiYzpJRD0nUVInXSk8L2RzOlhQYXRoPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2RzOlRyYW5zZm9ybT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOlRyYW5zZm9ybSBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDYvMTIveG1sLWMxNG4xMSIvPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZHM6VHJhbnNmb3Jtcz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZHM6RGlnZXN0TWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8wNC94bWxlbmMjc2hhMjU2Ii8+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOkRpZ2VzdFZhbHVlPlY0VTVxbFozeVhRL1NpMUFDL1I4U0xjM0YraU55Mjd3ZFZlOElXUnFGQVE9PC9kczpEaWdlc3RWYWx1ZT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZHM6UmVmZXJlbmNlPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOlJlZmVyZW5jZSBUeXBlPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwLzA5L3htbGRzaWcjU2lnbmF0dXJlUHJvcGVydGllcyIgVVJJPSIjeGFkZXNTaWduZWRQcm9wZXJ0aWVzIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZHM6RGlnZXN0TWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8wNC94bWxlbmMjc2hhMjU2Ii8+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOkRpZ2VzdFZhbHVlPk9EUXdOVGcxTlRCaE1qTXpNMll4WTJaa1pqVmtZemRsTlRaaVpqWTBPREpqTWpOa1lXSTRNVFV6TmpkbU5EVmpNakF3WlRCak9EYzJZVE5oTVdRMU5nPT08L2RzOkRpZ2VzdFZhbHVlPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kczpSZWZlcmVuY2U+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvZHM6U2lnbmVkSW5mbz4KICAgICAgICAgICAgICAgICAgICAgICAgPGRzOlNpZ25hdHVyZVZhbHVlPk1FVUNJQnh5UjhyYzRLODcyOHdkU0Y0WFNEcVBzK3JJTCszVEZoOW0rYU54UVB0U0FpRUE2Y0hhcEl0dnAxM3lNU3U2Nk5iT2cyQ3BvbUh3VVNuWUo5aDZ1R1E2NWFZPTwvZHM6U2lnbmF0dXJlVmFsdWU+CiAgICAgICAgICAgICAgICAgICAgICAgIDxkczpLZXlJbmZvPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOlg1MDlEYXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpYNTA5Q2VydGlmaWNhdGU+TUlJRDNqQ0NBNFNnQXdJQkFnSVRFUUFBT0FQRjkwQWpzL3hjWHdBQkFBQTRBekFLQmdncWhrak9QUVFEQWpCaU1SVXdFd1lLQ1pJbWlaUHlMR1FCR1JZRmJHOWpZV3d4RXpBUkJnb0praWFKay9Jc1pBRVpGZ05uYjNZeEZ6QVZCZ29Ka2lhSmsvSXNaQUVaRmdkbGVIUm5ZWHAwTVJzd0dRWURWUVFERXhKUVVscEZTVTVXVDBsRFJWTkRRVFF0UTBFd0hoY05NalF3TVRFeE1Ea3hPVE13V2hjTk1qa3dNVEE1TURreE9UTXdXakIxTVFzd0NRWURWUVFHRXdKVFFURW1NQ1FHQTFVRUNoTWRUV0Y0YVcxMWJTQlRjR1ZsWkNCVVpXTm9JRk4xY0hCc2VTQk1WRVF4RmpBVUJnTlZCQXNURFZKcGVXRmthQ0JDY21GdVkyZ3hKakFrQmdOVkJBTVRIVlJUVkMwNE9EWTBNekV4TkRVdE16azVPVGs1T1RrNU9UQXdNREF6TUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVvV0NLYTBTYTlGSUVyVE92MHVBa0MxVklLWHhVOW5QcHgydmxmNHloTWVqeThjMDJYSmJsRHE3dFB5ZG84bXEwYWhPTW1Obzhnd25pN1h0MUtUOVVlS09DQWdjd2dnSURNSUd0QmdOVkhSRUVnYVV3Z2FLa2daOHdnWnd4T3pBNUJnTlZCQVFNTWpFdFZGTlVmREl0VkZOVWZETXRaV1F5TW1ZeFpEZ3RaVFpoTWkweE1URTRMVGxpTlRndFpEbGhPR1l4TVdVME5EVm1NUjh3SFFZS0NaSW1pWlB5TEdRQkFRd1BNems1T1RrNU9UazVPVEF3TURBek1RMHdDd1lEVlFRTURBUXhNVEF3TVJFd0R3WURWUVFhREFoU1VsSkVNamt5T1RFYU1CZ0dBMVVFRHd3UlUzVndjR3g1SUdGamRHbDJhWFJwWlhNd0hRWURWUjBPQkJZRUZFWCtZdm1tdG5Zb0RmOUJHYktvN29jVEtZSzFNQjhHQTFVZEl3UVlNQmFBRkp2S3FxTHRtcXdza0lGelZ2cFAyUHhUKzlObk1Ic0dDQ3NHQVFVRkJ3RUJCRzh3YlRCckJnZ3JCZ0VGQlFjd0FvWmZhSFIwY0RvdkwyRnBZVFF1ZW1GMFkyRXVaMjkyTG5OaEwwTmxjblJGYm5KdmJHd3ZVRkphUlVsdWRtOXBZMlZUUTBFMExtVjRkR2RoZW5RdVoyOTJMbXh2WTJGc1gxQlNXa1ZKVGxaUFNVTkZVME5CTkMxRFFTZ3hLUzVqY25Rd0RnWURWUjBQQVFIL0JBUURBZ2VBTUR3R0NTc0dBUVFCZ2pjVkJ3UXZNQzBHSlNzR0FRUUJnamNWQ0lHR3FCMkUwUHNTaHUyZEpJZk8reG5Ud0ZWbWgvcWxaWVhaaEQ0Q0FXUUNBUkl3SFFZRFZSMGxCQll3RkFZSUt3WUJCUVVIQXdNR0NDc0dBUVVGQndNQ01DY0dDU3NHQVFRQmdqY1ZDZ1FhTUJnd0NnWUlLd1lCQlFVSEF3TXdDZ1lJS3dZQkJRVUhBd0l3Q2dZSUtvWkl6ajBFQXdJRFNBQXdSUUloQUxFL2ljaG1uV1hDVUtVYmNhM3ljaThvcXdhTHZGZEhWalFydmVJOXVxQWJBaUE5aEM0TThqZ01CQURQU3ptZDJ1aVBKQTZnS1IzTEUwM1U3NWVxYkMvclhBPT08L2RzOlg1MDlDZXJ0aWZpY2F0ZT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZHM6WDUwOURhdGE+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvZHM6S2V5SW5mbz4KICAgICAgICAgICAgICAgICAgICAgICAgPGRzOk9iamVjdD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx4YWRlczpRdWFsaWZ5aW5nUHJvcGVydGllcyB4bWxuczp4YWRlcz0iaHR0cDovL3VyaS5ldHNpLm9yZy8wMTkwMy92MS4zLjIjIiBUYXJnZXQ9InNpZ25hdHVyZSI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHhhZGVzOlNpZ25lZFByb3BlcnRpZXMgSWQ9InhhZGVzU2lnbmVkUHJvcGVydGllcyI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx4YWRlczpTaWduZWRTaWduYXR1cmVQcm9wZXJ0aWVzPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHhhZGVzOlNpZ25pbmdUaW1lPjIwMjQtMDEtMTRUMTA6MjE6NDA8L3hhZGVzOlNpZ25pbmdUaW1lPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHhhZGVzOlNpZ25pbmdDZXJ0aWZpY2F0ZT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8eGFkZXM6Q2VydD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHhhZGVzOkNlcnREaWdlc3Q+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZHM6RGlnZXN0TWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8wNC94bWxlbmMjc2hhMjU2Ii8+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZHM6RGlnZXN0VmFsdWU+WkRNd01tSTBNVEUxTnpWak9UVTJOVGs0WXpWbE9EaGhZbUkwT0RVMk5EVXlOVFUyWVRWaFlqaGhNREZtTjJGallqazFZVEEyT1dRME5qWTJNalE0TlE9PTwvZHM6RGlnZXN0VmFsdWU+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwveGFkZXM6Q2VydERpZ2VzdD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHhhZGVzOklzc3VlclNlcmlhbD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkczpYNTA5SXNzdWVyTmFtZT5DTj1QUlpFSU5WT0lDRVNDQTQtQ0EsIERDPWV4dGdhenQsIERDPWdvdiwgREM9bG9jYWw8L2RzOlg1MDlJc3N1ZXJOYW1lPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRzOlg1MDlTZXJpYWxOdW1iZXI+Mzc5MTEyNzQyODMxMzgwNDcxODM1MjYzOTY5NTg3Mjg3NjYzNTIwNTI4Mzg3PC9kczpYNTA5U2VyaWFsTnVtYmVyPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3hhZGVzOklzc3VlclNlcmlhbD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3hhZGVzOkNlcnQ+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3hhZGVzOlNpZ25pbmdDZXJ0aWZpY2F0ZT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC94YWRlczpTaWduZWRTaWduYXR1cmVQcm9wZXJ0aWVzPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwveGFkZXM6U2lnbmVkUHJvcGVydGllcz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwveGFkZXM6UXVhbGlmeWluZ1Byb3BlcnRpZXM+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvZHM6T2JqZWN0PgogICAgICAgICAgICAgICAgICAgIDwvZHM6U2lnbmF0dXJlPgogICAgICAgICAgICAgICAgPC9zYWM6U2lnbmF0dXJlSW5mb3JtYXRpb24+CiAgICAgICAgICAgIDwvc2lnOlVCTERvY3VtZW50U2lnbmF0dXJlcz4KICAgICAgICA8L2V4dDpFeHRlbnNpb25Db250ZW50PgogICAgPC9leHQ6VUJMRXh0ZW5zaW9uPgo8L2V4dDpVQkxFeHRlbnNpb25zPgogICAgCiAgICA8Y2JjOlByb2ZpbGVJRD5yZXBvcnRpbmc6MS4wPC9jYmM6UHJvZmlsZUlEPgogICAgPGNiYzpJRD5TTUUwMDAyMzwvY2JjOklEPgogICAgPGNiYzpVVUlEPjhkNDg3ODE2LTcwYjgtNGFkZS1hNjE4LTlkNjIwYjczODE0YTwvY2JjOlVVSUQ+CiAgICA8Y2JjOklzc3VlRGF0ZT4yMDIyLTA5LTA3PC9jYmM6SXNzdWVEYXRlPgogICAgPGNiYzpJc3N1ZVRpbWU+MTI6MjE6Mjg8L2NiYzpJc3N1ZVRpbWU+CiAgICA8Y2JjOkludm9pY2VUeXBlQ29kZSBuYW1lPSIwMTAwMDAwIj4zODg8L2NiYzpJbnZvaWNlVHlwZUNvZGU+CiAgICA8Y2JjOkRvY3VtZW50Q3VycmVuY3lDb2RlPlNBUjwvY2JjOkRvY3VtZW50Q3VycmVuY3lDb2RlPgogICAgPGNiYzpUYXhDdXJyZW5jeUNvZGU+U0FSPC9jYmM6VGF4Q3VycmVuY3lDb2RlPgogICAgPGNhYzpBZGRpdGlvbmFsRG9jdW1lbnRSZWZlcmVuY2U+CiAgICAgICAgPGNiYzpJRD5JQ1Y8L2NiYzpJRD4KICAgICAgICA8Y2JjOlVVSUQ+MjM8L2NiYzpVVUlEPgogICAgPC9jYWM6QWRkaXRpb25hbERvY3VtZW50UmVmZXJlbmNlPgogICAgPGNhYzpBZGRpdGlvbmFsRG9jdW1lbnRSZWZlcmVuY2U+CiAgICAgICAgPGNiYzpJRD5QSUg8L2NiYzpJRD4KICAgICAgICA8Y2FjOkF0dGFjaG1lbnQ+CiAgICAgICAgICAgIDxjYmM6RW1iZWRkZWREb2N1bWVudEJpbmFyeU9iamVjdCBtaW1lQ29kZT0idGV4dC9wbGFpbiI+TldabFkyVmlOalptWm1NNE5tWXpPR1E1TlRJM09EWmpObVEyT1Raak56bGpNbVJpWXpJek9XUmtOR1U1TVdJME5qY3lPV1EzTTJFeU4yWmlOVGRsT1E9PTwvY2JjOkVtYmVkZGVkRG9jdW1lbnRCaW5hcnlPYmplY3Q+CiAgICAgICAgPC9jYWM6QXR0YWNobWVudD4KICAgIDwvY2FjOkFkZGl0aW9uYWxEb2N1bWVudFJlZmVyZW5jZT4KICAgIAogICAgCiAgICA8Y2FjOkFkZGl0aW9uYWxEb2N1bWVudFJlZmVyZW5jZT4KICAgICAgICA8Y2JjOklEPlFSPC9jYmM6SUQ+CiAgICAgICAgPGNhYzpBdHRhY2htZW50PgogICAgICAgICAgICA8Y2JjOkVtYmVkZGVkRG9jdW1lbnRCaW5hcnlPYmplY3QgbWltZUNvZGU9InRleHQvcGxhaW4iPkFXL1l0Tml4MllQWXFTRFlxdG1JMkxIWml0aXZJTmluMllUWXF0bUQyWWJaaU5tRTJZallyTm1LMktjZzJLallvOW1DMkxYWmlTRFlzOWl4MkxuWXFTRFlwOW1FMllYWXJkaXYyWWpZcjlpcElId2dUV0Y0YVcxMWJTQlRjR1ZsWkNCVVpXTm9JRk4xY0hCc2VTQk1WRVFDRHpNNU9UazVPVGs1T1Rrd01EQXdNd01UTWpBeU1pMHdPUzB3TjFReE1qb3lNVG95T0FRRU5DNDJNQVVETUM0MkJpeG1LekJYUTNGdVVHdEpia2tyWlV3NVJ6Tk1RWEo1TVRKbVZGQm1LM1J2UXpsVldEQTNSalJtU1N0elBRZGdUVVZWUTBsQ2VIbFNPSEpqTkVzNE56STRkMlJUUmpSWVUwUnhVSE1yY2tsTUt6TlVSbWc1YlN0aFRuaFJVSFJUUVdsRlFUWmpTR0Z3U1hSMmNERXplVTFUZFRZMlRtSlBaekpEY0c5dFNIZFZVMjVaU2psb05uVkhVVFkxWVZrOUNGZ3dWakFRQmdjcWhrak9QUUlCQmdVcmdRUUFDZ05DQUFTaFlJcHJSSnIwVWdTdE02L1M0Q1FMVlVncGZGVDJjK25IYStWL2pLRXg2UEx4elRaY2x1VU9ydTAvSjJqeWFyUnFFNHlZMmp5RENlTHRlM1VwUDFSNDwvY2JjOkVtYmVkZGVkRG9jdW1lbnRCaW5hcnlPYmplY3Q+CiAgICAgICAgPC9jYWM6QXR0YWNobWVudD4KPC9jYWM6QWRkaXRpb25hbERvY3VtZW50UmVmZXJlbmNlPjxjYWM6U2lnbmF0dXJlPgogICAgICA8Y2JjOklEPnVybjpvYXNpczpuYW1lczpzcGVjaWZpY2F0aW9uOnVibDpzaWduYXR1cmU6SW52b2ljZTwvY2JjOklEPgogICAgICA8Y2JjOlNpZ25hdHVyZU1ldGhvZD51cm46b2FzaXM6bmFtZXM6c3BlY2lmaWNhdGlvbjp1Ymw6ZHNpZzplbnZlbG9wZWQ6eGFkZXM8L2NiYzpTaWduYXR1cmVNZXRob2Q+CjwvY2FjOlNpZ25hdHVyZT48Y2FjOkFjY291bnRpbmdTdXBwbGllclBhcnR5PgogICAgICAgIDxjYWM6UGFydHk+CiAgICAgICAgICAgIDxjYWM6UGFydHlJZGVudGlmaWNhdGlvbj4KICAgICAgICAgICAgICAgIDxjYmM6SUQgc2NoZW1lSUQ9IkNSTiI+MTAxMDAxMDAwMDwvY2JjOklEPgogICAgICAgICAgICA8L2NhYzpQYXJ0eUlkZW50aWZpY2F0aW9uPgogICAgICAgICAgICA8Y2FjOlBvc3RhbEFkZHJlc3M+CiAgICAgICAgICAgICAgICA8Y2JjOlN0cmVldE5hbWU+2KfZhNin2YXZitixINiz2YTYt9in2YYgfCBQcmluY2UgU3VsdGFuPC9jYmM6U3RyZWV0TmFtZT4KICAgICAgICAgICAgICAgIDxjYmM6QnVpbGRpbmdOdW1iZXI+MjMyMjwvY2JjOkJ1aWxkaW5nTnVtYmVyPgogICAgICAgICAgICAgICAgPGNiYzpDaXR5U3ViZGl2aXNpb25OYW1lPtin2YTZhdix2KjYuSB8IEFsLU11cmFiYmE8L2NiYzpDaXR5U3ViZGl2aXNpb25OYW1lPgogICAgICAgICAgICAgICAgPGNiYzpDaXR5TmFtZT7Yp9mE2LHZitin2LYgfCBSaXlhZGg8L2NiYzpDaXR5TmFtZT4KICAgICAgICAgICAgICAgIDxjYmM6UG9zdGFsWm9uZT4yMzMzMzwvY2JjOlBvc3RhbFpvbmU+CiAgICAgICAgICAgICAgICA8Y2FjOkNvdW50cnk+CiAgICAgICAgICAgICAgICAgICAgPGNiYzpJZGVudGlmaWNhdGlvbkNvZGU+U0E8L2NiYzpJZGVudGlmaWNhdGlvbkNvZGU+CiAgICAgICAgICAgICAgICA8L2NhYzpDb3VudHJ5PgogICAgICAgICAgICA8L2NhYzpQb3N0YWxBZGRyZXNzPgogICAgICAgICAgICA8Y2FjOlBhcnR5VGF4U2NoZW1lPgogICAgICAgICAgICAgICAgPGNiYzpDb21wYW55SUQ+Mzk5OTk5OTk5OTAwMDAzPC9jYmM6Q29tcGFueUlEPgogICAgICAgICAgICAgICAgPGNhYzpUYXhTY2hlbWU+CiAgICAgICAgICAgICAgICAgICAgPGNiYzpJRD5WQVQ8L2NiYzpJRD4KICAgICAgICAgICAgICAgIDwvY2FjOlRheFNjaGVtZT4KICAgICAgICAgICAgPC9jYWM6UGFydHlUYXhTY2hlbWU+CiAgICAgICAgICAgIDxjYWM6UGFydHlMZWdhbEVudGl0eT4KICAgICAgICAgICAgICAgIDxjYmM6UmVnaXN0cmF0aW9uTmFtZT7YtNix2YPYqSDYqtmI2LHZitivINin2YTYqtmD2YbZiNmE2YjYrNmK2Kcg2KjYo9mC2LXZiSDYs9ix2LnYqSDYp9mE2YXYrdiv2YjYr9ipIHwgTWF4aW11bSBTcGVlZCBUZWNoIFN1cHBseSBMVEQ8L2NiYzpSZWdpc3RyYXRpb25OYW1lPgogICAgICAgICAgICA8L2NhYzpQYXJ0eUxlZ2FsRW50aXR5PgogICAgICAgIDwvY2FjOlBhcnR5PgogICAgPC9jYWM6QWNjb3VudGluZ1N1cHBsaWVyUGFydHk+CiAgICAgPGNhYzpBY2NvdW50aW5nQ3VzdG9tZXJQYXJ0eT4KICAgICAgICA8Y2FjOlBhcnR5PgogICAgICAgICAgICA8Y2FjOlBvc3RhbEFkZHJlc3M+CiAgICAgICAgICAgICAgICA8Y2JjOlN0cmVldE5hbWU+2LXZhNin2K0g2KfZhNiv2YrZhiB8IFNhbGFoIEFsLURpbjwvY2JjOlN0cmVldE5hbWU+CiAgICAgICAgICAgICAgICA8Y2JjOkJ1aWxkaW5nTnVtYmVyPjExMTE8L2NiYzpCdWlsZGluZ051bWJlcj4KICAgICAgICAgICAgICAgIDxjYmM6Q2l0eVN1YmRpdmlzaW9uTmFtZT7Yp9mE2YXYsdmI2KwgfCBBbC1NdXJvb2o8L2NiYzpDaXR5U3ViZGl2aXNpb25OYW1lPgogICAgICAgICAgICAgICAgPGNiYzpDaXR5TmFtZT7Yp9mE2LHZitin2LYgfCBSaXlhZGg8L2NiYzpDaXR5TmFtZT4KICAgICAgICAgICAgICAgIDxjYmM6UG9zdGFsWm9uZT4xMjIyMjwvY2JjOlBvc3RhbFpvbmU+CiAgICAgICAgICAgICAgICA8Y2FjOkNvdW50cnk+CiAgICAgICAgICAgICAgICAgICAgPGNiYzpJZGVudGlmaWNhdGlvbkNvZGU+U0E8L2NiYzpJZGVudGlmaWNhdGlvbkNvZGU+CiAgICAgICAgICAgICAgICA8L2NhYzpDb3VudHJ5PgogICAgICAgICAgICA8L2NhYzpQb3N0YWxBZGRyZXNzPgogICAgICAgICAgICA8Y2FjOlBhcnR5VGF4U2NoZW1lPgogICAgICAgICAgICAgICAgPGNiYzpDb21wYW55SUQ+Mzk5OTk5OTk5ODAwMDAzPC9jYmM6Q29tcGFueUlEPgogICAgICAgICAgICAgICAgPGNhYzpUYXhTY2hlbWU+CiAgICAgICAgICAgICAgICAgICAgPGNiYzpJRD5WQVQ8L2NiYzpJRD4KICAgICAgICAgICAgICAgIDwvY2FjOlRheFNjaGVtZT4KICAgICAgICAgICAgPC9jYWM6UGFydHlUYXhTY2hlbWU+CiAgICAgICAgICAgIDxjYWM6UGFydHlMZWdhbEVudGl0eT4KICAgICAgICAgICAgICAgIDxjYmM6UmVnaXN0cmF0aW9uTmFtZT7YtNix2YPYqSDZhtmF2KfYsNisINmB2KfYqtmI2LHYqSDYp9mE2YXYrdiv2YjYr9ipIHwgRmF0b29yYSBTYW1wbGVzIExURDwvY2JjOlJlZ2lzdHJhdGlvbk5hbWU+CiAgICAgICAgICAgIDwvY2FjOlBhcnR5TGVnYWxFbnRpdHk+CiAgICAgICAgPC9jYWM6UGFydHk+CiAgICA8L2NhYzpBY2NvdW50aW5nQ3VzdG9tZXJQYXJ0eT4KICAgIDxjYWM6RGVsaXZlcnk+CiAgICAgICAgPGNiYzpBY3R1YWxEZWxpdmVyeURhdGU+MjAyMi0wOS0wNzwvY2JjOkFjdHVhbERlbGl2ZXJ5RGF0ZT4KICAgIDwvY2FjOkRlbGl2ZXJ5PgogICAgPGNhYzpQYXltZW50TWVhbnM+CiAgICAgICAgPGNiYzpQYXltZW50TWVhbnNDb2RlPjEwPC9jYmM6UGF5bWVudE1lYW5zQ29kZT4KICAgIDwvY2FjOlBheW1lbnRNZWFucz4KICAgIDxjYWM6QWxsb3dhbmNlQ2hhcmdlPgogICAgICAgIDxjYmM6Q2hhcmdlSW5kaWNhdG9yPmZhbHNlPC9jYmM6Q2hhcmdlSW5kaWNhdG9yPgogICAgICAgIDxjYmM6QWxsb3dhbmNlQ2hhcmdlUmVhc29uPmRpc2NvdW50PC9jYmM6QWxsb3dhbmNlQ2hhcmdlUmVhc29uPgogICAgICAgIDxjYmM6QW1vdW50IGN1cnJlbmN5SUQ9IlNBUiI+MC4wMDwvY2JjOkFtb3VudD4KICAgICAgICA8Y2FjOlRheENhdGVnb3J5PgogICAgICAgICAgICA8Y2JjOklEIHNjaGVtZUlEPSJVTi9FQ0UgNTMwNSIgc2NoZW1lQWdlbmN5SUQ9IjYiPlM8L2NiYzpJRD4KICAgICAgICAgICAgPGNiYzpQZXJjZW50PjE1PC9jYmM6UGVyY2VudD4KICAgICAgICAgICAgPGNhYzpUYXhTY2hlbWU+CiAgICAgICAgICAgICAgICA8Y2JjOklEIHNjaGVtZUlEPSJVTi9FQ0UgNTE1MyIgc2NoZW1lQWdlbmN5SUQ9IjYiPlZBVDwvY2JjOklEPgogICAgICAgICAgICA8L2NhYzpUYXhTY2hlbWU+CiAgICAgICAgPC9jYWM6VGF4Q2F0ZWdvcnk+CiAgICA8L2NhYzpBbGxvd2FuY2VDaGFyZ2U+CiAgICA8Y2FjOlRheFRvdGFsPgogICAgICAgIDxjYmM6VGF4QW1vdW50IGN1cnJlbmN5SUQ9IlNBUiI+MC42PC9jYmM6VGF4QW1vdW50PgogICAgPC9jYWM6VGF4VG90YWw+CiAgICA8Y2FjOlRheFRvdGFsPgogICAgICAgIDxjYmM6VGF4QW1vdW50IGN1cnJlbmN5SUQ9IlNBUiI+MC42PC9jYmM6VGF4QW1vdW50PgogICAgICAgIDxjYWM6VGF4U3VidG90YWw+CiAgICAgICAgICAgIDxjYmM6VGF4YWJsZUFtb3VudCBjdXJyZW5jeUlEPSJTQVIiPjQuMDA8L2NiYzpUYXhhYmxlQW1vdW50PgogICAgICAgICAgICA8Y2JjOlRheEFtb3VudCBjdXJyZW5jeUlEPSJTQVIiPjAuNjA8L2NiYzpUYXhBbW91bnQ+CiAgICAgICAgICAgICA8Y2FjOlRheENhdGVnb3J5PgogICAgICAgICAgICAgICAgIDxjYmM6SUQgc2NoZW1lSUQ9IlVOL0VDRSA1MzA1IiBzY2hlbWVBZ2VuY3lJRD0iNiI+UzwvY2JjOklEPgogICAgICAgICAgICAgICAgIDxjYmM6UGVyY2VudD4xNS4wMDwvY2JjOlBlcmNlbnQ+CiAgICAgICAgICAgICAgICA8Y2FjOlRheFNjaGVtZT4KICAgICAgICAgICAgICAgICAgIDxjYmM6SUQgc2NoZW1lSUQ9IlVOL0VDRSA1MTUzIiBzY2hlbWVBZ2VuY3lJRD0iNiI+VkFUPC9jYmM6SUQ+CiAgICAgICAgICAgICAgICA8L2NhYzpUYXhTY2hlbWU+CiAgICAgICAgICAgICA8L2NhYzpUYXhDYXRlZ29yeT4KICAgICAgICA8L2NhYzpUYXhTdWJ0b3RhbD4KICAgIDwvY2FjOlRheFRvdGFsPgogICAgPGNhYzpMZWdhbE1vbmV0YXJ5VG90YWw+CiAgICAgICAgPGNiYzpMaW5lRXh0ZW5zaW9uQW1vdW50IGN1cnJlbmN5SUQ9IlNBUiI+NC4wMDwvY2JjOkxpbmVFeHRlbnNpb25BbW91bnQ+CiAgICAgICAgPGNiYzpUYXhFeGNsdXNpdmVBbW91bnQgY3VycmVuY3lJRD0iU0FSIj40LjAwPC9jYmM6VGF4RXhjbHVzaXZlQW1vdW50PgogICAgICAgIDxjYmM6VGF4SW5jbHVzaXZlQW1vdW50IGN1cnJlbmN5SUQ9IlNBUiI+NC42MDwvY2JjOlRheEluY2x1c2l2ZUFtb3VudD4KICAgICAgICA8Y2JjOkFsbG93YW5jZVRvdGFsQW1vdW50IGN1cnJlbmN5SUQ9IlNBUiI+MC4wMDwvY2JjOkFsbG93YW5jZVRvdGFsQW1vdW50PgogICAgICAgIDxjYmM6UHJlcGFpZEFtb3VudCBjdXJyZW5jeUlEPSJTQVIiPjAuMDA8L2NiYzpQcmVwYWlkQW1vdW50PgogICAgICAgIDxjYmM6UGF5YWJsZUFtb3VudCBjdXJyZW5jeUlEPSJTQVIiPjQuNjA8L2NiYzpQYXlhYmxlQW1vdW50PgogICAgPC9jYWM6TGVnYWxNb25ldGFyeVRvdGFsPgogICAgPGNhYzpJbnZvaWNlTGluZT4KICAgICAgICA8Y2JjOklEPjE8L2NiYzpJRD4KICAgICAgICA8Y2JjOkludm9pY2VkUXVhbnRpdHkgdW5pdENvZGU9IlBDRSI+Mi4wMDAwMDA8L2NiYzpJbnZvaWNlZFF1YW50aXR5PgogICAgICAgIDxjYmM6TGluZUV4dGVuc2lvbkFtb3VudCBjdXJyZW5jeUlEPSJTQVIiPjQuMDA8L2NiYzpMaW5lRXh0ZW5zaW9uQW1vdW50PgogICAgICAgIDxjYWM6VGF4VG90YWw+CiAgICAgICAgICAgICA8Y2JjOlRheEFtb3VudCBjdXJyZW5jeUlEPSJTQVIiPjAuNjA8L2NiYzpUYXhBbW91bnQ+CiAgICAgICAgICAgICA8Y2JjOlJvdW5kaW5nQW1vdW50IGN1cnJlbmN5SUQ9IlNBUiI+NC42MDwvY2JjOlJvdW5kaW5nQW1vdW50PgogICAgICAgIDwvY2FjOlRheFRvdGFsPgogICAgICAgIDxjYWM6SXRlbT4KICAgICAgICAgICAgPGNiYzpOYW1lPtmC2YTZhSDYsdi12KfYtTwvY2JjOk5hbWU+CiAgICAgICAgICAgIDxjYWM6Q2xhc3NpZmllZFRheENhdGVnb3J5PgogICAgICAgICAgICAgICAgPGNiYzpJRD5TPC9jYmM6SUQ+CiAgICAgICAgICAgICAgICA8Y2JjOlBlcmNlbnQ+MTUuMDA8L2NiYzpQZXJjZW50PgogICAgICAgICAgICAgICAgPGNhYzpUYXhTY2hlbWU+CiAgICAgICAgICAgICAgICAgICAgPGNiYzpJRD5WQVQ8L2NiYzpJRD4KICAgICAgICAgICAgICAgIDwvY2FjOlRheFNjaGVtZT4KICAgICAgICAgICAgPC9jYWM6Q2xhc3NpZmllZFRheENhdGVnb3J5PgogICAgICAgIDwvY2FjOkl0ZW0+CiAgICAgICAgPGNhYzpQcmljZT4KICAgICAgICAgICAgPGNiYzpQcmljZUFtb3VudCBjdXJyZW5jeUlEPSJTQVIiPjIuMDA8L2NiYzpQcmljZUFtb3VudD4KICAgICAgICA8L2NhYzpQcmljZT4KICAgIDwvY2FjOkludm9pY2VMaW5lPgo8L0ludm9pY2U+';

       return requestInvoiceCheck(encodedInvoice,invoiceHash,token);

    });

    /**
     * @channels complianceInvoice
     * @description 단계 2: Compliance Invoice 검증
     *              Production CSID 발급 전 인보이스 유효성 검사
     */
    ipcMain.handle(RENDERER_CHANNEL.zatca.complianceInvoice, async (_event, certData:any, invoiceData:any): Promise<ComplianceResponse> => {
       return complianceInvoice(certData, invoiceData);
    });


}