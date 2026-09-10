import net from 'net';
import { BreakLine, PrinterTypes, ThermalPrinter } from 'node-thermal-printer';
// Import Type
import { EthernetPrinterItem } from '@shared/types';
// Import Service
import {
  sendLogToRenderer,
  sendPrintStatusToRenderer,
} from '@main/services';


const LOG_TITLE = '[EXCUTE-ETHERNET.PRINTER]';
const MAX_RETRY = 3;
const RETRY_DELAY_MS = 2000;
const STATUS_TIMEOUT_MS = 1000; // 상태 확인 타임아웃

/**
 * 지정 시간 대기
 */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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
 * 이더넷 프린터의 하드웨어 상태를 직접 확인 (TCP Probe)
 */
async function checkEthernetStatus(interfacePath: string): Promise<{isReady: boolean, message: string}> {
    return new Promise((resolve) => {
        try {
            // 인터페이스 문자열에서 호스트와 포트 추출 (예: 192.168.0.100:9100)
            const cleanPath = interfacePath.replace('tcp://', '');
            const [host, portStr] = cleanPath.split(':');
            const port = parseInt(portStr) || 9100;

            const socket = new net.Socket();
            let isResolved = false;

            socket.setTimeout(STATUS_TIMEOUT_MS);

            socket.connect(port, host, () => {
                socket.write(Buffer.from([0x10, 0x04, 0x02])); // DLE EOT 2 (상태 요청)
            });

            socket.on('data', (data) => {
                if (isResolved) return;
                isResolved = true;
                socket.destroy();
                resolve(parsePrinterStatus(data[0]));
            });

            socket.on('error', (err) => {
                if (isResolved) return;
                isResolved = true;
                resolve({ isReady: false, message: `네트워크 연결 오류: ${err.message}` });
            });

            socket.on('timeout', () => {
                if (isResolved) return;
                isResolved = true;
                socket.destroy();
                resolve({ isReady: true, message: '상태확인 타임아웃 (강제 진행)' });
            });

        } catch {
            resolve({ isReady: false, message: '인터페이스 설정 오류' });
        }
    });
}

/**
 * @name excuteEthernetPrint
 * @description 이더넷 프린터 데이터 출력
 */
export async function excuteEthernetPrinter(printSendItem: EthernetPrinterItem): Promise<void> {
  const LOG_MESSAGE: any[] = [];

  //## 프린터 인스턴스 생성 
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: printSendItem.interfacePath,
    options: { timeout: 3000 },
    width: 42,
    breakLine: BreakLine.WORD,
  });

  //## 재시도 루프 
  for (let attemptTry = 1; attemptTry <= MAX_RETRY; attemptTry++) {
    try {
      //# 1. 하드웨어 상세 상태 체크 (Probe)
      const printerStatus = await checkEthernetStatus(printSendItem.interfacePath);
      
      if (!printerStatus.isReady) {
        throw new Error(printerStatus.message);
      }

      //# 2. 데이터 적재 및 출력 실행
      printer.clear();
      printer.append(Buffer.from(printSendItem.printData));
      await printer.execute();

      //# 3. 성공 로그 기록
      sendLogToRenderer(LOG_TITLE, `${printSendItem.interfacePath} 출력 성공 (시도: ${attemptTry}/${MAX_RETRY})`);
      return;

    } catch (error) {
      LOG_MESSAGE.push({
        step: `${LOG_TITLE} 시도 실패 (${attemptTry}/${MAX_RETRY})`,
        error: String(error),
      });
      sendLogToRenderer(LOG_TITLE, LOG_MESSAGE);

      printer.clear(); // 버퍼 정리

      if (attemptTry < MAX_RETRY) {
        // 재시도 전 대기
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  //##  최종 실패 시
  const failMsg = '프린터 네트워크 상태를 확인해 주세요.';

  LOG_MESSAGE.push({
    step: `${LOG_TITLE} 최종 실패 (${MAX_RETRY}회 모두 실패)`,
    message: failMsg,
  });
  sendLogToRenderer(LOG_TITLE, LOG_MESSAGE);

  if (printSendItem.isCallback) {
    sendPrintStatusToRenderer(`${LOG_TITLE} 프린터확인`, failMsg);
  }

  throw new Error(failMsg);
}