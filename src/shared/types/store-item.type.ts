import { ItemType } from '@renderer/providers/com-code.provider';
import { LangName } from '@shared/types/common.type';
import { ApiResponse } from './common.type';

/**
 * @description API - 매장상품 - 옵션상세
 */
export type ItemOption = {
  id: number;
  brandItemOptionsId: number;
  name: LangName;
  amount: number;        
  soldOut: boolean;       
  displaySeq: number;    
  defaultOption: boolean;
};


/**
 * @description API - 매장상품 - 상품 옵션 그룹 
 */
export type ItemOptionGroup = {
  id: number;
  brandItemOptionGroupsId: number;
  name: LangName;
  minCount: number;       
  maxCount: number;     
  displaySeq: number;
  options: ItemOption[];
};

/**
 * @description API - 매장상품
 */
export type ItemData = {
  id: number;
  brandItemsId: number;
  itemType: ItemType; 
  name: LangName;
  detailContent: LangName; 
  amount: number;                 
  soldOut: boolean;            
  displaySeq: number;
  optionGroups: ItemOptionGroup[];
};


/**
 * @description API - 매장상품 - 그룹 (카테고리)
 */
export type ItemGroup = {
  id: number;
  brandItemGroupsId: number;
  name: LangName;
  displaySeq: number;
  items: ItemData[];
};

/**
 * @description API - 상품 목록 조회 응답 DATA
 */
export type ItemListData = {
  itemGroups: ItemGroup[];
};
export type ItemListResponse = ApiResponse<ItemListData>;
export type ItemStatusResponse = ApiResponse<null>;


/**
 * @description 로컬DB - 상품정보
 */
export type StoreItemLocal = ItemListData & {
  storeId: number;
  syncedDt: string;
};


