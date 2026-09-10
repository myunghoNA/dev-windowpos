//# Import Helper
import { customLogger, getToday } from '@renderer/common/helpers';
//# Import DB
import { businessDB } from '@renderer/common/repositories/localdb';
//# Import Type
import { StoreData, StoreOperationLocal } from '@shared/types';


const LOG_TITLE = '[STORE-OPERATION.REPOSITORY]';


/**
 * 로컬에 저장된 매장 운영정보를 조회.
 * - 서버 조회 실패(오프라인 등) 시 폴백으로 사용.
 */
export function getStoreOperation(storeId: number): Promise<StoreOperationLocal | undefined> {
  return businessDB.storeOperation.get(storeId);
}

/**
 * 서버에서 받아온 매장 운영정보를 로컬에 저장.
 * - API 응답 성공 시마다 최신값으로 갱신.
 */
export async function putStoreOperation(data: StoreData): Promise<void> {
  const record: StoreOperationLocal = {
    ...data,
    syncedDt: getToday('YYYY-MM-DD HH:mm:ss'),
  };
  await businessDB.storeOperation.put(record);
  
  customLogger.info(
    `${LOG_TITLE} 로컬 DB 갱신 완료 - storeId: ${record.storeId}, syncedDt: ${record.syncedDt}`,
  );
}