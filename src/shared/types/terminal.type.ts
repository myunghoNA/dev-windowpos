import { ApiResponse } from '@shared/types/common.type';

export type TerminalType = 'POS_WINDOW' | string;

/**
 * @description 단말기등록 관리
 */
export type TerminalRegistry = {
  brandId: number;
  storeId: number;
  terminalId : string;  // 최초 로그인 시 발급받은 단말기ID
  registerDt: string;
}

/**
 * @description 매장 단말기 상세 정보
 */
export interface TerminalInfo {
  terminalId: string;
  storeId: number;       
  terminalName: string;
  terminalType: TerminalType;
  terminalVersion: string;
  use: boolean;
  registerDatetime: string;
  updateDatetime: string;
  settings: any[];       //TODO: 향후 세팅 배열 구조가 확정되면 구체화
}

/**
 * @description API - 단말기 조회 요청/응답
 */
export type TerminalInfoResponse = ApiResponse<TerminalInfo>;


/**
 * @description API - 단말기 등록 요청/응답
 */
export type RegisterTerminalRequest = {
  terminalId: string;
  terminalName: string;
  terminalType: TerminalType;
  terminalVersion: string;
};
export type RegisterTerminalResponse = ApiResponse<null>;


/**
 * @description API - 단말기 수정 요청/응답
 */
export type UpdateTerminalRequest = {
  terminalName?: string;
  terminalVersion?: string;
};
export type UpdateTerminalResponse = ApiResponse<null>;