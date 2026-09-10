import { systemDB } from '@renderer/common/repositories/localdb';

import { markSettingSyncPending } from '@renderer/common/repositories/setting-sync.repository';
import { SettingNotification } from '@shared/types';


/**
 * terminalId의 알림 설정 1건을 조회.
 * @returns 일치하는 SettingNotification, 없으면 undefined
 */
export function getSettingNotificationByKey(terminalId: string, notificationType: string) {
  return systemDB.settingNotification.get([terminalId, notificationType]);
}


/**
 * 지정한 매장(terminalId)에 저장된 알림 설정 전체를 조회.
 * @returns 저장된 settingNotification 배열 (없으면 빈 배열)
 */
export function getSettingPrintersByTerminalId(terminalId: string) {
  return systemDB.settingNotification
    .where('terminalId')
    .equals(terminalId)
    .toArray();
}


/**
 * 알림 설정을 로컬에 저장하고, 해당 단말기의 'NOTIFICATION' 동기화 상태를 마킹
 */
export async function saveSettingNotification(
  notification: SettingNotification,
): Promise<void> {
  
  const terminalId = notification.terminalId;

  await systemDB.settingNotification.put({
    ...notification,
  });


  // 동기화 상태를 마킹 
  await markSettingSyncPending({
    terminalId: terminalId,
    settingType: 'NOTIFICATION',
  });
}