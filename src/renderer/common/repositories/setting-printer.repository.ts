//# Import DB
import { systemDB } from '@renderer/common/repositories/localdb';
import { markSettingSyncPending } from '@renderer/common/repositories/setting-sync.repository';
//# Import Type
import { SettingPrinter } from '@shared/types';


/**
 * 로컬에 저장된 프린터 설정 전체 목록을 조회.
 * @returns 저장된 SettingPrinter 배열 (없으면 빈 배열)
 */
export function getSettingPrinters() {
  return systemDB.settingPrinters.toArray();
}


/**
 * terminalRegisterId+deviceKey로 프린터 설정 1건을 조회
 * @returns 일치하는 SettingPrinter, 없으면 undefined
 */
export function getSettingPrinterByKey(terminalId: string, deviceKey: string) {
  return systemDB.settingPrinters.get([terminalId, deviceKey]);
}

/**
 * 지정한 매장(terminalId)에 저장된 프린터 설정 전체를 조회.
 * - terminalId 인덱스를 사용해 해당 매장 소속 프린터만 필터링.
 * @returns 저장된 SettingPrinter 배열 (없으면 빈 배열)
 */
export function getSettingPrintersByTerminalId(terminalId: string) {
  return systemDB.settingPrinters
    .where('terminalId')
    .equals(terminalId)
    .toArray();
}


/**
 * 프린터 설정 1건을 로컬에 저장하고, 해당 단말기의 'PRINTER_CONNECT' 동기화 상태 마킹
 */
export async function saveSettingPrinter(
  printer: SettingPrinter,
): Promise<void> {
  
  await systemDB.settingPrinters.put({
    ...printer,
  });

  // 동기화 상태를 마킹 
  await markSettingSyncPending({
    terminalId: printer.terminalId,
    settingType: 'PRINTER_CONNECT',
  });
}

/**
 * 프린터 설정 1건을 로컬에서 삭제하고, 해당 단말기의 'PRINTER_CONNECT' 동기화 상태 마킹
 */
export async function deleteSettingPrinter(
  terminalId: string,
  deviceKey: string,
): Promise<void> {

  await systemDB.settingPrinters.delete([terminalId, deviceKey]);

  // 동기화 상태를 마킹
  await markSettingSyncPending({
    terminalId,
    settingType: 'PRINTER_CONNECT',
  });
}
