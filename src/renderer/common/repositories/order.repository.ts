//# Import Helper
import { OrderStatus } from '@renderer/providers/com-code.provider';
//# Import DB
import { businessDB } from '@renderer/common/repositories/localdb';
//# Import Type
import {
  Order,
} from '@shared/types/order.type';


//const LOG_TITLE = '[order.repository]';

/**
 * 주문 목록 조회
 */
export const getOrdersByStore = async (storeId: number, orderStatus?: OrderStatus) => {
  let collection;

  if (orderStatus) {
    collection = businessDB.orders.where('[storeId+orderStatus]').equals([storeId, orderStatus]); 
  }else{
    collection = businessDB.orders.where('storeId').equals(storeId);
  }
  
  const orders = await collection.sortBy('orderDatetime');
  return orders.reverse(); 
};

/**
 * 주문 단건 조회
 */
export const getOrderByPk = (orderId: number) => businessDB.orders.get(orderId);

/**
 * 단일 주문 저장 (Upsert)
 */
export const putOrder = async (order: Order): Promise<void> => {
  await businessDB.orders.put(order);
};

/**
 * 벌크 주문 저장 (Upsert)
 */
export const putOrders = async (order: Order[]): Promise<void> => {
  await businessDB.orders.bulkPut(order);
};

/**
 * 주문 목록 동기화 (서버&로컬D)
 * @description 서버&로컬DB 동기화, 사라진 주문은 삭제하고 새 주문은 업데이트
 */
export const syncOrdersByStore = async (storeId: number, serverOrders: Order[]): Promise<void> => {
  
  // Dexie 트랜잭션: 중간에 실패하면 롤백
  await businessDB.transaction('rw', businessDB.orders, async () => {
    
    const localOrders = await businessDB.orders.where('storeId').equals(storeId).toArray();
    const localIds = localOrders.map(o => o.orderId);
    
    const serverIdSet = new Set(serverOrders.map(o => o.orderId));

    //# 로컬에는 있지만 서버 응답에는 없는 ID 필터링 (삭제 대상)
    const idsToDelete = localIds.filter(id => !serverIdSet.has(id)); 
    if (idsToDelete.length > 0) {
      await businessDB.orders.bulkDelete(idsToDelete);
    }

    //# 서버 데이터 덮어쓰기 (Upsert)
    if (serverOrders.length > 0) {
      await businessDB.orders.bulkPut(serverOrders);
    }
  });
};

/**
 * 전체 주문 로컬 삭제
 */
export const clearOrdersByStore = async (storeId: number) => {
  await businessDB.orders.where('storeId').equals(storeId).delete();
};


/**
 * 주문 상태 부분 업데이트 (단건)
 */
export const updateLocalOrderStatus = async (orderId: number, changes: Partial<Order>): Promise<number> => {
  return await businessDB.orders.update(orderId, changes);
};