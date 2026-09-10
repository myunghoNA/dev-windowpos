/** 세팅- 알림구분 */
export enum NotificationType {
  SYSTEM = 'SYSTEM',
  NEW_ORDER = 'NEW_ORDER',
}


/** 세팅- 프린터 연결유형 */
export enum PrinterConnectType {
  SERIAL = 'SERIAL',
  ETHERNET = 'ETHERNET',
  WINDOWS = 'WINDOWS',
  USB = 'USB',
}


/** 매장- 영업상태 */
export enum BizStatus {
  OPERATE = 'OPERATE',
  SUSPEND = 'SUSPEND',
  TERMINATE = 'TERMINATE',
}

/** 매장- 매장상태 */
export enum StoreStatus {
  OPEN = 'OPEN',
  PAUSE = 'PAUSE',
  CLOSE = 'CLOSE',
}

/** 매장- 마감사유 */
export enum StoreClosedReson {
  BUSY_KITCHEN = 'BUSY_KITCHEN',
  NO_DRIVERS = 'NO_DRIVERS',
  MENU_UPDATE = 'MENU_UPDATE',
  TECHNICAL = 'TECHNICAL',
  BAD_WEATHER = 'BAD_WEATHER',
  HOLIDAY = 'HOLIDAY',
  OTHER = 'OTHER',
}

/** 상품- 상품유형 */
export enum ItemType {
  SINGLE = 'SINGLE',
  SET = 'SET',
}


/** 주문- 주문상태 */
export enum OrderStatus {
	RECEIVE  = 'RECEIVE',   //포스DB 최초 적재시 
	CONFIRM  = 'CONFIRM',   
	REFUSE = 'REFUSE',      
  READY = 'READY',
  DELIVERY = 'DELIVERY',
  CANCEL = 'CANCEL',
  COMPLETE = 'COMPLETE',
}
export const OrderStatusLabel = new Map<OrderStatus, string>([
	[ OrderStatus.RECEIVE, '접수'  ],
	[ OrderStatus.CONFIRM, '수락'  ],
  [ OrderStatus.REFUSE, '거절'  ],
  [ OrderStatus.READY, '준비완료'  ],
  [ OrderStatus.DELIVERY, '배달출발'  ],
  [ OrderStatus.CANCEL, '취소'  ],
  [ OrderStatus.COMPLETE, '완료'  ],
]);


/** 주문- 주문구분 */
export enum OrderType {
	PICKUP   = 'PICKUP',
	STORE    = 'STORE',
	DELIVERY = 'DELIVERY',
  TABLE = 'TABLE',
}

/** 주문- 채널코드 */
export enum ChannelCd {
	FLOWNET = 'FLOWNET',
	HUNGERSTATION = 'HUNGERSTATION',
	JAHEZ = 'JAHEZ',
  KEETA = 'KEETA',
}

/** 주문- 배달유형 */
export enum DeliveryType {
	STORE = 'STORE',
	CHANNEL = 'CHANNEL',
}


/** 결제- 결제수단 */
export enum PayMethod {
	CASH = 'CASH',
	CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  CHANNEL = 'CHANNEL',
}

/** 결제- 결제상태 */
export enum PayStatus {
	APPROVAL = 'APPROVAL',
	REFUND = 'REFUND',
}
