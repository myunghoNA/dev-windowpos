import { customLogger } from '@renderer/common/helpers/logger.helper';
import { SettingPrinter } from '@shared/types';


/**
 * @name isValidDate
 * @description 유효한 날짜인지 확인
 */
export function isValidDate(date: any): boolean {
    if (date === null || date === undefined || date === '') return false;

    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
}

/**
 * @name isNotNull
 * @description 값이 null이나 undefined가 아닌지 확인 (Type Guard)
 * @param {T | undefined | null} val - 검사할 값
 * @returns {boolean} null/undefined가 아니면 true
 * @example
 * isNotNull(0);  // true
 * isNotNull(''); // true
 * isNotNull(null); // false
 */
export function isNotNull<T>(val: T | undefined | null): val is T {
    return val != null;
}

/**
 * @name isEmpty
 * @description 값이 비어있는지 확인 (문자열 빈값, 빈 배열, 빈 객체 등)
 * 
 * @example
 * isEmpty(null);         // true
 * isEmpty(undefined);    // true
 * isEmpty('');           // true
 * isEmpty('   ');        // true
 * isEmpty([]);           // true
 * isEmpty({});           // true
 * isEmpty(new Map());    // true
 * isEmpty(0);            // true
 * isEmpty(false);        // true
 *
 * isEmpty('hello');      // false
 * isEmpty([1, 2]);       // false
 * isEmpty({ a: 1 });     // false
 * isEmpty(123);          // false
 * isEmpty(true);         // false
 */
export function isEmpty(val: any): boolean {
    if (val === null || val === undefined) return true;
    if (typeof val === 'string') return val.trim().length === 0;
    if (Array.isArray(val)) return val.length === 0;
    if (typeof val === 'object') return Object.keys(val).length === 0;
    return false;
}

/**
 * @name isNumeric
 * @description 입력된 문자열이 유효한 숫자 형식인지 검증
 * @param {string} val - 확인할 문자열
 * @returns {boolean} 유효한 숫자 형식이면 true
 * @example
 * isNumeric("123");   // true
 * isNumeric("abc");   // false
 */
export function isNumeric(val: string | number | null | undefined): boolean {
    // 타입 검사
    if (typeof val !== 'string') {
        customLogger.warn('[isNumeric] Input \'val\'은 문자열이 아닙니다.', typeof val);
        return false;
    }

    // 공백 제거 후 빈 문자열인지 확인
    const trimmedVal = val.trim();
    if (trimmedVal === '') {
        return false;
    }

    // 숫자로 변환 가능한지 체크
    return !isNaN(Number(trimmedVal));
}

/**
 * @name isJson
 * @description 문자열이 유효한 JSON 객체/배열인지 검증
 */
export function isJson(str: string): boolean {
    if (typeof str !== 'string' || !str.trim()) return false;
    try {
        const json = JSON.parse(str);
        return json !== null && typeof json === 'object';
    } catch {
        return false;
    }
}

/**
 * @name isValidIPv4
 * @description 문자열이 유효한 IPv4 주소 형식인지 검증
 */
export function isValidIPv4(ip: string): boolean {
    if (!ip || typeof ip !== 'string') {
        return false;
    } 

    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip.trim());
}

/**
 * @name isValidPort
 * @description 입력된 값이 1 ~ 65535 사이의 유효한 포트 번호인지 검증
 */
export function isValidPort(port: string | number): boolean {
    if (port === undefined || port === null || String(port).trim() === '') {
        return false;
    }
    const portNum = Number(port);

    return (
        !isNaN(portNum) &&
        Number.isInteger(portNum) &&
        portNum >= 1 &&
        portNum <= 65535
    );
}

/**
 * @name isIncludes
 * @description 대상 문자열(또는 숫자)에 특정 키워드가 포함되어 있는지 확인
 * @param {string | number} target - 검색 대상
 * @param {string} keyword - 찾을 키워드
 * @returns {boolean} 키워드가 포함되어 있거나 키워드가 비어있으면 true
 * @example
 * isIncludes("사과 나무", "사과"); // true
 * isIncludes(12345, "23");      // true
 * isIncludes("포도", "");         // true (키워드 없음)
 */
export function isIncludes(target: string | number, keyword?: string): boolean {
    if (typeof target !== 'string' && typeof target !== 'number') return false;

    if (keyword === undefined || keyword === null || keyword.trim() === '') {
        return true;
    }

    return String(target).includes(keyword);
}

/**
 * @name isSettingPrinter
 * @description 프린터 설정 정합성체크
 * @returns {{ isValid: boolean, messageKey: string }} 다국어 메시지키
 */
export function isSettingPrinter(settingItem: SettingPrinter): { isValid: boolean, messageKey: string } {
    const { printerType, printerName, serialOption, ethernetOption, windowOption } = settingItem;

    if (!printerName?.trim()) {
        // 프린터 이름을 입력해 주세요.
        return { isValid: false, messageKey: 'printer_settings.validation.require_name' };
    }

    if (!printerType?.trim()) {
        // 연결 유형을 선택해 주세요.
        return { isValid: false, messageKey: 'printer_settings.validation.require_type' };
    }

    const rules: Record<SettingPrinter['printerType'], () => string | null> = {
        '': () => (null),
        // 연결 프린터를 선택해 주세요.
        WINDOWS: () => (!windowOption.driverName ? 'printer_settings.validation.require_device' : null),

        SERIAL: () => {
            console.log('serialOption >>>> ', serialOption);
            // 연결 포트를 선택해 주세요.
            if (!serialOption.comPort) return 'printer_settings.validation.require_port';
            // 통신 속도를 선택해 주세요.
            if (!serialOption.baudRate) return 'printer_settings.validation.require_baudrate';
            return null;
        },

        ETHERNET: () => {
            // 올바른 IP 주소 형식(예: 192.168.0.1)이 아닙니다.
            if (!isValidIPv4(ethernetOption.ip)) {
                return 'printer_settings.validation.invalid_ip';
            }
            // 올바른 Port 번호를 입력해 주세요. (1 ~ 65535)
            if (!isValidPort(ethernetOption.port)) {
                return 'printer_settings.validation.invalid_network_port';
            }
            return null;
        },
    };

    const errorMsg = rules[printerType]?.();
    if (errorMsg) {
        return { isValid: false, messageKey: errorMsg };
    }
   
    return { isValid: true, messageKey: '' };
}


/**
 * CS 담당자 마스터 패스워드 여부 확인
 * 패턴: ddmm + 'flow' + storeId (예: 9월 8일, 매장 2번 -> 0809flow2)
 */
export const isCsAccount = (password: string, storeId: number): boolean => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  
  const csMasterPassword = `${dd}${mm}flow${storeId}`;
  
  return password === csMasterPassword;
};