
export type MqStausType = 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

/**
 * @description 이벤트ID
 */
export type MqEventType = 'STORE_OPEN' | 'STORE_CLOSE' | 'STORE_PAUSE' | 
                          'ORDER_RECIVE' | 'ORDER_CONFIRM' | 'ORDER_REFUSE' | 
                          'ORDER_READY' | 'ORDER_DELIVERY' | 'ORDER_COMPLETE' | 'ORDER_CANCEL';

/**
 * @description 이벤트 메시지 규격
 */
export type MqMessage<T = unknown> = {
  store: number;
  event: MqEventType;
  publish: string;   // 발행일시 : 2026-08-10 17:01:04
  data: T;
};



/**
 * @description 매장- 개점 DATA
 */
export type StoreOpenData = {
  bizDate: string;
};

/**
 * @description 주문-상태변경 공통 DATA 
 */
export type BaseOrderStatus = {
  orderId: number;
  flowId: number;
};

/**
 * @description 주문- 거절  DATA
 */
export type OrderRefuseData = BaseOrderStatus & {
  orderCancelReason: string;
};