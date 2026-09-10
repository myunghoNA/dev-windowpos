//# Import Helper
import { getToday } from '@renderer/common/helpers';
//# Import DB
import { businessDB } from '@renderer/common/repositories/localdb';
//# Import Type
import { ItemGroup, StoreItemLocal } from '@shared/types/store-item.type';



/**
 * 매장 상품 전체 조회
 */
export const getItemsByStore = async (storeId: number): Promise<StoreItemLocal | undefined> => {
  return await businessDB.storeItems.get(storeId);
};


/**
 * 매장 상품 전체 덮어쓰기 (API 전체 조회 시 호출)
 */
export const syncItemsLocal = async (storeId: number, itemGroups: ItemGroup[]): Promise<void> => {
  const storeItemLocal: StoreItemLocal = {
    storeId: storeId,
    itemGroups,
    syncedDt: getToday('YYYY-MM-DD HH:mm:ss'),
  };
  
  await businessDB.storeItems.put(storeItemLocal);
};


/**
 * 특정 상품 품절/품절해제 상태 업데이트
 * @returns 변경 성공 여부 (로컬에 데이터가 없으면 false)
 */
export const updateItemSoldOutLocal = async (
  storeId: number, 
  storeItemsId: number, 
  soldOut: boolean,
): Promise<boolean> => {
  
  //# 전체 데이터 꺼내기
  const localData = await getItemsByStore(storeId);

  if (!localData) return false;

  let isUpdated = false;

  //# 그룹 > 상품 순회하며 타겟 상품 상태 변경
  localData.itemGroups.forEach((group) => {
    const itemIndex = group.items.findIndex(item => item.id === storeItemsId);
    
    if (itemIndex !== -1) {
      group.items[itemIndex] = {
        ...group.items[itemIndex],
        soldOut: soldOut,
      };
      isUpdated = true;
    }
  });

  //# 변경사항이 있으면 로컬 DB 다시 덮어쓰기
  if (isUpdated) {
    localData.syncedDt = getToday('YYYY-MM-DD HH:mm:ss');
    await businessDB.storeItems.put(localData);
  }

  return isUpdated;
};