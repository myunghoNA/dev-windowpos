
import { StoreItemAPI } from '@renderer/apis/store.api';
//# Import Helper
import { customLogger } from '@renderer/common/helpers';
import { withSafeReturn } from '@renderer/common/helpers/api.helper';
//# Import DB
import { syncItemsLocal } from '@renderer/common/repositories/store-item.repository';
//# Import Type


/**
 * 매장 상품 전체 동기화
 */
export const getStoreItems = async (storeId: number): Promise<void> => {

  const LOG_TITLE = '[getStoreItems]';

  const res = await withSafeReturn(
    () => StoreItemAPI.getStoreItems(storeId),
    '상품 목록 조회에 실패했습니다.',
  );

  if (res.code === 'SUCCESS' && res.data) {
    await syncItemsLocal(storeId, res.data.itemGroups);
    customLogger.info(`${LOG_TITLE} 로컬 DB 전체 동기화 완료`);
  } else {
    customLogger.warn(`${LOG_TITLE} 서버 통신 실패. 기존 로컬 DB를 유지 합니다`);
  }
};


/**
 * 매장 상품 품절 처리
 */
export const soldoutItemStatus = async (storeId: number, storeItemsId: number) => {
  const res = await withSafeReturn(
    () => StoreItemAPI.soldoutItem(storeId, storeItemsId),
    '상품 품절 처리에 실패했습니다.',
  );

  return res;
};


/**
 * 매장 상품 품절해제 처리
 */
export const availableItemStatus = async (storeId: number, storeItemsId: number) => {
  const res = await withSafeReturn(
    () => StoreItemAPI.availableItem(storeId, storeItemsId),
    '상품 품절 해제 처리에 실패했습니다.',
  );

  return res;
};
