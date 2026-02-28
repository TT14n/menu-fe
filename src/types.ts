// ==================== 后端统一响应格式 ====================
export interface Result<T> {
  code: number;
  message: string;
  data: T;
}

// ==================== 枚举类型（同步后端） ====================

// 储存方式 (StorageType)
export type StorageType = '常温' | '冷藏' | '冷冻';

// 储存方式枚举映射（前端中文 -> 后端整数）
export const StorageTypeMap: Record<StorageType, number> = {
  '常温': 0,    // ROOM
  '冷藏': 1,    // COLD
  '冷冻': 2     // FROZEN
};

// 反向映射（后端整数 -> 前端中文）
export const StorageTypeReverseMap: Record<number, StorageType> = {
  0: '常温',
  1: '冷藏',
  2: '冷冻'
};

// 食材分类 (IngredientCategory)
export type IngredientCategory = '水果' | '蔬菜' | '肉类' | '碳水' | '调料';

// 食材分类枚举映射（前端中文 -> 后端整数）
export const IngredientCategoryMap: Record<IngredientCategory, number> = {
  '水果': 0,    // FRUIT
  '蔬菜': 1,    // VEGETABLE
  '肉类': 2,    // MEAT
  '碳水': 3,    // CARB
  '调料': 4     // SPICE
};

// 反向映射（后端整数 -> 前端中文）
export const IngredientCategoryReverseMap: Record<number, IngredientCategory> = {
  0: '水果',
  1: '蔬菜',
  2: '肉类',
  3: '碳水',
  4: '调料'
};

// 菜谱类型 (RecipeType)
export type RecipeType = '快手菜' | '功夫菜';

// 菜谱类型枚举映射（前端中文 -> 后端整数）
export const RecipeTypeMap: Record<RecipeType, number> = {
  '快手菜': 0,  // FAST
  '功夫菜': 1   // SLOW
};

// 反向映射（后端整数 -> 前端中文）
export const RecipeTypeReverseMap: Record<number, RecipeType> = {
  0: '快手菜',
  1: '功夫菜'
};

// ==================== 实体类型（同步后端） ====================

// 食材元数据 (Ingredient)
export interface Ingredient {
  id: number;
  name: string;
  category: IngredientCategory;
  shelfLifeDays: number;
  storageType: StorageType;  // 建议的储存方式
  imageUrl: string;
}

// 库存 (Inventory)
export interface Inventory {
  id: number;
  ingredientId: number;
  productionDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  storageType: StorageType;
  updateTime: string; // ISO 8601
}

// 菜谱 (Recipe)
export interface Recipe {
  id: number;
  name: string;
  type: RecipeType;
  description: string;
  coverUrl: string;
  ingredientIds?: number[];  // 关联的食材ID列表
}

// 菜谱食材关联 (RecipeIngredient)
export interface RecipeIngredient {
  id: number;
  recipeId: number;
  ingredientId: number;
  isSpice: boolean;
}

// 购买请求 (PurchaseRequest)
export interface PurchaseRequest {
  ingredientIds: number[];
  totalCost: number;
  remark?: string;
}

// 菜谱检查结果
export interface RecipeCheckResult {
  canMake: boolean;
  missingIngredients: Ingredient[];
}

// ==================== 采购清单系统类型 ====================

// 采购订单状态
export type PurchaseStatus = 'DRAFT' | 'PURCHASED';

// 采购订单状态枚举映射（前端中文 -> 后端整数）
export const PurchaseStatusMap: Record<PurchaseStatus, number> = {
  'DRAFT': 0,       // 待购买（购物车）
  'PURCHASED': 1    // 已完成（历史订单）
};

// 反向映射（后端整数 -> 前端状态）
export const PurchaseStatusReverseMap: Record<number, PurchaseStatus> = {
  0: 'DRAFT',
  1: 'PURCHASED'
};

// 采购订单项
export interface PurchaseOrderItem {
  ingredientId: number;
  ingredientName: string;
  unit?: string;
}

// 采购订单
export interface PurchaseOrder {
  id: number;
  status: PurchaseStatus;
  totalCost: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  items?: PurchaseOrderItem[];
}

// 采购订单 VO（用于前端展示）
export interface PurchaseOrderVO {
  id: number;
  status: PurchaseStatus;
  totalCost: number;
  remark?: string;
  createTime?: string;
  items: PurchaseOrderItem[];
}

// ==================== 前端扩展类型 ====================

// 库存扩展（包含食材信息）
export interface InventoryWithIngredient extends Inventory {
  ingredient?: Ingredient;
}

// 菜谱扩展（包含食材列表）
export interface RecipeWithIngredients extends Recipe {
  ingredients: Ingredient[];
  seasonings: Ingredient[];
}

// 购物清单项
export interface ShoppingItem {
  ingredient: Ingredient;
  recipeNames: string[];
}

