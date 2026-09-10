import appStore from '@renderer/redux/store';



/**
 * 현재 로그인된 세션 정보 전체를 조회.
 * - React 컴포넌트 밖(리포지토리, 인터셉터 등)에서 세션 값이 필요할 때 사용.
 * @returns 현재 세션, 로그인 안 된 상태면 null
 */
export function getCurrentSession() {
  return appStore.getState().session?.current ?? null;
}

/**
 * 현재 로그인된 단말기등록ID(terminalRegisterId)를 조회.
 * - 프린터/알림 설정 등 단말기 단위로 스코프된 Dexie 데이터 조회 시 사용.
 * @returns terminalRegisterId, 로그인 안 된 상태면 빈 문자열
 */
export function getCurrentTerminalId(): string {
  return appStore.getState().session.current?.terminalId ?? '';
}

/**
 * 현재 로그인된 매장ID(storeId)를 조회한다.
 * @returns storeId, 로그인 안 된 상태면 undefined
 */
export function getCurrentStoreId(): number | undefined {
  return appStore.getState().session.current?.storeId;
}

/**
 * 현재 로그인된 계정의 API 인증토큰을 조회한다.
 * - axios 인터셉터 등에서 요청 헤더에 실을 때 사용.
 * @returns accessToken, 로그인 안 된 상태면 빈 문자열
 */
export function getAccessToken(): string {
  return appStore.getState().session.current?.accessToken ?? '';
}

/**
 * 현재 로그인 여부를 판단한다.
 * @returns 로그인 상태면 true
 */
export function isLoggedIn(): boolean {
  return appStore.getState().session.current !== null;
}
