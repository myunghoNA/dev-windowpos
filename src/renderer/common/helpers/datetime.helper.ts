
/**
 * @name formatDateString
 * @description Date 객체나 날짜 문자열을 원하는 포맷으로 변환
 * @param {Date | string | number} date - 날짜 객체 또는 값
 * @param {string} formatStr - 포맷 (YYYY, MM, DD, HH, mm, ss)
 * @example 
 * formatDateString(new Date(), 'YYYY-MM-DD HH:mm:ss'); // "2026-03-23 14:30:05"
 */
export function formatDateString(date: Date | string | number = new Date(), formatStr: string = 'YYYY-MM-DD'): string {
    if (date === null || date === undefined || date === '') return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const pad = (n: number) => n.toString().padStart(2, '0');

    const values: Record<string, string | number> = {
        YYYY: d.getFullYear(),
        MM: pad(d.getMonth() + 1),
        DD: pad(d.getDate()),
        HH: pad(d.getHours()),
        mm: pad(d.getMinutes()),
        ss: pad(d.getSeconds()),
    };

    return formatStr.replace(/YYYY|MM|DD|HH|mm|ss/g, (matched) => String(values[matched]));
}

/**
 * @name formatTimeString
 * @description 날짜 객체에서 시간 부분만 포맷팅하여 반환 (FormatTime 대체)
 * @param {Date | string | number} date - 날짜 객체 또는 값
 * @param {string} formatStr - 시간 포맷 (기본값: 'HH:mm:ss')
 * @returns {string} 포맷팅된 시간 문자열
 * @example
 * formatTimeString(new Date()); // "14:30:05"
 * formatTimeString(new Date(), 'HH:mm'); // "14:30"
 */
export function formatTimeString(date: Date | string | number = new Date(), formatStr: string = 'HH:mm:ss'): string {
    return formatDateString(date, formatStr);
}

/**
 * @name formatUtcTimestamp
 * @description 로컬 시간을 UTC ISO 문자열로 변환 
 * @param {Date | string | number} date - 변환할 날짜
 * @returns {string} UTC ISO 8601 문자열 (예: "2026-03-23T05:41:35.000Z")
 */
export function formatUtcTimestamp(date: Date | string | number = new Date()): string {
    if (date === null || date === undefined || date === '') return '';
    
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toISOString();
}

/**
 * @name formatLocaleDate
 * @description 국가별/언어별 로컬라이즈 포맷팅 (사우디 이슬람력 포함)
 * @param {Date | string | number} date - 날짜
 * @param {string} locale - 언어코드 (ko-KR, ar-SA 등)
 * @param {object} options - 상세 옵션 (isHijri: 이슬람력 여부)
 */
export function formatLocaleDate(
    date: Date | string | number = new Date(), 
    locale: string = 'ko-KR', 
    options: { isHijri?: boolean; showTime?: boolean } = {},
): string {
    if (date === null || date === '') return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const { isHijri = false, showTime = true } = options;

    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        ...(isHijri && { calendar: 'islamic-umalqura' }), 
        ...(showTime && {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }),
    }).format(d);
}

/**
 * @name getToday
 * @description 오늘 날짜를 지정된 포맷과 함께 반환
 * @example getToday('YYYY.MM.DD'); // "2026.03.23"
 */
export function getToday(formatStr: string = 'YYYY-MM-DD'): string {
    return formatDateString(new Date(), formatStr);
}


/**
 * @name getDiffDays
 * @description 두 날짜 사이의 일수 차이 계산
 */
export function getDiffDays(date1: Date | string, date2: Date | string): number {
    if (!date1 || !date2) return 0;

    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();

    if (isNaN(d1) || isNaN(d2)) return 0;
    
    const diff = Math.abs(d2 - d1);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}


/**
 * @name getAddHours
 * @description 지정된 날짜(기본값: 현재)에 특정 시간(Hour)을 더하거나 빼서 포맷팅된 문자열로 반환
 * @param {number} hours - 더할 시간 (음수 입력 시 차감)
 * @param {Date | string | number} [baseDate=new Date()] - 기준 날짜 (기본값: 현재 시간)
 * @param {string} [formatStr='YYYY-MM-DD HH:mm:ss'] - 반환할 날짜 포맷
 * @returns {string} 계산이 완료된 포맷팅 문자열
 * @example
 * getAddHours(3); // 현재 시간 + 3시간 ("2026-08-31 14:00:00")
 * getAddHours(-2, new Date(), 'HH:mm'); // 현재 시간 - 2시간 ("09:00")
 * getAddHours(24, '2026-08-31', 'YYYY-MM-DD'); // 특정 날짜에 24시간(1일) 더하기
 */
export function getAddHours(
    hours: number,
    baseDate: Date | string | number = new Date(),
    formatStr: string = 'YYYY-MM-DD HH:mm:ss',
): string {
    if (baseDate === null || baseDate === undefined || baseDate === '') return '';

    const d = new Date(baseDate);
    if (isNaN(d.getTime())) return '';

    d.setHours(d.getHours() + hours);

    return formatDateString(d, formatStr);
}