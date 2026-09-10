
import { TerminalAPI } from '@renderer/apis/terminal.api';
//# Import Helper
import { withSafeReturn } from '@renderer/common/helpers/api.helper';
//# Import Type
import {
  RegisterTerminalRequest,
  RegisterTerminalResponse,
  TerminalInfoResponse,
  UpdateTerminalRequest,
  UpdateTerminalResponse,
} from '@shared/types/terminal.type';


/**
 * 단말기 - 서버 등록정보 조회
 */
export const getTerminalInfo = (storeId: number, terminalId: string): Promise<TerminalInfoResponse> => {
  return withSafeReturn(
    () => TerminalAPI.getTerminalInfo(storeId, terminalId),
    '단말기 조회에 실패했습니다.',
  );
};


/**
 * 단말기 - 매장단말기 서버 등록 
 */
export const registerTerminal = (storeId: number, params: RegisterTerminalRequest): Promise<RegisterTerminalResponse> => { 
  return withSafeReturn(
    () => TerminalAPI.registerTerminal(storeId, params),
    '단말기 등록 처리에 실패했습니다.',
  );
};


/**
 * 단말기 - 매장단말기 서버 수정
 */
export const updateTerminal = (storeId: number, terminalId: string, params: UpdateTerminalRequest): Promise<UpdateTerminalResponse> => { 
  return withSafeReturn(
    () => TerminalAPI.updateTerminal(storeId, terminalId, params),
    '단말기 수정 처리에 실패했습니다.',
  );
};
