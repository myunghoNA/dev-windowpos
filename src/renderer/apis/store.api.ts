import { posAuthedInstance, posLoginInstance } from '@renderer/apis/axios-client';
//# Import Helper
import { requestAPI } from '@renderer/common/helpers';
//# Import Type
import { StoreResponse } from '@shared/types';
import { LoginRequest, LoginResponse } from '@shared/types/auth.type';
import { ItemListResponse, ItemStatusResponse } from '@shared/types/store-item.type';
import {
    CloseStoreRequest,
    CloseStoreResponse,
    OpenStoreResponse,
    PauseStoreRequest,
    PauseStoreResponse,
} from '@shared/types/store.type';


export const StoreAPI = {
    //# 로그인
    login: (params: LoginRequest) => {
        return requestAPI<LoginResponse>(posLoginInstance, 'post', '/api/stores/login', params);
    },
    //# 매장정보조회
    getStoreInfo: (storeId: number) => {
        return requestAPI<StoreResponse>(posAuthedInstance, 'get', `/api/stores/${storeId}`, undefined);
    },

    //# 매장상태변경 - 개점
    openStore: (storeId: number) => {
        return requestAPI<OpenStoreResponse>(posAuthedInstance, 'patch', `/api/stores/${storeId}/open`, undefined);
    },
    //# 매장상태변경 - 일시중지
    pauseStore: (storeId: number, params: PauseStoreRequest) => {
        return requestAPI<PauseStoreResponse>(posAuthedInstance, 'patch', `/api/stores/${storeId}/pause`, params);
    },
    //# 매장상태변경 - 마감
    closeStore: (storeId: number, params: CloseStoreRequest) => {
        return requestAPI<CloseStoreResponse>(posAuthedInstance, 'patch', `/api/stores/${storeId}/close`, params);
    },
};


export const StoreItemAPI = {
    //# 매장상품 - 전제조회
    getStoreItems: (storeId: number) => {
        return requestAPI<ItemListResponse>(posAuthedInstance, 'get', `/api/stores/${storeId}/items`, undefined);
    },
    //# 매장상품 - 품절
    soldoutItem: (storeId: number, storeItemId: number) => {
        return requestAPI<ItemStatusResponse>(posAuthedInstance, 'patch', `/api/stores/${storeId}/items/${storeItemId}/soldout`, undefined);
    },
    //# 매장상품 - 품절 해제
    availableItem: (storeId: number, storeItemId: number) => {
        return requestAPI<ItemStatusResponse>(posAuthedInstance, 'patch', `/api/stores/${storeId}/items/${storeItemId}/available`, undefined);
    },

};