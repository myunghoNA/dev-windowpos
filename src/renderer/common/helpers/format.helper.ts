//Helper
import { customLogger } from '@renderer/common/helpers/logger.helper';

/**
 * @name maskAll
 * @description 입력된 모든 문자를 마스킹 처리
 * @param {string | number} value - 마스킹할 문자열 또는 숫자
 * @param {string} maskChar - 마스킹에 사용할 문자 (기본값: '*')
 * @example
 * maskAll('010');    // '***'
 * maskAll(1234, '#'); // '####'
 */
export function maskAll(value: string | number, maskChar: string = '*'): string {
    if (value === null || value === undefined) return '';
    
    // 숫자가 들어올 경우를 대비해 문자열로 변환
    const str = String(value);
    if (str.length === 0) return '';

    const validMaskChar = (typeof maskChar === 'string' && maskChar.length > 0) ? maskChar : '*';

    // 정규표현식 /./g를 사용하여 모든 단일 문자를 maskChar로 치환
    return str.replace(/./g, validMaskChar);
}

/**
 * @name maskString
 * @description 문자열의 특정 위치를 마스킹 처리
 * @param {string} str - 원본 문자열
 * @param {number} visibleCount - 노출할 글자 수
 * @param {'start' | 'middle' | 'end'} position - 마스킹할 위치 (기본값: 'end')
 * @param {string} maskChar - 마스킹 문자 (기본값: '*')
 */
export function maskString(str: string, visibleCount: number, position: 'start' | 'middle' | 'end' = 'end', maskChar: string = '*'): string {
    if (!str || typeof str !== 'string') return '';
    
    const len = str.length;
    const vCount = Math.max(0, Math.min(visibleCount, len)); 
    const mChar = maskChar || '*';

    switch (position) {
        case 'start':
            // 앞부분 가림 (예: ****5678)
            return str.slice(len - vCount).padStart(len, mChar);
            
        case 'end':
            // 뒷부분 가림 (예: 1234****)
            return str.slice(0, vCount).padEnd(len, mChar);

        case 'middle': {
            // 앞뒤 vCount만큼 남기고 중간을 가림 (예: 12**56) 
            if (len <= vCount * 2) return str;

            const start = str.slice(0, vCount);
            const end = str.slice(len - vCount);
            return start + mChar.repeat(len - (vCount * 2)) + end;
        }
        default:
            return str;
    }
}

/**
 * @name maskPhoneNumber
 * @description 휴대폰 번호 중간 자리를 마스킹 처리 (예: 010-****-5678)
 * @param {string} phoneNumber - 원본 숫자 문자열
 * @param {string} maskChar - 마스킹에 사용할 문자 (기본값: '*')
 * @example
 * maskPhoneNumber('01012345678'); // '010-****-5678'
 * maskPhoneNumber('0101235678');  // '010-***-5678'
 */
export function maskPhoneNumber(phoneNumber: string, maskChar: string = '*'): string {
    if (!phoneNumber || typeof phoneNumber !== 'string') return '';

    const mChar = (typeof maskChar === 'string' && maskChar.length > 0) ? maskChar : '*';

    // 숫자가 아닌 문자 제거
    const cleaned = phoneNumber.replace(/\D/g, '');
    const len = cleaned.length;

    // 10자리 (010-***-5678)
    if (len === 10) {
        return cleaned.replace(
            /(\d{3})(\d{3})(\d{4})/,
            `$1-${mChar.repeat(3)}-$3`,
        );
    }

    // 11자리 (010-****-5678)
    if (len === 11) {
        return cleaned.replace(
            /(\d{3})(\d{4})(\d{4})/,
            `$1-${mChar.repeat(4)}-$3`,
        );
    }

    // 번호가 너무 짧은 경우 (예외 처리: 앞 3자리만 남기고 마스킹)
    if (len > 3) {
        const first = cleaned.slice(0, 3);
        const rest = mChar.repeat(len - 3);
        return `${first}-${rest}`;
    }

    return phoneNumber;
}

/**
 * @name bytesToHumanRead
 * @description 파일 사이즈(byte)를 읽기 쉬운 단위(KB, MB, GB 등)로 변환
 * @param {number} bytes - 변환할 바이트 수
 * @param {number} decimals - 소수점 자리수 (기본값: 1)
 * @example
 * bytesToHumanRead(1024);      // "1.0 KB"
 * bytesToHumanRead(1234567, 2); // "1.18 MB"
 */
export function bytesToHumanRead(bytes: number, decimals: number = 1): string {
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    
    // 유효성 검사 (0 이하 처리)
    if (bytes <= 0 || isNaN(bytes)) {
        if (bytes < 0) customLogger.warn(`[formatBytes] 바이트는 음수일 수 없음: ${bytes}`);
        return `0 ${units[0]}`;
    }

    // 단위 계산 (1024 기준)
    const K = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(K));

    // 단위가 범위를 벗어나지 않도록 방어 코드
    const unitIndex = Math.min(i, units.length - 1);

    // 결과 계산 및 포맷팅
    const result = bytes / Math.pow(K, unitIndex);
    const formattedValue = unitIndex === 0 
        ? result.toString() 
        : result.toFixed(Math.max(0, decimals));

    return `${formattedValue} ${units[unitIndex]}`;
}

/**
 * @name formatPhoneNumber
 * @description 휴대폰 번호 포맷 변환 (예: 01012345678 -> 010-1234-5678)
 * @param {string} phoneNumber - 원본 숫자 문자열
 * @param {string} splitChar - 구분자 (기본값: '-')
 * @example
 * formatPhoneNumber('01012345678');      // '010-1234-5678'
 * formatPhoneNumber('0101234567', '/');  // '010/123/4567'
 */
export function formatPhoneNumber(phoneNumber: string, splitChar: string = '-'): string {
    if (!phoneNumber || typeof phoneNumber !== 'string') return '';

    const sChar = (typeof splitChar === 'string') ? splitChar : '-';

    // 숫자가 아닌 문자 제거 (혹시 모를 상황 대비)
    const cleaned = phoneNumber.replace(/\D/g, '');
    const len = cleaned.length;

    // 10자리 번호 (010-123-4567 형식)
    if (len === 10) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, `$1${sChar}$2${sChar}$3`);
    }
    
    // 11자리 번호 (010-1234-5678 형식)
    if (len === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, `$1${sChar}$2${sChar}$3`);
    }

    // 7~8자리 번호 (지역번호 없는 경우 등 대비)
    if (len === 7 || len === 8) {
        return cleaned.replace(/(\d{3,4})(\d{4})/, `$1${sChar}$2`);
    }

    // 그 외의 경우 원본 반환
    return phoneNumber;
}

/**
 * @name formatCurrency
 * @description 금액을 국가별 통화 형식으로 변환 (기본값: SAR)
 * @param {number} amount - 금액
 * @param {string} locale - 언어코드 (ko-KR, en-US, ar-SA)
 * @param {boolean} symbolAtEnd - 기호를 뒤에 붙일지 여부 (기본값: false)
 * @param {boolean} useNative - 아랍어 시 아랍식 숫자(١٢٣) 사용 여부 (기본값: true)
 * @example
 * formatCurrency(1250, 'ar-SA'); // '١٬٢٥٠٫٠٠ ر.س'
 * formatCurrency(1250, 'ar-SA', false); // '1,250.00 SAR'
 */
export function formatCurrency(amount: number, locale: string = 'ko-KR', symbolAtEnd: boolean = false, useNative: boolean = false): string {
    if (amount === null || amount === undefined || isNaN(amount)) return '';

    const targetLocale = !useNative && locale.startsWith('ar') 
        ? `${locale}-u-nu-latn` 
        : locale;
        
    // 기본 Intl 포맷팅 실행
    let formatted = new Intl.NumberFormat(targetLocale, {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 2,
    }).format(amount);

    // 만약 한국어/영어 로케일인데 기호를 뒤로 보낼경우 (커스텀 처리)
    if (symbolAtEnd && (locale.startsWith('ko') || locale.startsWith('en'))) {
        // "SAR 5,000.00" -> "5,000.00 SAR"
        formatted = formatted.replace('SAR', '').trim() + ' SAR';
    }

    return formatted;
}