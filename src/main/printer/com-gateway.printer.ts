
import { excuteEthernetPrinter } from '@main/printer/excute-ethernet.printer';
import { excuteSerialPrinter } from '@main/printer/excute-serial.printer';
import { excuteWindowsPrinter } from '@main/printer/excute-windows.printer';
// Import Service
import { sendLogToRenderer } from '@main/services';
// Import Type
import { PrinterSendItem } from '@shared/types';

const LOG_TITLE = '[COM-GATEWAY.PRINTER]';

/**
 * @name sendToPrinter
 * @description 프린터 출력 및 데이터 변환 관련 유틸리티
 */
export async function sendToPrinter(printSendItem: PrinterSendItem): Promise<void> {  

    const { interfaceType, interfacePath, isCallback = false } = printSendItem;

    // 인터페이스별 진입점 분기
    switch (interfaceType) {
        // 시리얼 설정 프린터 전송
        case 'SERIAL': {
            const { printBaudRate = 115200, printData } = printSendItem;
            await excuteSerialPrinter({
                interfaceType, 
                interfacePath,
                printBaudRate,
                printData,
                isCallback,
            });
            break;
        }
        // 이더넷 설정 프린터 전송
        case 'ETHERNET': {
            const { printData } = printSendItem;
            await excuteEthernetPrinter({
                interfaceType,
                interfacePath: interfacePath,
                printData: printData,
                isCallback: isCallback,
            });
            break;
        }    
        // 윈도우 설정 프린터 전송
        case 'WINDOWS': {
            const { printHtml } = printSendItem;
            await excuteWindowsPrinter({
                interfaceType,
                interfacePath: interfacePath,
                printHtml: printHtml,
                isCallback: isCallback,
            });
            break;
        } 
        default:
            sendLogToRenderer(`${LOG_TITLE} WARN:`, `Unknown interface type: ${interfaceType}`);
    }

}
