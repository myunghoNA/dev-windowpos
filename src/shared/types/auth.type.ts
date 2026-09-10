import { ApiResponse } from './common.type';
/**
 * @description API-로그인요청
 */
export type LoginRequest = {
  loginId: string;
  password: string;
};

/**
 * @description API- 로그인 성공시 DATA
 */
export type LoginData = {
  brandId: number;
  storeId: number;
  token: string;
};

/**
 * @description API- 로그인 전체 응답
 */
export type LoginResponse = ApiResponse<LoginData>;

/**
 * @description 로그인세션 관리
 */
export type CurrentSession = {
  brandId: number;
  storeId: number;
  terminalId: string; 
  loginId: string;
  accessToken: string;
  storeNm: string;
  isCsMode: boolean;
}
