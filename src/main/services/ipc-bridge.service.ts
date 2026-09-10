import { BrowserWindow } from 'electron';

import { MAIN_CHANNEL } from '@shared/constants';
// Import Service
import { appState } from '@main/services';
//# Import Type
import { MqStausType } from '@shared/types';

/** @description 메인 프로세스 전역에서 공유할 메인 윈도우 인스턴스 참조 보관소 */
let mainWindow: BrowserWindow | null = null;


/**
 * @private
 * @name send
 * @description [Internal] 렌더러 프로세스로 데이터를 전송하는 전역 공통 브릿지
 */
function send(channel: string, data: any): void {
    appState.runSafeWindowAction(mainWindow, (win) => {
        win.webContents.send(channel, data);
    });
}


/**
 * @private
 * @name formatIpcMessage
 * @description [Internal] 순환 참조나 네이티브 Error 객체를 안전하게 직렬화 가능한 문자열로 가공
 */
function formatIpcMessage(message: unknown): string {
    if (message === null || message === undefined) return String(message);

    if (typeof message === 'object') {
        try {

            if (message instanceof Error) {
                return `[Error] ${message.message} ${message.stack ? `\nStack: ${message.stack}` : ''}`;
            }
            
            if (Object.prototype.hasOwnProperty.call(message, 'toString') && typeof (message as any).toString === 'function') {
                return (message as any).toString();
            }

            return JSON.stringify(message);
        } catch (e: any) {
            // 파싱 실패 시 타입 네임과 예외 문구 조합 반환
            const constructorName = message.constructor?.name || 'UnknownObject';
            return `[Complex Object: ${constructorName}] Serialization Failed: ${e.message}`;
        }
    }
    
    return String(message);
}


/**
 * @name initIpcBridge
 * @description 앱 시동 시 메인 윈도우 인스턴스를 브릿지에 주입
 */
export function initIpcBridge(win: BrowserWindow): void {
    mainWindow = win;

    mainWindow.once('closed', () => {
        mainWindow = null;
    });
}


/**
 * @name sendLogToRenderer
 * @description 메인 프로세스의 동작 로그를 렌더러에 전송
 */
export function sendLogToRenderer(step: string, message: unknown): void {
    send(MAIN_CHANNEL.common.sendLog, { 
        step, 
        message: formatIpcMessage(message), 
    });
}


/**
 * @name sendPrintStatusToRenderer
 * @description 영수증/주방 프린터의 물리적 상태 렌더러에 전송
 */
export function sendPrintStatusToRenderer(step: string, message: unknown): void {
    send(MAIN_CHANNEL.printer.sendPrinterStatus, { 
        step, 
        message: formatIpcMessage(message), 
    });
}


/**
 * @name sendAppUpdateCheck
 * @description 자동 업데이트 라이프사이클의 진행 단계 플래그 상태를 
 *              렌더러에 전송
 */
export function sendAppUpdateCheck(status: string): void {
    send(MAIN_CHANNEL.common.sendAppUpdateCheck, status);
}

/**
 * @name sendAppUpdateProgress
 * @description 바이너리 패키지 다운로드 진행률 객체(퍼센트, 속도 등)를 
 *              렌더러에 전송
 */
export function sendAppUpdateProgress(progressObj: unknown): void {
    send(MAIN_CHANNEL.common.sendAppUpdateProgress, progressObj);
}


/**
 * @name sendGoPageToRenderer
 * @description 특정 시스템 이벤트(예: 알림 클릭) 발생 시 리액트 라우터를 
 *              강제로 특정 페이지로 이동 유도
 */
export function sendGoPageToRenderer(pageObj: { url: string; title?: string }): void {
    send(MAIN_CHANNEL.alarm.sendGoPage, pageObj);
}


/**
 * @name sendMqConnectStatus
 * @description MQ 접속상태를 렌더러에 전송
 */
export function sendMqConnectStatus(status: MqStausType): void {
    send(MAIN_CHANNEL.rabbitmq.sendConnectStatus, status);
}