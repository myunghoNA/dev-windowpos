import defaultSound from '@renderer/assets/sound/default.mp3';
import {
    OrderStatusCounts,
    SelectLangKeyValueType,
    SelectValueType,
    SettingNotification,
    SettingPrinter,
    SoundType,
} from '@shared/types';


/** 프린터 연결 유형 */
export const SelectPrinterTypes:SelectLangKeyValueType[] = [
    { nameKey: 'printer_settings.field_connection.type_serial', value: 'SERIAL'  },
    { nameKey: 'printer_settings.field_connection.type_network', value: 'ETHERNET'  },
    { nameKey: 'printer_settings.field_connection.type_windows', value: 'WINDOWS'  },
] as const;

/** 프린터 용지사이즈 */
export const SelectPrinterPaperSizes:SelectValueType[] = [
    { name: '80mm', value: '80mm'  },
    { name: '58mm', value: '58mm'  },
] as const;


/** 시리얼포트 연결 속도 */
export const SelectSerialPorts:SelectValueType[] = [
    { name: '9600', value: 9600  },
    { name: '19200', value: 19200  },
    { name: '38400', value: 38400  },
    { name: '57600', value: 57600  },
    { name: '115200', value: 115200  },
] as const;


/** 프린터 설정 - 초기값 */
export const InitSettingPrinter:SettingPrinter = {
    terminalId:'',
    deviceKey: '',
    printerType: '', 
    printerName: '' ,
    paperSize: '80mm',
    serialOption: {
        comPort: '', 
        baudRate: 115200,
    },
    ethernetOption: {
        ip: '', 
        port: 9100,
    },
    windowOption: {
        driverName: '', 
    },
    orderPrintOption: {
        isUse: false, 
    },
    receiptPrintOption: {
        isUse: false, 
    },
};


/** 알림설정 - 파일 */
export const SOUND_FILES: Record<SoundType, string> = {
  'DEFAULT': defaultSound,
};

/** 알림설정 - 초기값 */
export const InitSettingNotification: SettingNotification = {
  terminalId:'',
  notificationType: 'NEW_ORDER',
  soundId: 'DEFAULT',
  soundVolume: 100,
  isOsPopup: true,
  isUse: true,
};

/** 주문상태 카운트 - 초기값 */
export const InitOrderStatusCounts: OrderStatusCounts = {
    receive: 0, confirm: 0, refuse: 0, ready: 0, delivery: 0, complete: 0, cancel: 0,
};