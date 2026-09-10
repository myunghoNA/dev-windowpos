import {
  ChannelCd,
  DeliveryType,
  ItemType,
  OrderStatus,
  OrderType,
  PayMethod, PayStatus,
} from '@renderer/providers/com-code.provider';
import { ApiResponse } from './common.type';


/**
 * @description API - 주문 상품 정보
 */
export type OrderItem = {
  id: number;
  itemId: number | null;
  channelItemId: string | null;
  itemType: ItemType;
  itemNameArabic: string | null;
  itemNameEnglish: string | null;
  unitPrice: number;
  totalAmount: number;
  quantity: number;
};

/**
 * @description API - 주문 결제 정보
 */
export type OrderPayment = {
  id: number;
  payMethod: PayMethod;
  payStatus: PayStatus;
  payAmount: number;
  discountAmount: number;
  payDatetime: string;
  refundAmount: number;
  refundDatetime: string | null;
};

/**
 * @description API - 주문 정보
 */
export type Order = {
  orderId: number;
  storeId: number;
  flowId: number;
  channelCode: string;
  channelOrderId: string;
  orderNo: string;
  shortOrderId: string | null;
  displayOrderId: string | null;
  orderType: OrderType;
  deliveryType: DeliveryType | null;
  phoneNo: string | null;
  address: string | null;
  orderStatus: OrderStatus;
  totalAmount: number;
  saleAmount: number | null;
  discountAmount: number | null;
  deliveryFee: number | null;
  serviceFee: number | null;
  packagingFee: number | null;
  taxAmount: number | null;
  preorder: boolean;
  prepaid: boolean;
  orderDatetime: string;
  receiveDatetime: string | null;
  readyDatetime: string | null;
  deliveryDatetime: string | null;
  completeDatetime: string | null;
  cancelDatetime: string | null;
  orderCancelReason: string | null;
  channelCancelReason: string | null;
  preparationMinute: number;
  storeMemo: string | null;
  riderMemo: string | null;
  items: OrderItem[];
  payments: OrderPayment[];
};

/**
 * @description API - 상태별 주문 건수
 */
export type OrderStatusCounts = {
  receive: number;
  confirm: number;
  refuse: number;
  ready: number;
  delivery: number;
  complete: number;
  cancel: number;
};

/**
 * @description API - 주문 목록 조회 DATA
 */
export type OrderListData = {
  orders: Order[];
  statusCounts: OrderStatusCounts;
};

/**
 * @description API - 주문 목록 조회 요청/응답
 */
export type OrderListRequest = {
  storeId: number;                 // 필수
  bizDate?: string;                // 선택 (예: "2026-08-27")
  orderStatus?: OrderStatus | '';  // 선택 
};
export type OrderListResponse = ApiResponse<OrderListData | null>;

/**
 * @description API - 주문 상세 조회 요청/응답
 */
export type OrderDetailResponse = ApiResponse<Order | null>;


/**
 * @description API - 상태변경 공통 요청 파라미터
 */
export type BaseOrderStatusRequest = {
  flowId: number;
  channelCode: ChannelCd;
  channelOrderId: string;
}

/**
 * @description API - 주문 수락 (CONFIRM) 요청
 */
export type OrderConfirmRequest = BaseOrderStatusRequest & {
  preparationMinute: number;
};

/**
 * @description API - 주문 거절(REFUSE) 및 취소(CANCEL) 요청
 */
export type OrderCancelRefuseRequest = BaseOrderStatusRequest & {
  orderCancelReason: string;
};

export type OrderStatusResponse = ApiResponse<null>;