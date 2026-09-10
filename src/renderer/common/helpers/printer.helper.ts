
import { needElectron } from '@renderer/apis/need-electron.api';
//# Import Provider
import { PrinterConnectType } from '@renderer/providers/com-code.provider';
//# Import Type
import {
    PrintConfig,
    PrintReceiptData,
} from '@shared/types/printer.type';
import { SettingPrinter } from '@shared/types/setting.type';
//# Import Printer
import { buildReceiptHtml } from '@renderer/common/printers';
//# Import Component
import ReceiptForm from '@renderer/common/printers/ReceiptForm';


const ARABIC_FONT = '"Noto Sans Arabic", Tahoma, sans-serif';

/**
 * @name sendReceiptToSerial
 * @description 영수증 데이터를 렌더링하여 시리얼 프린터로 전송 38400 | 57600 | 115200
 */
export async function sendReceiptToSerial(
    printConfig:PrintConfig, 
    settingPrinter: SettingPrinter, 
    receiptData: PrintReceiptData,
): Promise<boolean> {

    const comPort  = settingPrinter.serialOption.comPort;
    const baudRate = settingPrinter.serialOption.baudRate;

    const printData = await ReceiptForm({ settingPrinter, receiptData, printConfig });
    
    try {
        await needElectron().printer.sendToPrinter({
            interfaceType: PrinterConnectType.SERIAL,
            interfacePath: comPort,
            printBaudRate: baudRate,
            printData: printData,
            isCallback: true,
        });

        return true;
    } catch (error) {
        console.error('[PrinterHelper] 출력 실패:', error);
        return false;
    }
}


/** 
 * @name sendReceiptToEthernet 
 * @description 영수증 데이터를 렌더링하여 이더넷 프린터로 전송
 */
export async function sendReceiptToEthernet(
    printConfig:PrintConfig, 
    settingPrinter: SettingPrinter, 
    receiptData: PrintReceiptData,
): Promise<boolean> {

    const ip = settingPrinter.ethernetOption.ip;
    const port = settingPrinter.ethernetOption.port; 
    
    const interfacePath = `tcp://${ip}:${port}`;
    const printData = await ReceiptForm({ settingPrinter, receiptData, printConfig });

    try {
        await needElectron().printer.sendToPrinter({
            interfaceType: PrinterConnectType.ETHERNET,
            interfacePath: interfacePath,
            printData: printData,
            isCallback: true,
        });

        return true;
    } catch (error) {
        console.error('[PrinterHelper] 출력 실패:', error);
        return false;
    }
}

/** 
 * @name sendReceiptToWindows 
 * @description 영수증 데이터를 렌더링하여 윈도우에 설정된 프린터로 전송 
 */
export async function sendReceiptToWindows(
    printConfig:PrintConfig, 
    settingPrinter: SettingPrinter, 
    receiptData: PrintReceiptData,
): Promise<boolean> {

    const driverName = settingPrinter.windowOption.driverName;
    const printHtml = await buildReceiptHtml({ settingPrinter, receiptData, printConfig });

    try {
        await needElectron().printer.sendToPrinter({
            interfaceType: PrinterConnectType.WINDOWS,
            interfacePath: driverName,
            printHtml: printHtml,
            isCallback: true,
        });

        return true;
    } catch (error) {
        console.error('[PrinterHelper] 출력 실패:', error);
        return false;
    }
}


/**
 * @name renderArabicToDataUrl
 * @description 아랍어 텍스트를 감열 프린터 인쇄용 비트맵 이미지(PNG data URL)로 렌더링
 * @param text - 아랍어 텍스트 문자열
 * @param fontPx - 폰트 픽셀
 */
export function renderArabicToDataUrl(text: string, fontSize: number, paperWidthPx: number = 384): string {
    
    // 텍스트 길이에 상관없이 캔버스 크기를 용지 전체 너비(384 or 576)로 고정
    const width  = Math.ceil(paperWidthPx / 8) * 8; 
    const height = fontSize + 16;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = 'black';
    ctx.direction = 'rtl';
    
    // 캔버스가 이미 용지 전체 너비이므로, 내부 텍스트를 우측(right)으로 정렬
    ctx.textAlign = 'right'; 
    ctx.textBaseline = 'middle';
    ctx.font = `${fontSize}px ${ARABIC_FONT}`;

    // 우측 끝(width - 10)에서부터
    ctx.fillText(text, width - 10, height / 2, width - 20);

    return canvas.toDataURL('image/png');
}