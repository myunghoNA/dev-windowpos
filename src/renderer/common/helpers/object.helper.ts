/**
 * @name getObjectValue
 * @description 객체의 중첩된 경로(dot notation)에서 안전하게 값을 추출
 * @param {any} obj - 대상 객체
 * @param {string} path - 접근 경로 (예: 'user.address.city')
 * @param {any} defaultValue - 값이 없을 경우 반환할 기본값
 * @example
 * getObjectValue(order, 'items.0.name', '품목 없음');
 */
export function getObjectValue(obj: any, path: string, defaultValue: any = ''): any {
    if (!obj || !path) return defaultValue;

    // 경로를 '.' 기준으로 나누어 탐색
    const result = path.split('.').reduce((acc, key) => {
        return (acc !== null && acc !== undefined) ? acc[key] : undefined;
    }, obj);

    return (result !== undefined && result !== null) ? result : defaultValue;
}

/**
 * @name pickToObject
 * @description 객체에서 특정 키만 추출하여 새로운 객체 생성
 * @example pickObject(userObj, ['id', 'name']);
 */
export function pickToObject(obj: any, keys: string[]): any {
    return keys.reduce((acc, key) => {
        if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
            acc[key] = obj[key];
        }
        return acc;
    }, {} as any);
}

/**
 * @name groupBy
 * @description 객체 배열을 특정 키 기준으로 그룹화
 */
export function groupByArray<T>(array: T[], key: keyof T): Record<string, T[]> {
    if (!Array.isArray(array)) return {};
    return array.reduce((acc, obj) => {
        const value = String(obj[key]);
        acc[value] = acc[value] || [];
        acc[value].push(obj);
        return acc;
    }, {} as Record<string, T[]>);
}

/**
 * @name sortBy
 * @description 다중 조건으로 배열 정렬 (문자열, 숫자 대응)
 */
export function sortByArray<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
        if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
        return 0;
    });
}