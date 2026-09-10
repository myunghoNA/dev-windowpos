import { InitOrderStatusCounts } from '@renderer/providers';
import { Order, OrderStatusCounts } from '@shared/types/order.type';
import { customLogger } from './logger.helper';


/**
 * @name openOrderStatusCounts
 * @description 영업일기준 상태별 건수를 집계
 */
export function openOrderStatusCounts(orders: Order[]): OrderStatusCounts {
    const counts: OrderStatusCounts = { ...InitOrderStatusCounts };

    orders.forEach((order) => {
        const key = order.orderStatus.toLowerCase() as keyof OrderStatusCounts;

        if (counts[key] !== undefined) {
            counts[key] += 1;
        } else {
            customLogger.warn(`[openOrderStatusCounts] 알 수 없는 주문 상태: ${order.orderStatus}`);
        }
    });

    return counts;
}