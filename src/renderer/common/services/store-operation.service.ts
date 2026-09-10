import { StoreAPI } from '@renderer/apis/store.api';

//# Import Helper
import { customLogger } from '@renderer/common/helpers';
import { withSafeReturn } from '@renderer/common/helpers/api.helper';
import { StoreClosedReson, StoreStatus } from '@renderer/providers/com-code.provider';
//# Import DB
import { getStoreOperation, putStoreOperation } from '@renderer/common/repositories/store-operation.repository';
//# Import Type
import {
  CloseStoreResponse,
  OpenStoreResponse,
  PauseStoreRequest,
  PauseStoreResponse,
  StoreResponse,
} from '@shared/types/store.type';

/**
 * 서버의 매장 운영정보를 조회하여 Redux에 반영하고, brandId를 반환
 */
export const syncStoreOperation = async (storeId: number): Promise<StoreResponse> => {
  const LOG_TITLE = '[syncStoreOperation]';

  const res = await withSafeReturn(
    () => StoreAPI.getStoreInfo(storeId),
    '서버에서 매장 정보를 가져오지 못했습니다.',
  );

  //# 서버 통신 성공 시 -> 로컬 DB 업데이트 후 데이터 리턴
  if (res.code === 'SUCCESS' && res.data) {
    try {
      await putStoreOperation(res.data);
      customLogger.info(`${LOG_TITLE} 로컬 DB 동기화 완료`);
    } catch (e) {
      customLogger.warn(`${LOG_TITLE} 로컬 DB 저장 실패 (무시하고 진행)`, e);
    }
    return res; 
  }

  //# 서버 통신 실패 (네트워크 장애, 500 에러 등) -> 로컬 DB 확인 (Fallback)
  customLogger.warn(`${LOG_TITLE} 서버 통신 실패. 로컬 DB(캐시)로 폴백합니다.`, res.message);
  
  const localData = await getStoreOperation(storeId).catch(() => null);

  if (localData) {
    customLogger.info(`${LOG_TITLE} 로컬 DB 데이터로 오프라인 구동 - syncedDt: ${localData.syncedDt}`);
    
    return {
      success: true,
      code: 'OFFLINE_FALLBACK',
      message: '오프라인 로컬 모드로 구동됩니다.',
      data: localData,
    };
  }

  return {
    success: false,
    code: 'NO_STORE_DATA',
    message: '저장된 매장 정보가 없어 구동할 수 없습니다.',
    data: null,
  };
};

/**
 * 매장상태- 개점 상태로 변경
 */
export const openStore = async ( storeId: number ): Promise<OpenStoreResponse> => { 
  const LOG_TITLE = '[openStore]';

  const res = await withSafeReturn(
    () => StoreAPI.openStore(storeId),
    '매장 개점 처리에 실패했습니다.',
  );

  if (res.success) {
    const existing = await getStoreOperation(storeId);

    if (existing) {
      await putStoreOperation({
        ...existing,
        operate: {
          ...existing.operate,
          storeStatus: StoreStatus.OPEN, 
        },
      });
      customLogger.info(`${LOG_TITLE} 로컬 DB 개점 상태(OPEN) 반영 완료`);
    } else {
      customLogger.warn(`${LOG_TITLE} 로컬 DB에 기존 데이터 없음 - storeId: ${storeId}`);
    }
  }

  return res;
};



/**
 * 매장상태- 일시중지 상태로 변경
 */
export const pauseStore = async ( storeId: number, params: PauseStoreRequest ): Promise<PauseStoreResponse> => { 
  const LOG_TITLE = '[pauseStore]';

  const res = await withSafeReturn(
    () => StoreAPI.pauseStore(storeId, params),
    '매장 일시중지 처리에 실패했습니다.',
  );

  if (res.code === 'SUCCESS') {
    const existing = await getStoreOperation(storeId);

    if (existing) {
      await putStoreOperation({
        ...existing,
        operate: {
          ...existing.operate,
          storeStatus: StoreStatus.PAUSE, // 💡 PAUSE 상태로 업데이트
        },
      });
      customLogger.info(`${LOG_TITLE} 로컬 DB 일시중지 상태(PAUSE) 반영 완료`);
    } else {
      customLogger.warn(`${LOG_TITLE} 로컬 DB에 기존 데이터 없음 - storeId: ${storeId}`);
    }
  }

  return res;
};


/**
 * 매장상태- 마감 상태로 변경
 */
export const closeStore = async ( storeId: number, closedReason: StoreClosedReson ): Promise<CloseStoreResponse> => {
  const LOG_TITLE = '[closeStore]';

  const res = await withSafeReturn(
    () => StoreAPI.closeStore(storeId, { closedReason }),
    '매장 마감 처리에 실패했습니다.',
  );

  if (res.code === 'SUCCESS') {
    const existing = await getStoreOperation(storeId);

    if (existing) {
      await putStoreOperation({
        ...existing,
        operate: {
          ...existing.operate,
          storeStatus: StoreStatus.CLOSE,
        },
      });
      customLogger.info(`${LOG_TITLE} 로컬 DB 마감 상태(CLOSE) 반영 완료`);
    } else {
      customLogger.warn(`${LOG_TITLE} 로컬 DB에 기존 데이터 없음 - storeId: ${storeId}`);
    }
  }

  return res;
};

/**
 * 타 기기에서 매장 상태 변경 시 MQ 이벤트를 받아 로컬 DB 갱신
 */
export const updateStoreStatusByMq = async (
  storeId: number,
  status: StoreStatus,
  bizDate?: string,
): Promise<void> => {
  const LOG_TITLE = '[updateStoreStatusByMq]';
  const existing = await getStoreOperation(storeId);

  if (existing) {
    const updatedStore = {
      ...existing,
      operate: {
        ...existing.operate,
        storeStatus: status,
        ...(bizDate && { bizDate }),
      },
    };
    await putStoreOperation(updatedStore);
    customLogger.info(`${LOG_TITLE} 로컬 DB 상태 [${status}] 갱신 완료`);
  } 
  else {
    // 로컬 데이터가 아예 없으면 최신 데이터로 전체 동기화
    await syncStoreOperation(storeId);
    customLogger.info(`${LOG_TITLE} 매장 정보 없음 -> 서버 전체 동기화 완료`);
  }
};