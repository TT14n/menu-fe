import axios from 'axios';
import type { 
  Result, 
  Ingredient, 
  Inventory, 
  Recipe, 
  RecipeCheckResult
} from '../types';
import { 
  IngredientCategoryMap, 
  IngredientCategoryReverseMap,
  StorageTypeMap,
  StorageTypeReverseMap,
  RecipeTypeMap,
  RecipeTypeReverseMap
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器：自动解包 Result
api.interceptors.response.use(
  (response) => {
    const result = response.data as Result<any>;
    if (result.code === 200) {
      return { ...response, data: result.data };
    } else {
      return Promise.reject(new Error(result.message || '请求失败'));
    }
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// ==================== 食材元数据管理 ====================

// 获取食材列表
export async function getIngredients(category?: string): Promise<Ingredient[]> {
  // 如果传入了分类，转换为整数
  const params = category ? { category: IngredientCategoryMap[category as keyof typeof IngredientCategoryMap] } : {};
  
  const response = await api.get<Ingredient[]>('/api/ingredients', { params });
  
  // 将后端返回的整数分类和储存方式转换为中文
  return response.data.map(item => ({
    ...item,
    category: typeof item.category === 'number' 
      ? IngredientCategoryReverseMap[item.category] 
      : item.category,
    storageType: typeof item.storageType === 'number' 
      ? StorageTypeReverseMap[item.storageType] 
      : item.storageType
  })) as Ingredient[];
}

// 搜索食材
export async function searchIngredients(keyword: string): Promise<Ingredient[]> {
  const response = await api.get<Ingredient[]>('/api/ingredients/search', {
    params: { keyword }
  });
  
  // 将后端返回的整数分类和储存方式转换为中文
  return response.data.map(item => ({
    ...item,
    category: typeof item.category === 'number' 
      ? IngredientCategoryReverseMap[item.category] 
      : item.category,
    storageType: typeof item.storageType === 'number' 
      ? StorageTypeReverseMap[item.storageType] 
      : item.storageType
  })) as Ingredient[];
}

// 根据ID获取食材详情
export async function getIngredientById(id: number): Promise<Ingredient> {
  const response = await api.get<Ingredient>(`/api/ingredients/${id}`);
  
  // 将后端返回的整数分类和储存方式转换为中文
  const data = response.data;
  return {
    ...data,
    category: typeof data.category === 'number' 
      ? IngredientCategoryReverseMap[data.category] 
      : data.category,
    storageType: typeof data.storageType === 'number' 
      ? StorageTypeReverseMap[data.storageType] 
      : data.storageType
  } as Ingredient;
}

// 新增食材
export async function addIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<void> {
  // 将中文分类和储存方式转换为后端需要的整数
  const payload = {
    ...ingredient,
    category: IngredientCategoryMap[ingredient.category],
    storageType: StorageTypeMap[ingredient.storageType]
  };
  await api.post('/api/ingredients', payload);
}

// 修改食材
export async function updateIngredient(id: number, ingredient: Omit<Ingredient, 'id'>): Promise<void> {
  // 将中文分类和储存方式转换为后端需要的整数
  const payload = {
    ...ingredient,
    category: IngredientCategoryMap[ingredient.category],
    storageType: StorageTypeMap[ingredient.storageType]
  };
  await api.put(`/api/ingredients/${id}`, payload);
}

// 删除食材
export async function deleteIngredient(id: number): Promise<void> {
  await api.delete(`/api/ingredients/${id}`);
}

// 批量删除食材
export async function batchDeleteIngredients(ids: number[]): Promise<void> {
  await api.delete('/api/ingredients', {
    params: { ids: ids.join(',') }
  });
}

// ==================== 菜谱管理 ====================

// 获取菜谱列表
export async function getRecipes(keyword?: string): Promise<Recipe[]> {
  const response = await api.get<Recipe[]>('/api/recipes/list', {
    params: { keyword }
  });
  
  // 将后端返回的整数类型转换为中文
  return response.data.map(item => ({
    ...item,
    type: typeof item.type === 'number' 
      ? RecipeTypeReverseMap[item.type] 
      : item.type
  })) as Recipe[];
}

// 获取菜谱详情
export async function getRecipeDetail(id: number): Promise<Recipe> {
  const response = await api.get<Recipe>(`/api/recipes/${id}`);
  
  // 将后端返回的整数类型转换为中文
  const data = response.data;
  return {
    ...data,
    type: typeof data.type === 'number' 
      ? RecipeTypeReverseMap[data.type] 
      : data.type,
    ingredientIds: data.ingredientIds || []  // 确保 ingredientIds 始终是数组
  } as Recipe;
}

// 检查菜谱是否可做
export async function checkRecipe(id: number): Promise<RecipeCheckResult> {
  const response = await api.get<RecipeCheckResult>(`/api/recipes/${id}/check`);
  return response.data;
}

// 新增菜谱
export async function addRecipe(recipe: Omit<Recipe, 'id'> & { ingredientIds?: number[] }): Promise<void> {
  // 将中文类型转换为后端需要的整数
  const payload = {
    name: recipe.name,
    type: RecipeTypeMap[recipe.type],
    description: recipe.description,
    coverUrl: recipe.coverUrl,
    ingredientIds: recipe.ingredientIds || []
  };
  await api.post('/api/recipes', payload);
}

// 修改菜谱
export async function updateRecipe(id: number, recipe: Omit<Recipe, 'id'> & { ingredientIds?: number[] }): Promise<void> {
  // 将中文类型转换为后端需要的整数
  const payload = {
    name: recipe.name,
    type: RecipeTypeMap[recipe.type],
    description: recipe.description,
    coverUrl: recipe.coverUrl,
    ingredientIds: recipe.ingredientIds || []
  };
  await api.put(`/api/recipes/${id}`, payload);
}

// 删除菜谱
export async function deleteRecipe(id: number): Promise<void> {
  await api.delete(`/api/recipes/${id}`);
}

// ==================== 库存管理 ====================

// 获取库存列表
export async function getInventory(): Promise<Inventory[]> {
  const response = await api.get<Inventory[]>('/api/inventory/list');
  return response.data;
}

// 添加食材到库存（入库）
export async function addInventoryItem(inventory: Omit<Inventory, 'id' | 'expiryDate' | 'updateTime'>): Promise<void> {
  await api.post('/api/inventory/add', inventory);
}

// 消耗食材（出库）
export async function consumeInventory(ingredientId: number): Promise<void> {
  await api.delete(`/api/inventory/consume/${ingredientId}`);
}

// 移除特定库存条目
export async function removeInventoryItem(id: number): Promise<void> {
  await api.delete(`/api/inventory/${id}`);
}

// 查询临期食材
export async function getExpiringInventory(days: number = 3): Promise<Inventory[]> {
  const response = await api.get<Inventory[]>('/api/inventory/expiring', {
    params: { days }
  });
  return response.data;
}

// 查询已过期食材
export async function getExpiredInventory(): Promise<Inventory[]> {
  const response = await api.get<Inventory[]>('/api/inventory/expired');
  return response.data;
}

// 修改库存条目
export async function updateInventory(inventory: Inventory): Promise<void> {
  await api.put('/api/inventory/update', inventory);
}

// ==================== 文件上传 ====================

// 上传图片
export async function uploadImage(file: File, bizPath: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bizPath', bizPath);
  
  const response = await api.post<string>('/api/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

// ==================== 采购清单系统 ====================

// A. 采购决策（决策阶段）

// 1. 获取缺失食材建议（根据菜谱 ID 获取所有需要的食材）
export async function getPurchasePlan(recipeIds: number[]): Promise<Ingredient[]> {
  const response = await api.get<Ingredient[]>('/api/purchase/plan', {
    params: { recipeIds: recipeIds.join(',') }
  });
  
  // 将后端返回的整数分类和储存方式转换为中文
  return response.data.map(item => ({
    ...item,
    category: typeof item.category === 'number' 
      ? IngredientCategoryReverseMap[item.category] 
      : item.category,
    storageType: typeof item.storageType === 'number' 
      ? StorageTypeReverseMap[item.storageType] 
      : item.storageType
  })) as Ingredient[];
}

// 2. 将选中食材加入清单
export async function addToCart(ingredientIds: number[]): Promise<void> {
  await api.post('/api/purchase/cart/add', ingredientIds);
}

// B. 清单管理（执行阶段）

// 3. 查看当前待买清单
export async function getCart(): Promise<import('../types').PurchaseOrderVO> {
  const response = await api.get<import('../types').PurchaseOrderVO>('/api/purchase/cart');
  return response.data;
}

// 4. 从清单中移除某项
export async function removeFromCart(ingredientId: number): Promise<void> {
  await api.delete(`/api/purchase/cart/item/${ingredientId}`);
}

// C. 结算入库（完成阶段）

// 5. 确认采购并一键入库
export async function confirmCartPurchase(params: {
  orderId: number;
  totalCost: number;
  remark?: string;
}): Promise<void> {
  await api.post('/api/purchase/cart/confirm', null, { params });
}

// D. 历史追溯（管理阶段）

// 6. 获取历史账单列表
export async function getPurchaseOrders(status?: number): Promise<import('../types').PurchaseOrder[]> {
  const response = await api.get<import('../types').PurchaseOrder[]>('/api/purchase/orders', {
    params: status !== undefined ? { status } : {}
  });
  return response.data;
}

// 7. 查看账单明细
export async function getPurchaseOrderDetail(id: number): Promise<import('../types').PurchaseOrderVO> {
  const response = await api.get<import('../types').PurchaseOrderVO>(`/api/purchase/orders/${id}`);
  return response.data;
}

// 8. 删除历史记录
export async function deletePurchaseOrder(id: number): Promise<void> {
  await api.delete(`/api/purchase/orders/${id}`);
}

// ==================== 旧版接口（兼容保留） ====================

// 计算采购清单（根据选中的菜谱 ID，计算当前库存不足的食材）
export async function calculatePurchaseList(recipeIds: number[]): Promise<Ingredient[]> {
  const response = await api.post<Ingredient[]>('/api/purchase/calculate', recipeIds);
  
  // 将后端返回的整数分类和储存方式转换为中文
  return response.data.map(item => ({
    ...item,
    category: typeof item.category === 'number' 
      ? IngredientCategoryReverseMap[item.category] 
      : item.category,
    storageType: typeof item.storageType === 'number' 
      ? StorageTypeReverseMap[item.storageType] 
      : item.storageType
  })) as Ingredient[];
}

// 确认购买并入库（旧版）
export async function confirmPurchase(request: import('../types').PurchaseRequest): Promise<void> {
  await api.post('/api/purchase/confirm', request);
}
