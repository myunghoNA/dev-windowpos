import CryptoJS from 'crypto-js';
//# Helper
import { customLogger } from '@renderer/common/helpers/logger.helper';

// 상수 정의
export const SECURITY_KEY = 'flowpos12#$';


/**
 * @name getByteLength
 * @description 문자열의 바이트 길이를 반환 (POS/EUC-KR 기준: 한글 2바이트)
 */
export function getByteLength(str: string): number {
    if (!str || typeof str !== 'string') return 0;

    let length = 0;
    for (let i = 0; i < str.length; i++) {
        length += str.charCodeAt(i) > 128 ? 2 : 1;
    }
    return length;
}

/**
 * @name encrypt
 * @description 입력된 문자열을 AES 방식으로 암호화
 * @param {string} text - 원본 문자열
 * @returns {string} 암호화된 문자열 (실패 시 빈 문자열)
 * @example
 * encrypt("hello"); // "U2FsdGVkX19..."
 */
export function encrypt(text: string): string {
    // 유효성 검사
    if (typeof text !== 'string' || text.length === 0) {
        if (typeof text !== 'string') {
            customLogger.warn('[Encrypt] string 타입이 아니거나, null/undefined:', typeof text);
        }
        return '';
    }

    try {
        return CryptoJS.AES.encrypt(text, SECURITY_KEY).toString();
    } catch (error) {
        customLogger.error('[Encrypt] Encryption failed:', error);
        return '';
    }
}

/**
 * @name decrypt
 * @description 암호화된 문자열을 원본으로 복호화
 * @param {string} text - 암호화된 문자열
 * @returns {string} 복호화된 원본 문자열 (실패 시 빈 문자열)
 * @example
 * decrypt("U2FsdGVkX19..."); // "hello"
 */
export function decrypt(cipherText: string): string {
    if (!cipherText) return '';

    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, SECURITY_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        customLogger.error('[Decrypt] Decryption failed:', error);
        return '';
    }
}

/**
 * @name reverseValue
 * @description 입력한 문자열을 역순으로 변환
 * @param {string} value - 역순으로 변환할 문자열
 * @returns {string} 역순으로 변환된 문자열
 * @example
 * reverseValue('1234'); // '4321'
 */
export function reverseValue(value: string): string {
    if (typeof value !== 'string') {
        customLogger.warn('[ReverseValue] value가 string 타입이 아니거나, null/undefined:', typeof value);
        return '';
    }

    // 스프레드 연산자를 사용하여 유니코드 안전하게 문자열 반전
    return [...value].reverse().join('');
}

/**
 * @name substringFromByte
 * @description 문자열을 바이트(Byte) 단위로 자름 (한글/특수문자 2Byte, 영문/숫자 1Byte)
 * @param {string} str - 원본 문자열
 * @param {number} startByte - 시작 바이트 위치 (1부터 시작 기준)
 * @param {number} byteSize - 잘라낼 바이트 크기
 * @example
 * substringFromByte('한글ABC', 1, 4); // '한글' (2+2=4바이트)
 * substringFromByte('한글ABC', 5, 3); // 'ABC'
 */
export function substringFromByte(str: string, startByte: number, byteSize: number): string {
    if (!str || typeof str !== 'string') return '';

    let currentByte = 0;
    let startIndex = 0;
    let endIndex = str.length;

    // 시작 지점(Index) 찾기
    const targetStart = Math.max(0, startByte - 1); // 1-based를 0-based로 보정
    for (let i = 0; i < str.length; i++) {
        if (currentByte >= targetStart) {
            startIndex = i;
            break;
        }
        currentByte += str.charCodeAt(i) > 128 ? 2 : 1;
    }

    // 끝 지점(Index) 찾기
    let accumulatedByte = 0;
    for (let i = startIndex; i < str.length; i++) {
        const charByte = str.charCodeAt(i) > 128 ? 2 : 1;
        
        if (accumulatedByte + charByte > byteSize) {
            endIndex = i;
            break;
        }
        accumulatedByte += charByte;
        endIndex = i + 1;
    }

    return str.substring(startIndex, endIndex);
}

/**
 * @name base64ToUint8Array
 * @description Base64 문자열을 Uint8Array로 변환
 * @param {string} base64 - Base64 인코딩된 문자열
 * @returns {Uint8Array} 변환된 Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
