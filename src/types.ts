// 储存方式
export type StorageType = 'room-temp' | 'refrigerated' | 'frozen';

// 食材类型
export type ItemType = 'fruit' | 'vegetable' | 'meat' | 'carbs';

// 食材
export interface Item {
  id: string;
  name: string;
  productionDate: string; // ISO 日期字符串
  shelfLife: number; // 保质期天数
  type: ItemType;
  storageType: StorageType;
}

// 菜谱类型
export type RecipeType = 'quick' | 'slow';

// 菜谱
export interface Recipe {
  id: string;
  name: string;
  type: RecipeType;
  ingredients: string[]; // 食材名称列表
  seasonings: string[]; // 调料名称列表
}

// 购物清单项
export interface ShoppingItem {
  name: string;
  isFromRecipe: boolean; // 是否来自菜谱
  recipeNames?: string[]; // 关联的菜谱名称
}

