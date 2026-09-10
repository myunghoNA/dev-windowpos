import { LangType } from './i18n.type';

export type Ctx = CanvasRenderingContext2D;
export type PrinterType = '' | 'SERIAL' | 'ETHERNET' | 'WINDOWS';
export type PrinterPaperSize = '58mm' | '80mm';


/**
 * @description 프린터 공통 규격 (제네릭으로 각 연결 유형별 리터럴을 주입)
 */
type ComPrinterItem<T extends PrinterType> = {
  interfaceType: T;
};

/**
 * @description 시리얼 프린터 전송 규격
 */
export type SerialPrinterItem = ComPrinterItem<'SERIAL'> & {
  interfacePath: string;
  printBaudRate: number;
  printData: Uint8Array;
  isCallback: boolean;
};

/**
 * @description 이더넷 프린터 전송 규격
 */
export type EthernetPrinterItem = ComPrinterItem<'ETHERNET'> & {
  interfacePath: string;
  printData: Uint8Array | string;
  isCallback: boolean;
};

/**
 * @description 윈도우 프린터 전송 규격
 */
export type WindowsPrinterItem = ComPrinterItem<'WINDOWS'> & {
  interfacePath: string;
  printHtml: string;
  isCallback: boolean;
};

export type PrinterSendItem = SerialPrinterItem | EthernetPrinterItem | WindowsPrinterItem;

/**
 * @description 프린트 출력 Config
 */
export type PrintConfig = {
    isShowQr: boolean;      // 사우디 ZATCA 전자영수증 필수 QR 포함 여부
    isShowVat: boolean;     // 부가세 상세 내역 노출 여부
    language: LangType;     // 영문 단독 / 아랍어 단독 / 이중 언어(Bilingual) 출력 모드
}

/**
 * @description 주문상품 데이터
 */
export type PrintOrderItem = {
    itemNmAr: string;  
    itemNmEn: string;  
    itemQty: number;
    itemAmt: number;
}

/**
 * @description 영수증 데이터
 */
export type PrintReceiptData = {
    storeNmAr: string;
    storeNmEn: string;
    storeAddress: string;
    vatRegNo: string;
    totalAmount: number;
    items: PrintOrderItem[];
}