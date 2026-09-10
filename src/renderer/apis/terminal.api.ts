import { posAuthedInstance } from '@renderer/apis/axios-client';
import { requestAPI } from '@renderer/common/helpers';
//# Import Type
import {
    RegisterTerminalRequest,
    RegisterTerminalResponse,
    TerminalInfoResponse,
    UpdateTerminalRequest,
    UpdateTerminalResponse,
} from '@shared/types/terminal.type';


export const TerminalAPI = {

    //# 매장단말기 - 조회
    getTerminalInfo: (storeId: number, terminalId: string) => {
        return requestAPI<TerminalInfoResponse>(posAuthedInstance, 'get', `/api/stores/${storeId}/terminals/${terminalId}`, undefined);
    },
    //# 매장단말기 - 등록
    registerTerminal: (storeId: number, params: RegisterTerminalRequest) => {
        return requestAPI<RegisterTerminalResponse>(posAuthedInstance, 'post', `/api/stores/${storeId}/terminals`, params);
    },
    //# 매장단말기 - 수정
    updateTerminal: (storeId: number, terminalId: string, params: UpdateTerminalRequest) => {
        return requestAPI<UpdateTerminalResponse>(posAuthedInstance, 'patch', `/api/stores/${storeId}/terminals/${terminalId}`, params);
    },
};
