import { SerialPort } from 'serialport';

import { customQueue } from '@main/common/helper/custom-queue.helper';
import { SerialPrinterItem } from '@shared/types';
// Import Service
import {
    sendLogToRenderer,
    sendPrintStatusToRenderer,
} from '@main/services';


const LOG_TITLE = '[EXCUTE-SERIALPORT.PRINTER]'; 
const EXPIRATION_TIME = 1000 * 60 * 5;
const STATUS_TIMEOUT_MS = 500;

let LAST_RUN_TIME: number;
let IS_PRINTING: boolean = false;

// ESC/POS 표준 상태 질의 명령어
const CHECK_STATUS_COMMAND = Buffer.from([0x10, 0x04, 0x02]); // 전송 상태 요청 (DLE EOT n)

/**
 * 프린터 상태 바이트 디코딩 (DLE EOT 2 기준)
 */
function parsePrinterStatus(statusByte: number) {
    const isOffline = !!(statusByte & 0x08);          // Bit 3: 0=Online, 1=Offline
    const isWaitingRecovery = !!(statusByte & 0x20);  // Bit 5: 1=Waiting for online recovery (Paper end/Cover open)
    const isError = !!(statusByte & 0x40);            // Bit 6: 1=Error occurred

    let message = '정상';
    if (isOffline) message = '프린터 오프라인 상태';
    if (isWaitingRecovery) message = '용지 없음 또는 커버 열림';
    if (isError) message = '프린터 하드웨어 에러';

    return {
        isReady: !isOffline && !isWaitingRecovery && !isError,
        message,
    };
}

/**
 * 단일 출력 작업에 대한 재시도 및 포트 제어 로직
 * (비즈니스 로직과 하드웨어 제어)
 */
async function attemptPrint(printSendItem: SerialPrinterItem): Promise<boolean> {
    let tryCount = 0;

    while (tryCount < 5) {
        let port: SerialPort | null = null;
        try {
            // 포트 설정 및 수동 오픈 준비
            port = new SerialPort({ 
                path: printSendItem.interfacePath, 
                baudRate: printSendItem.printBaudRate!, 
                autoOpen: false, 
            });
            
            // 시리얼 포트 제어
            await new Promise<void>((res, rej) => port!.open(e => e ? rej(e) : res()));

            // 프린터 상태 체크 루틴
            const printerStatus = await new Promise<{isReady: boolean, message: string}>((resolve) => {
                const timer = setTimeout(() => {
                    resolve({ isReady: true, message: '상태확인 타임아웃 (강제 진행)' });
                }, STATUS_TIMEOUT_MS);

                // 프린터로부터 응답을 기다리는 리스너
                port!.once('data', (data) => {
                    clearTimeout(timer);
                    resolve(parsePrinterStatus(data[0]));
                });

                // 상태 확인 명령어 전송
                port!.write(CHECK_STATUS_COMMAND);
            });

            if (!printerStatus.isReady) {
                sendLogToRenderer(`${LOG_TITLE} 경고: ${printerStatus.message}`, printSendItem.interfacePath);
                throw new Error(printerStatus.message);
            }

            // 실제 데이터 쓰기
            await new Promise<void>((res, rej) => port!.write(printSendItem.printData, e => e ? rej(e) : res()));
            await new Promise<void>((res, rej) => port!.drain(e => e ? rej(e) : res()));

            return true; 
        } catch (error: any) {
            tryCount++;
            sendLogToRenderer(`${LOG_TITLE} Fail (Try ${tryCount}) `, error.message);
            
            // 렌더러에 상태 알림
            if (tryCount >= 5 && printSendItem.isCallback) {
                sendPrintStatusToRenderer(`${LOG_TITLE} 프린터확인: `, `프린터 확인 요망: ${error.message}`);
            }
            
            // 재시도 전 2초 대기
            if (tryCount < 5) await new Promise(res => setTimeout(res, 2000));
        } finally {
            // 메모리 및 자원 해제
            if (port?.isOpen) {
                await new Promise<void>(res => port!.close(() => res()));
            }
        }
    }
    return false;
}

/**
 *  전체 큐를 순회하며 실행을 관리하는 메인 루프
 * (작업 스케줄링)
 */
async function processQueue() {
    if (IS_PRINTING || customQueue.empty()) return;

    IS_PRINTING = true;
    
    while (!customQueue.empty()) {
        const printSendItem:any = customQueue.dequeue();
        if (!printSendItem) continue;

        const success = await attemptPrint(printSendItem);
        
        if (success) {
            sendLogToRenderer(`${LOG_TITLE} Print Success`, ` path: ${ printSendItem.interfacePath }`);
        }
        
        // 프린터가 다음 데이터를 받을 준비를 할 수 있도록 1초 대기
        await new Promise(res => setTimeout(res, 1000));
    }
    
    IS_PRINTING = false;
}

/**
 * 외부(IPC Listener 등)에서 호출하는 진입점 함수
 */
export async function excuteSerialPrinter(printSendItem: SerialPrinterItem): Promise<void> {
    // 10분 이상 지난 오래된 큐가 있다면 초기화
    if (LAST_RUN_TIME && Date.now() - LAST_RUN_TIME > EXPIRATION_TIME) {
        customQueue.clear();
        sendLogToRenderer(`${LOG_TITLE} Queue Expired & Cleared`, ` queue-length: ${customQueue.length}`);
    }

    LAST_RUN_TIME = Date.now();

    // 신규 출력 요청 삽입
    const printerItem:any = printSendItem;
    customQueue.enqueue(printerItem);

    // 큐 처리 시작 (이미 실행 중이면 중복 실행되지 않음)
    processQueue();
}