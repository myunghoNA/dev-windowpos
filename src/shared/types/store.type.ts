import { BizStatus, StoreClosedReson, StoreStatus } from '@renderer/providers/com-code.provider';
import { ApiResponse, LangName } from '@shared/types/common.type';


/**
 * @description API - 브랜드
 */
export type Brand = {
  brandId: number;
  brandName : LangName
};


/**
 * @description API - 매장운영
 */
export type StoreOperation = {
  storeStatus: StoreStatus;    
  bizDate: string;          // YYYY-MM-DD
  deliveryOrder: boolean;
  pickupOrder: boolean;
  ordAutoRcpt: boolean;
  preparationMinute: number;
};


/**
 * @description API - 매장정보 조회 DATA
 */
export type StoreData = {
  storeId: number;
  brand: Brand;
  storeName: LangName;
  operatorName: LangName;
  bossName: LangName;
  storePhoneNo: string;
  storeAddress: LangName;
  bizStatus: BizStatus; 
  use: boolean;
  operate: StoreOperation;
};

/**
 * @description API - 매장정보 전체 응답
 */
export type StoreResponse = ApiResponse<StoreData | null>;


/**
 * @description 로컬DB - 매장정보
 */
export type StoreOperationLocal = StoreData & {
  syncedDt: string;
};


/**
 * @description API - 매장 개점 응답
 */
export type OpenStoreResponse = ApiResponse<null>;


/**
 * @description API - 매장 일시중지 요청/응답
 */
export type PauseStoreRequest = {
  closedReason: StoreClosedReson;
  closedUntil: string;
};
export type PauseStoreResponse = ApiResponse<null>;


/**
 * @description API - 매장 마감 요청/응답
 */
export type CloseStoreRequest = {
  closedReason: StoreClosedReson;
};
export type CloseStoreResponse = ApiResponse<null>;
