
import { ApiResponse } from '@shared/types/common.type';

/**
 * @description 네트워크 상태
 */
export type NetworkStatus = 'online' | 'offline';
/**
 * @description API - 네트워크 응답
 */
export type NetworkStatusResponse = ApiResponse<string | null>;


/**
 * @description 공통 응답
 */
export type ComResponseType = {
  isSuccess : boolean;
  resultMessage?: any;
  errorMessage?: string;
}

/**
 * @description App 제어
 */
export type AppControlType = 'maximize' | 'minimize' | 'close';

/**
 * @description Window 제어
 */
export type WindowControlType = 'show' | 'hide';

/**
 * @description 애플리케이션이 구동 중인 OS 및 실행 환경
 */
export type SystemInfo = {
  version: string;
  platform: string;
  arch: string;
  osRelease: string;
  locale: string;
  isPackaged: boolean;
  userDataPath: string;
  totalMemory: string;
};


/**
 * @description Window 앱 업데이트 체크결과
 */
export type AppUpdateCheckResult = {
  isUpdateAble: boolean;
  currentVersion: string;
  latestVersion: string | null;
  releaseDate?: string;
  errorMessage?: string;
};