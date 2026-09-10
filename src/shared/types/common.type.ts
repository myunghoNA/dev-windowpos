
/**
 * @description API - 실패 시 반환할 에러 타입
 */
export type ApiError = {
  code: string;
  message: string;
}

/**
 * @description API - 서버 공통 응답 포맷
 */
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  code: string;
  data: T;
}

/**
 * @description API - 언어명
 */
export type LangName = {
  en: string;
  ar: string;
};
