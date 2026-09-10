import Dexie, { Table } from 'dexie';
//# Import Type
import { Order } from '@shared/types/order.type';
import { SettingNotification, SettingPrinter, SettingSyncMeta } from '@shared/types/setting.type';
import { StoreItemLocal } from '@shared/types/store-item.type';
import { StoreOperationLocal } from '@shared/types/store.type';
import { TerminalRegistry } from '@shared/types/terminal.type';

export class SystemDB extends Dexie {

  //# 단말기 등록관리
  terminalRegistry!: Table<TerminalRegistry, number>;
  //# 설정- 타입별 동기화 상태 (그룹 단위)
  settingSyncMeta!: Table<SettingSyncMeta, [string, string]>;
  //# 설정- 프린터
  settingPrinters!: Table<SettingPrinter, [string, string]>;
   //# 설정- 알림
  settingNotification!: Table<SettingNotification, [string, string]>;

  constructor() {
    super('flow-system-db');

    this.version(1).stores({
      terminalRegistry: 'storeId, terminalId',
      settingSyncMeta: '[terminalId+settingType], terminalId, settingType, syncStatus, isDirty',
      settingPrinters: '[terminalId+deviceKey], terminalId, deviceKey, printerType',
      settingNotification: '[terminalId+notificationType], terminalId',
    });
  }
}


export class BusinessDB extends Dexie {
  //# 매장- 운영정보
  storeOperation!: Table<StoreOperationLocal, number>;
  //# 매장- 상품정보 
  storeItems!: Table<StoreItemLocal, number>;
  //# 주문- 내역(영업일기준)
  orders!: Table<Order, number>;
  
  constructor() {
    super('flow-business-db');

    this.version(1).stores({
      storeOperation: 'storeId',
      storeItems: 'storeId',
      orders: 'orderId, storeId, orderNo, orderStatus',
    });
  }

  async resetData() {
    await this.orders.clear();
    await this.storeItems.clear();
    await this.storeOperation.clear();
  }
}

export const systemDB = new SystemDB();
export const businessDB = new BusinessDB();
