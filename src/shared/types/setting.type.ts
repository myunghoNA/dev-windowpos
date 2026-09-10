import { SoundType } from './notification.type';
import { PrinterPaperSize, PrinterType } from './printer.type';

export type SettingType = 'PRINTER_CONNECT' | 'PRINTER_OPTION' | 'NOTIFICATION' | 'SYSTEM' | 'CUSTOMER_DISPLAY' | 'ACCESS_CONTROL'; 
export type SyncStatus = 'PENDING' | 'REQUEST' | 'SUCCESS' | 'FAILURE';

export type NotificationType = 'NEW_ORDER' | 'SYSTEM'; 

/**
 * @description 설정동기화 관리
 */
export type SettingSyncMeta = {
  terminalId: string;    
  settingType: SettingType;
  syncVersion: number;
  syncStatus: SyncStatus;
  finalSyncDt: string;
  isDirty: boolean;
  finalDirtyDt?: string;          
}

/**
 * @description 설정동기화
 */
export type SettingSyncPk = {
  terminalId: string;
  settingType: SettingType;
}

/**
 * @description 시리얼 프린터 옵션
 */
type SerialPrinterOption = {
    comPort: string;
    baudRate : number;
}

/**
 * @description 이더넷 프린터 옵션
 */
export type EthernetPrinterOption = {
    ip: string;
    port : number;
}

/**
 * @description 윈도우 프린터 옵션
 */
export type WindowPrinterOption = {
    driverName: string;
}

/**
 * @description 주문서 출력 옵션
 */
export type OrderPrintOption = {
    isUse: boolean;
}

/**
 * @description 영수증 출력 옵션
 */
export type ReceiptPrintOption = {
    isUse: boolean;
}

/**
 * @description 프린터 설정
 */
export type SettingPrinter = {
    terminalId: string;
    deviceKey: string;
    printerType: PrinterType;
    printerName: string;
    paperSize: PrinterPaperSize;
    serialOption: SerialPrinterOption;
    ethernetOption: EthernetPrinterOption;
    windowOption: WindowPrinterOption;
    orderPrintOption: OrderPrintOption;
    receiptPrintOption: ReceiptPrintOption;
}

/**
 * @description 알림 설정
 */
export type SettingNotification = {
  terminalId: string;
  notificationType: NotificationType
  isUse: boolean;       // 사용여부
  soundId: SoundType;   // 기본: DEFAULT
  soundVolume: number;  // 0~100
  isOsPopup: boolean;   // 팝업 사용여부 (OS 알림센터)
};