import { posAuthedInstance } from '@renderer/apis/axios-client';
//# Import Helper
import { requestAPI } from '@renderer/common/helpers';
//# Import Type
import {
    BaseOrderStatusRequest,
    OrderCancelRefuseRequest,
    OrderConfirmRequest,
    OrderDetailResponse,
    OrderListRequest,
    OrderListResponse,
    OrderStatusResponse,
} from '@shared/types/order.type';


export const OrderAPI = {
    //# 주문목록조회
    getOrders: (params: OrderListRequest) => {
        return requestAPI<OrderListResponse>(posAuthedInstance, 'get', '/api/orders', params);
    },

    //# 주문상세조회-단건
    getOrderDtail: (ordersId: number) => {
        return requestAPI<OrderDetailResponse>(posAuthedInstance, 'get', `/api/orders/${ordersId}`, undefined);
    },

    //# 주문상태변경 - 수락
    confirmOrderStatus: (orderId: number, params: OrderConfirmRequest) => {
        return requestAPI<OrderStatusResponse>(posAuthedInstance, 'patch', `/api/orders/${orderId}/confirm`, params);
    },

    //# 주문상태변경 - 거절
    refuseOrderStatus: (orderId: number, params: OrderCancelRefuseRequest) => {
        return requestAPI<OrderStatusResponse>(posAuthedInstance, 'patch', `/api/orders/${orderId}/refuse`, params);
    },

    //# 주문상태변경 - 준비완료
    readyOrderStatus: (orderId: number, params: BaseOrderStatusRequest) => {
        return requestAPI<OrderStatusResponse>(posAuthedInstance, 'patch', `/api/orders/${orderId}/ready`, params);
    },

    //# 주문상태변경 - 배달출발
    deliveryOrderStatus: (orderId: number, params: BaseOrderStatusRequest) => {
        return requestAPI<OrderStatusResponse>(posAuthedInstance, 'patch', `/api/orders/${orderId}/delivery`, params);
    },

    //# 주문상태변경 - 주문완료
    completeOrderStatus: (orderId: number, params: BaseOrderStatusRequest) => {
        return requestAPI<OrderStatusResponse>(posAuthedInstance, 'patch', `/api/orders/${orderId}/complete`, params);
    },

    //# 주문상태변경 - 주문취소
    cancelOrderStatus: (orderId: number, params: OrderCancelRefuseRequest) => {
        return requestAPI<OrderStatusResponse>(posAuthedInstance, 'patch', `/api/orders/${orderId}/cancel`, params);
    },
};
