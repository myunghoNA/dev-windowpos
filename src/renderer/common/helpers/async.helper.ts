/**
 * @name delay
 * @description 입력한 시간(ms) 만큼 대기 후 진행
 * @example await delay(1000);
 */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @name timeout
 * @description 특정 시간 안에 작업이 끝나지 않으면 에러를 발생시킴 (네트워크 타임아웃 등)
 * @example await timeout(fetchData(), 5000);
 */
export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`[Timeout] ${ms}ms 시간이 초과 되었습니다.`)), ms),
    );
    return Promise.race([promise, timeoutPromise]);
}

/**
 * @name nextTick
 * @description 현재 실행 루프가 끝난 직후(가장 빠른 시점)에 실행
 */
export function nextTick(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}