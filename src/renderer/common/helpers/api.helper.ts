import { AxiosInstance } from 'axios';
import { TFunction } from 'i18next';



/** 
 * 비즈니스 로직 예외 상태 
 */
export const EXPECTED_ERROR_STATUSES = [400, 401, 403, 404, 409, 422];

/** 
 * 비즈니스 로직 예외 코드
 */
export const EXPECTED_ERROR_CODES = [
  'USER_NOT_FOUND',    // 존재하지 않는 계정
  'INVALID_PASSWORD',  // 비밀번호 불일치
  'NOT_FOUND',         // 단말기 등 데이터 없음
  'DUPLICATED',        // 중복 등록
  'INVALID_PARAM',     // 잘못된 파라미터 요청
];

/**
 * HTTP 상태 코드별 메시지 맵
*/
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
    400: '입력 형식이 올바르지 않습니다.',
    401: '로그인이 필요한 서비스입니다.',
    403: '접근 권한이 없습니다.',
    404: '존재하지 않는 정보입니다.',
    422: '요청 데이터가 올바르지 않습니다.',
    499: '요청이 취소되었습니다.',
    500: '서버 연결이 원활하지 않습니다.',
    502: '일시적인 네트워크 오류가 발생했습니다.', 
    503: '서버 점검 중이거나 현재 이용할 수 없습니다.', 
    504: '서버 응답이 지연되고 있습니다',
};


/**
* @name requestAPI
* @description API 요청처리 공통 함수
*/
export async function requestAPI<T>(
        axiosInstance: AxiosInstance,
        method: 'get' | 'post' | 'put' | 'delete' | 'patch',
        url: string,
        data: any = null,
    ):Promise<T>  {
 
    if (method === 'get') {
        const response = await axiosInstance.get(url, { params: data });
        return response.data;
    }


    const response = await axiosInstance[method](url, data);
    return response.data;
}


/**
 * @name withSafeReturn
 * @description API 호출을 감싸서 무조건 표준 응답(Safe Return) 형태로 반환
 */
export const withSafeReturn = async <T>(
  apiCall: () => Promise<T>,
  defaultErrorMessage: string = '서버 통신에 실패했습니다.',
): Promise<T> => {
  try {
    return await apiCall();
  } catch (e: any) {
    const serverResponse = e.response?.data;
    
    if (serverResponse) {
      return serverResponse as T;
    }

    return {
      success: false,
      code: e.code || 'NETWORK_ERROR',
      message: e.message || defaultErrorMessage,
      data: null,
    } as unknown as T;
  }
};


/**
 * @name getApiErrorMessage
 * @description API 응답 코드(resCode)를 다국어 에러 메시지로 변환.
 */
export const getApiErrorMessage = (resCode: string | null, t: TFunction): string | null => {
    if (!resCode || resCode === 'SUCCESS') return null;

    const translationKey:any = `error.api.${resCode}`;
    const translatedMessage = t(translationKey);

    if (translatedMessage === translationKey) {
        return t('error.api.UNKNOWN_ERROR');
    }

    return translatedMessage;
};

