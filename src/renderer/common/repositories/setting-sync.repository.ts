//# Import Helper
import { getToday } from '@renderer/common/helpers';
//# Import DB
import { systemDB } from '@renderer/common/repositories/localdb';
//# Import Type
import { SettingSyncPk } from '@shared/types';


/**
 * 지정한 단말기의 특정 설정타입을 동기화 대기(PENDING) 상태로 마킹
 */
export async function markSettingSyncPending(params: SettingSyncPk): Promise<void> {
 
  const { terminalId, settingType } = params;

  const key: [string, string] = [terminalId, settingType];
  const existing = await systemDB.settingSyncMeta.get(key);

  if (existing) {
    await systemDB.settingSyncMeta.update(key, {
      syncStatus: 'PENDING',
      isDirty: true,
      finalDirtyDt: getToday('YYYY-MM-DD HH:mm:ss'),
    });
  } 
  else {
    await systemDB.settingSyncMeta.put({
      terminalId,
      settingType,
      syncVersion: 0,
      syncStatus: 'PENDING',
      finalSyncDt: '',
      isDirty: true,
      finalDirtyDt: getToday('YYYY-MM-DD HH:mm:ss'),
    });
  }

}