/**
 * @name toSafeNumber
 * @description 문자열이나 유효하지 않은 값을 안전하게 숫자로 변환
 */
export function toSafeNumber(value: any): number {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

/**
 * @name toStringNumber
 * @description 숫자를 문자열로 변환 (null, undefined, NaN, 0은 모두 '0'으로 반환)
 * @param {number | null | undefined} value - 변환할 숫자
 * @returns {string} 변환된 문자열
 * @example
 * stringToNumber(10);      // '10'
 * stringToNumber(null);    // '0'
 * stringToNumber(0);       // '0'
 */
export function stringToNumber(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value as number)) {
        return '0';
    }

    return String(value);
}

/**
 * @name toArabicDigits
 * @description 일반 숫자를 사우디 현지 텍스트용 아랍어 기호 숫자로 변경
 * @param {number | string} value - 변환할 숫자
 * @returns {string} 변환된 문자열
 */
export function toArabicDigits(value: number | string): string {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    
    return String(value).replace(/[0-9]/g, (w) => {
        return arabicDigits[Number(w)];
    });
}