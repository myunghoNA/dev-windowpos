import axios, { AxiosInstance } from 'axios';

import { customLogger, getAccessToken } from '@renderer/common/helpers';
import { EXPECTED_ERROR_CODES, EXPECTED_ERROR_STATUSES, HTTP_ERROR_MESSAGES } from '@renderer/common/helpers/api.helper';

const LOG_TITLE  = '[AXIOS-CLIENT]';
// ===========================================
//  전역 인프라 및 재시도 정책 상수 정의
// ===========================================
const POS_API_URL = import.meta.env.VITE_POS_API_URL;
const MAX_RETRIES = 2;    // 최대 재시도 횟수
const RETRY_DELAY = 1000; // 재시도 사이의 대기 시간 (1초)


// ===========================================
//  Axios 클라이언트 인스턴스 개별 생성
// ===========================================
//# 메인 포스 업무용
export const posAuthedInstance = axios.create({
  baseURL: POS_API_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
      'Content-Type': 'application/json',
    },
});

//# 로그인 처리용
export const posLoginInstance = axios.create({
  baseURL: POS_API_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
      'Content-Type': 'application/json',
    },
});

//# No-인터셉터 체크용
export const noInterceptorInstance = axios.create({
  baseURL: POS_API_URL,
  timeout: 3000,
  withCredentials: true,
  headers: {
      'Content-Type': 'application/json',
    },
});

// ===========================================
//  전역 인터셉터(Interceptor) 주입 파이프라인
// ===========================================
/**
 * @private
 * @description 생성된 Axios 인스턴스에 공통 인증 및 재시도/에러 핸들링
 */
function bindStandardInterceptors(axiosInstance: AxiosInstance): void {
  
  //## 요청 인터셉터
  axiosInstance.interceptors.request.use(
    (config) => {

      //# 소요 시간(Latency) 측정용
      if (config.headers) {
        config.headers['X-Start-Time'] = Date.now().toString();
      }

      //# 요청 파라미터 추출 (로그인 시 비밀번호 마스킹 처리)
      const method = config.method?.toUpperCase();
      let payload  = config.data || config.params || {};

      if (config.url?.includes('/login') && payload.password) {
        payload = { ...payload, password: '***' }; 
      }

      //# API 요청 시작 로그
      customLogger.info(`${LOG_TITLE}🚀[REQ] ${method} ${config.url}`, payload);

      //# 인증토큰 삽입
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      customLogger.error(`${LOG_TITLE}🚨[REQ] 요청 세팅 실패`, error);
      return Promise.reject(error);
    },
  );

  //## 응답 인터셉터
  axiosInstance.interceptors.response.use(
    (response) => {
      const config = response.config;
      const method = config.method?.toUpperCase();
      
      //# 성공 로그 및 소요 시간 계산
      const startTime = Number(config.headers?.['X-Start-Time'] || Date.now());
      const duration = Date.now() - startTime;

      customLogger.info(`${LOG_TITLE}✅[RES] ${method} ${config.url} (${response.status}) [${duration}ms]`);

      return response;
    },
    async (error) => {
      const { config } = error;
      const method = config?.method?.toUpperCase() || 'UNKNOWN';
      const url = config?.url || 'UNKNOWN';

      //# 실패 소요 시간 계산
      const startTime = Number(config?.headers?.['X-Start-Time'] || Date.now());
      const duration = Date.now() - startTime;

      const allowMethods = ['get']; // GET 요청만 안전하게 재시도
      const isNetworkIssue = error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';

      //# 백그라운드 재시도
      if (
        isNetworkIssue && 
        config &&
        allowMethods.includes(config.method?.toLowerCase() || '') &&
        (!config._retryCount || config._retryCount < MAX_RETRIES)
      ) {
        config._retryCount = (config._retryCount || 0) + 1;
        customLogger.warn(`${LOG_TITLE}⚠️[RES] 네트워크 지연! ${config._retryCount}번째 재시도 진입 (${method} ${url}) [${duration}ms]`);

        //# 지연 시간만큼 큐를 홀딩
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        //# 해당 인스턴스로 동적 재요청 
        return axiosInstance(config);
      }

      //# 에러 메시지 현지화 및 구조화
      const status = error.response?.status || 'Network Error';
      const errorData = error.response?.data || error.message;
      const errorCode = error.response?.data?.code;

      const isExpectedError = 
        EXPECTED_ERROR_STATUSES.includes(status as number) || 
        EXPECTED_ERROR_CODES.includes(errorCode);

      if (isExpectedError) {
        customLogger.warn(`${LOG_TITLE}⚠️[RES] ${method} ${url} (${status}) [${duration}ms]`, errorData);
      } else {
        customLogger.error(`${LOG_TITLE}🚨[RES] ${method} ${url} (${status}) [${duration}ms]`, errorData);
      }

      const customMessage = error.response?.data?.message
                          || HTTP_ERROR_MESSAGES[status] 
                          || '일시적인 오류가 발생했습니다.';

      error.code = errorCode;
      error.message = customMessage;

      return Promise.reject(error);
    },
  );
}

// ===========================================
//  인스턴스에 전역 가드 일괄 주입 실행
// ===========================================
 //# 로그인용 인스턴스
 bindStandardInterceptors(posLoginInstance);
 //# 메인 포스 업무용 인스턴스
 bindStandardInterceptors(posAuthedInstance);
