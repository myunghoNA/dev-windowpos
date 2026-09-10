
import { OrderAPI } from '@renderer/apis/order.api';
//# Import Helper
import { customLogger } from '@renderer/common/helpers';
import { withSafeReturn } from '@renderer/common/helpers/api.helper';
//# Import DB
import {
  getOrderByPk,
  putOrder,
  syncOrdersByStore,
} from '@renderer/common/repositories/order.repository';
//# Import Type
import {
  BaseOrderStatusRequest,
  Order,
  OrderCancelRefuseRequest,
  OrderConfirmRequest,
  OrderDetailResponse,
} from '@shared/types/order.type';


/**
 * 주문 - 영업일 기준 내역전체 
 */
export const getOpenAllOrders = async (storeId: number): Promise<void> => {

  const LOG_TITLE = '[getOpenAllOrders]';

  const params = {
     storeId: storeId,
  };

  const res = await withSafeReturn(
    () => OrderAPI.getOrders(params),
    '주문목록 조회에 실패했습니다.',
  ); 

  if (res.code === 'SUCCESS' && res.data) {
    await syncOrdersByStore(params.storeId, res.data.orders);
    customLogger.info(`${LOG_TITLE} 로컬 DB 전체 동기화 완료`);
  }
  else{
    customLogger.warn(`${LOG_TITLE} 서버 통신 실패. 기존 로컬 DB를 유지합니다`);
  }
  
};

/**
 * 주문 - 상세정보 조회(단건)
 */
export const getOrderDetail = async (orderId: number): Promise<OrderDetailResponse> => {
  const res = await withSafeReturn(
    () => OrderAPI.getOrderDtail(orderId), 
    `주문(${orderId}) 상세 조회에 실패했습니다.`,
  );

  return res;
};


/**
 * 주문상태변경 - 수락
 */
export const confirmOrderStatus = async (orderId: number, params: OrderConfirmRequest) => {
  const res = await withSafeReturn(
    () => OrderAPI.confirmOrderStatus(orderId, params), 
    '주문 상태 변경에 실패했습니다.',
  );

  return res;
};

/**
 * 주문상태변경 - 거절
 */
export const refuseOrderStatus = async (orderId: number, params: OrderCancelRefuseRequest) => {
  const res = await withSafeReturn(
    () => OrderAPI.refuseOrderStatus(orderId, params), 
    '주문 상태 변경에 실패했습니다.',
  );

  return res;
};

/**
 * 주문상태변경 - 준비완료
 */
export const readyOrderStatus = async (orderId: number, params: BaseOrderStatusRequest) => {
  const res = await withSafeReturn(
    () => OrderAPI.readyOrderStatus(orderId, params), 
    '주문 상태 변경에 실패했습니다.',
  );

  return res;
};

/**
 * 주문상태변경 - 배달출발
 */
export const deliveryOrderStatus = async (orderId: number, params: BaseOrderStatusRequest) => {
  const res = await withSafeReturn(
    () => OrderAPI.deliveryOrderStatus(orderId, params), 
    '주문 상태 변경에 실패했습니다.',
  );

  return res;
};

/**
 * 주문상태변경 - 주문완료
 */
export const completeOrderStatus = async (orderId: number, params: BaseOrderStatusRequest) => {
  const res = await withSafeReturn(
    () => OrderAPI.completeOrderStatus(orderId, params), 
    '주문 상태 변경에 실패했습니다.',
  );

  return res;
};

/**
 * 주문상태변경 - 주문취소
 */
export const cancelOrderStatus = async (orderId: number, params: OrderCancelRefuseRequest) => {
  const res = await withSafeReturn(
    () => OrderAPI.cancelOrderStatus(orderId, params), 
    '주문 상태 변경에 실패했습니다.',
  );

  return res;
};



/**
 * 주문상태변경 -  MQ 이벤트를 받아 로컬 DB 갱신
 */
export const updateOrderStatusByMq = async (
  storeId: number, 
  orderId: number, 
  changes: Partial<Order>,
): Promise<void> => {


  //# 로컬 DB에 해당 orderId가 있는지 확
  const localOrder = await getOrderByPk(orderId);

  if(localOrder){
      //# 존재 시 -> 서버 단건 조회 API 호출
      const res = await getOrderDetail(orderId);

      //# 서버 단건 조회 API 호출 성공 시
      if (res.code === 'SUCCESS' && res.data) {

        const updatedOrder = {
          ...localOrder,
          orderStatus: res.data.orderStatus,
          orderDatetime: res.data.orderDatetime,  
          receiveDatetime: res.data.receiveDatetime, 
          readyDatetime: res.data.readyDatetime,    
          deliveryDatetime: res.data.deliveryDatetime,
          completeDatetime: res.data.completeDatetime,
          cancelDatetime: res.data.cancelDatetime,
          orderCancelReason: res.data.orderCancelReason,
          channelCancelReason: res.data.channelCancelReason,
        };

        await putOrder(updatedOrder);
        customLogger.info(`[MQ] 로컬 DB 주문(${orderId}) 부분 갱신 완료`);
      }
      else{
        customLogger.warn('[MQ] 단건 조회 API 통신 실패. MQ 이벤트 데이터로 임시 덮어쓰기를 시도합니다.');
        await putOrder({
          ...localOrder,
          ...changes,
        });
      }

  }else{
    customLogger.warn(`[MQ] 로컬 DB에 주문(${orderId}) 없음. 전체 내역을 동기화합니다.`);
    await getOpenAllOrders(storeId);
  }

};