
//# Import Service
import { updateOrderStatusByMq } from '@renderer/common/services/order.service';
import { updateStoreStatusByMq } from '@renderer/common/services/store-operation.service';
//# Import Helper
import { customLogger } from '@renderer/common/helpers';
import { OrderStatus, StoreStatus } from '@renderer/providers';
//# Import Type
import {
  BaseOrderStatus,
  MqMessage,
  OrderRefuseData,
  StoreOpenData,
} from '@shared/types/mq.type';


type HandlerFn = (data: any, raw: MqMessage) => void | Promise<void>;

const handlers: Record<string, HandlerFn> = {
  
  /** 매장- 개점 */
  STORE_OPEN: async (data: StoreOpenData, raw: MqMessage) => {
    await updateStoreStatusByMq(raw.store, StoreStatus.OPEN, data.bizDate);
  },
  /** 매장- 일시중지 */
  STORE_PAUSE: async (data:null, raw: MqMessage) => {
    await updateStoreStatusByMq(raw.store, StoreStatus.PAUSE);
  },
  /** 매장- 마감 */
  STORE_CLOSE: async (data:null, raw: MqMessage) => {
    await updateStoreStatusByMq(raw.store, StoreStatus.CLOSE);
    //TODO: 로컬DB 주문내역 초기화
  },
  
  /** 주문- 접수 */
  ORDER_RECEIVE: async (data: BaseOrderStatus, raw: MqMessage) => {
    await updateOrderStatusByMq(raw.store, data.orderId, { orderStatus: OrderStatus.RECEIVE });
  },
  /** 주문- 수락 */
  ORDER_CONFIRM: async (data: BaseOrderStatus, raw: MqMessage) => {
    await updateOrderStatusByMq(raw.store, data.orderId, { orderStatus: OrderStatus.CONFIRM });
  },
  /** 주문- 거절 */
  ORDER_REFUSE: async (data: OrderRefuseData, raw: MqMessage) => {
    await updateOrderStatusByMq(raw.store, data.orderId, { 
      orderStatus: OrderStatus.REFUSE,
      orderCancelReason: data.orderCancelReason, 
    });
  },
  /** 주문- 준비완료 */
  ORDER_READY: async (data: BaseOrderStatus, raw: MqMessage) => {
     await updateOrderStatusByMq(raw.store, data.orderId, { orderStatus: OrderStatus.READY });
  },
  /** 주문- 배달출발 */
  ORDER_DELIVERY: async (data: BaseOrderStatus, raw: MqMessage) => {
    await updateOrderStatusByMq(raw.store, data.orderId, { orderStatus: OrderStatus.DELIVERY });
  },
  /** 주문- 완료 */
  ORDER_COMPLETE: async (data: BaseOrderStatus, raw: MqMessage) => {
     await updateOrderStatusByMq(raw.store, data.orderId, { orderStatus: OrderStatus.COMPLETE });
  },
  /** 주문- 취소 */
  ORDER_CANCEL: async (data: BaseOrderStatus, raw: MqMessage) => {
     await updateOrderStatusByMq(raw.store, data.orderId, { orderStatus: OrderStatus.CANCEL });
  },

};


/**
 * 수신한 MQ 메시지를 event 값에 따라 등록된 핸들러로 라우팅
 * - 매핑에 없는 이벤트는 경고만 남기고 무시
 */
export async function dispatchMqEvent(raw: MqMessage): Promise<void> {
  const handler = handlers[raw.event];

  if (!handler) {
    customLogger.warn(`[MQ] 처리되지 않는 이벤트 타입 - ${raw.event}`, raw);
    return;
  }

  customLogger.info('[MQ] 원본메시지 :: ', raw);

  try {
    await handler(raw.data, raw);
  } catch (error) {
    customLogger.error(`[MQ] 이벤트 처리 중 오류 - ${raw.event}`, error);
  }
}