import { useState, useEffect } from 'preact/hooks';
import type { InventoryWithIngredient, RecipeWithIngredients, ShoppingItem, Ingredient, IngredientCategory, StorageType, RecipeType, Recipe } from './types';
import { StorageArea } from './components/StorageArea';
import { RecipeArea } from './components/RecipeArea';
import { ShoppingList } from './components/ShoppingList';
import { IngredientArea } from './components/IngredientArea';
import { showToast } from './components/Toast';
import { 
  getInventory, 
  getRecipes, 
  getIngredients,
  getIngredientById,
  getRecipeDetail,
  addToCart,
  getCart,
  removeFromCart,
  confirmCartPurchase,
  getPurchaseOrders,
  getPurchaseOrderDetail,
  deletePurchaseOrder,
  addIngredient,
  updateIngredient,
  addInventoryItem,
  addRecipe,
  updateRecipe,
  deleteIngredient,
  batchDeleteIngredients,
  deleteRecipe,
  uploadImage
} from './api';
import { isExpiringSoon } from './utils/dateUtils';
import { useIsMobile } from './hooks/useIsMobile';
import { Package, ChefHat, ShoppingCart, Loader, Apple, History, ExternalLink, Trash2 } from 'lucide-preact';
import './styles/responsive.css';

type TabType = 'ingredients' | 'storage' | 'recipes' | 'shopping' | 'history';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('ingredients');
  const [inventory, setInventory] = useState<InventoryWithIngredient[]>([]);
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      // 从后端加载数据
      const [inventoryData, recipesData, ingredientsData] = await Promise.all([
        getInventory(),
        getRecipes(),
        getIngredients(),
      ]);
      
      // 将库存和食材信息关联
      const inventoryWithIngredient: InventoryWithIngredient[] = inventoryData.map(inv => ({
        ...inv,
        ingredient: ingredientsData.find(ing => ing.id === inv.ingredientId)
      }));
      
      // 处理菜谱数据
      const processedRecipes = recipesData as RecipeWithIngredients[];
      
      setInventory(inventoryWithIngredient);
      setRecipes(processedRecipes);
      setIngredients(ingredientsData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '加载数据失败，请检查后端连接';
      setError(errorMsg);
      console.error('加载数据失败:', err);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  }

  function toggleRecipe(recipeId: number) {
    setSelectedRecipes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  }

  // 计算购物清单（从后端购物车获取）
  async function calculateShoppingList(): Promise<ShoppingItem[]> {
    const shoppingMap = new Map<number, { ingredient: Ingredient; recipeNames: string[] }>();

    try {
      const cart = await getCart();
      
      // 检查购物车是否为空或null
      if (cart && cart.items && Array.isArray(cart.items)) {
        // 将购物车中的食材添加到购物清单
        cart.items.forEach(item => {
          const ingredient = ingredients.find(ing => ing.id === item.ingredientId);
          if (ingredient) {
            shoppingMap.set(ingredient.id, {
              ingredient,
              recipeNames: [] // 不再显示用于菜谱
            });
          }
        });
      }
    } catch (err) {
      console.error('获取购物车失败:', err);
      // 如果后端调用失败，返回空列表
    }

    return Array.from(shoppingMap.values());
  }

  // 刷新购物清单
  async function refreshShoppingList() {
    setLoadingShoppingList(true);
    try {
      const list = await calculateShoppingList();
      setShoppingList(list);
    } catch (err) {
      console.error('刷新购物清单失败:', err);
      setShoppingList([]);
    } finally {
      setLoadingShoppingList(false);
    }
  }



  function getExpiringItems(): InventoryWithIngredient[] {
    return inventory.filter(item => isExpiringSoon(item.expiryDate));
  }

  async function handleConfirmPurchase() {
    if (shoppingList.length === 0) {
      showToast('购物清单为空', 'info');
      return;
    }

    try {
      // 先获取当前购物车信息
      const cart = await getCart();
      
      // 检查购物车是否存在
      if (!cart || !cart.id) {
        showToast('购物车为空，无法完成购买', 'error');
        return;
      }
      
      // 调用确认购买接口（后端会自动入库）
      await confirmCartPurchase({
        orderId: cart.id,
        totalCost: 0, // 可以根据需要让用户输入总价
        remark: `购买 ${shoppingList.length} 种食材`
      });
      
      // 重新加载数据（后端会自动将食材添加到库存）
      await loadData();
      setSelectedRecipes(new Set());
      showToast('购买成功！食材已自动入库到储物区', 'success');
      
      // 刷新购物清单
      await refreshShoppingList();
    } catch (err) {
      console.error('确认购买失败:', err);
      showToast('购买失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  // 从购物车移除单个食材
  async function handleRemoveFromCart(ingredientId: number) {
    try {
      // 调用后端接口移除
      await removeFromCart(ingredientId);
      showToast('已从购物车移除', 'success');
      
      // 刷新购物清单
      await refreshShoppingList();
    } catch (err) {
      console.error('移除失败:', err);
      showToast('移除失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  // 批量从购物车移除食材
  async function handleBatchRemoveFromCart(ingredientIds: number[]) {
    try {
      // 批量调用后端接口
      await Promise.all(ingredientIds.map(id => removeFromCart(id)));
      showToast(`已移除 ${ingredientIds.length} 项食材`, 'success');
      
      // 刷新购物清单
      await refreshShoppingList();
    } catch (err) {
      console.error('批量移除失败:', err);
      showToast('批量移除失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  // 添加到购物清单的处理函数
  async function handleAddToShoppingList(ingredientId: number) {
    try {
      // 调用后端接口加入购物车
      await addToCart([ingredientId]);
      showToast('已添加到购物清单', 'success');
      
      // 刷新购物清单
      await refreshShoppingList();
    } catch (err) {
      console.error('添加失败:', err);
      showToast('添加失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  // 添加菜谱到购物清单（通过选中菜谱）
  async function handleAddRecipeToShoppingList(recipeId: number) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) {
      showToast('菜谱不存在', 'error');
      return;
    }

    try {
      // 调用后端 /api/recipes/{id} 接口获取菜谱详情（包含 ingredientIds）
      const recipeDetail = await getRecipeDetail(recipeId);
      
      if (recipeDetail.ingredientIds && recipeDetail.ingredientIds.length > 0) {
        await addToCart(recipeDetail.ingredientIds);
      }

      // 将菜谱添加到选中列表
      setSelectedRecipes(prev => {
        const newSet = new Set(prev);
        newSet.add(recipeId);
        return newSet;
      });

      showToast(`已添加到购物清单（${recipeDetail.ingredientIds?.length || 0} 项食材）`, 'success');
      
      // 刷新购物清单
      await refreshShoppingList();
    } catch (err) {
      console.error('添加菜谱失败:', err);
      showToast('添加失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  async function handleAddIngredient(data: {
    name: string;
    category: IngredientCategory;
    shelfLifeDays: number;
    storageType: StorageType;
    imageFile?: File;
  }) {
    try {
      let imageUrl = '';
      
      // 如果有图片，先上传
      if (data.imageFile) {
        try {
          imageUrl = await uploadImage(data.imageFile, 'ingredients');
        } catch (err) {
          console.error('图片上传失败:', err);
          // 图片上传失败不影响食材添加，继续执行
        }
      }
      
      // 调用后端API
      await addIngredient({
        name: data.name,
        category: data.category,
        shelfLifeDays: data.shelfLifeDays,
        storageType: data.storageType,
        imageUrl: imageUrl
      });
      
      // 重新加载数据
      await loadData();
      showToast('添加成功！', 'success');
    } catch (err) {
      console.error(err);
      showToast('添加失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  async function handleFetchIngredient(id: number): Promise<Ingredient> {
    return await getIngredientById(id);
  }

  async function handleUpdateIngredient(data: {
    id: number;
    name: string;
    category: IngredientCategory;
    shelfLifeDays: number;
    storageType: StorageType;
    imageFile?: File;
  }) {
    try {
      let imageUrl = '';
      
      // 如果有新图片，先上传
      if (data.imageFile) {
        try {
          imageUrl = await uploadImage(data.imageFile, 'ingredients');
        } catch (err) {
          console.error('图片上传失败:', err);
        }
      }
      
      // 调用后端API
      const oldIngredient = ingredients.find(i => i.id === data.id);
      await updateIngredient(data.id, {
        name: data.name,
        category: data.category,
        shelfLifeDays: data.shelfLifeDays,
        storageType: data.storageType,
        imageUrl: imageUrl || oldIngredient?.imageUrl || ''
      });
      
      // 重新加载数据
      await loadData();
      showToast('修改成功！', 'success');
    } catch (err) {
      console.error(err);
      showToast('修改失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  async function handleDeleteIngredient(id: number) {
    try {
      await deleteIngredient(id);
      await loadData();
      showToast('删除成功！', 'success');
    } catch (err) {
      console.error(err);
      showToast('删除失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  async function handleBatchDeleteIngredients(ids: number[]) {
    try {
      await batchDeleteIngredients(ids);
      await loadData();
      showToast(`成功删除 ${ids.length} 个食材！`, 'success');
    } catch (err) {
      console.error(err);
      showToast('批量删除失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  async function handleAddRecipe(data: {
    name: string;
    type: RecipeType;
    description: string;
    imageFile?: File;
    ingredientIds: number[];
  }) {
    try {
      let coverUrl = '';
      
      // 如果有图片，先上传
      if (data.imageFile) {
        try {
          coverUrl = await uploadImage(data.imageFile, 'recipes');
        } catch (err) {
          console.error('图片上传失败:', err);
          // 图片上传失败不影响菜谱添加，继续执行
        }
      }
      
      // 调用后端API
      await addRecipe({
        name: data.name,
        type: data.type,
        description: data.description,
        coverUrl: coverUrl,
        ingredientIds: data.ingredientIds
      });
      
      // 重新加载数据
      await loadData();
      showToast('添加成功！', 'success');
    } catch (err) {
      console.error(err);
      showToast('添加失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  async function handleFetchRecipe(id: number): Promise<Recipe> {
    return await getRecipeDetail(id);
  }

  async function handleUpdateRecipe(data: {
    id: number;
    name: string;
    type: RecipeType;
    description: string;
    imageFile?: File;
    ingredientIds: number[];
  }) {
    try {
      let coverUrl = '';
      
      // 如果有新图片，先上传
      if (data.imageFile) {
        try {
          coverUrl = await uploadImage(data.imageFile, 'recipes');
        } catch (err) {
          console.error('图片上传失败:', err);
        }
      }
      
      // 调用后端API
      const oldRecipe = recipes.find(r => r.id === data.id);
      await updateRecipe(data.id, {
        name: data.name,
        type: data.type,
        description: data.description,
        coverUrl: coverUrl || oldRecipe?.coverUrl || '',
        ingredientIds: data.ingredientIds
      });
      
      // 重新加载数据
      await loadData();
      showToast('修改成功！', 'success');
    } catch (err) {
      console.error(err);
      showToast('修改失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  async function handleDeleteRecipe(id: number) {
    try {
      await deleteRecipe(id);
      await loadData();
      showToast('删除成功！', 'success');
    } catch (err) {
      console.error(err);
      showToast('删除失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  async function handleBatchDeleteRecipes(ids: number[]) {
    try {
      // 批量调用删除接口
      await Promise.all(ids.map(id => deleteRecipe(id)));
      await loadData();
      showToast(`成功删除 ${ids.length} 个菜谱！`, 'success');
    } catch (err) {
      console.error(err);
      showToast('批量删除失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  async function handleAddInventory(data: {
    ingredientId: number;
    productionDate: string;
    storageType: StorageType;
  }) {
    try {
      // 调用后端API
      await addInventoryItem({
        ingredientId: data.ingredientId,
        productionDate: data.productionDate,
        storageType: data.storageType
      });
      
      // 重新加载数据
      await loadData();
      showToast('添加成功！', 'success');
    } catch (err) {
      console.error(err);
      showToast('添加失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  async function handleUpdateInventory(inventory: any) {
    try {
      // 调用后端API
      const { updateInventory } = await import('./api');
      await updateInventory(inventory);
      await loadData();
      showToast('修改成功！', 'success');
    } catch (err) {
      console.error(err);
      showToast('修改失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  async function handleDeleteInventory(id: number) {
    try {
      const { removeInventoryItem } = await import('./api');
      await removeInventoryItem(id);
      await loadData();
      showToast('删除成功！', 'success');
    } catch (err) {
      console.error(err);
      showToast('删除失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  async function handleBatchDeleteInventory(ids: number[]) {
    try {
      // 批量调用删除接口
      const { removeInventoryItem } = await import('./api');
      await Promise.all(ids.map(id => removeInventoryItem(id)));
      await loadData();
      showToast(`成功删除 ${ids.length} 个库存项！`, 'success');
    } catch (err) {
      console.error(err);
      showToast('批量删除失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [loadingShoppingList, setLoadingShoppingList] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const expiringItems = getExpiringItems();

  // 当选中的菜谱变化时，重新计算购物清单
  useEffect(() => {
    refreshShoppingList();
  }, [selectedRecipes, ingredients]);

  // 加载历史购买记录
  async function loadPurchaseHistory() {
    setLoadingHistory(true);
    try {
      const orders = await getPurchaseOrders(1); // status=1 表示已完成的订单
      
      // 为每个订单加载详细信息
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          try {
            const detail = await getPurchaseOrderDetail(order.id);
            return { ...order, items: detail.items };
          } catch (err) {
            console.error(`加载订单 ${order.id} 详情失败:`, err);
            return { ...order, items: [] };
          }
        })
      );
      
      setPurchaseHistory(ordersWithDetails);
    } catch (err) {
      console.error('加载历史记录失败:', err);
      setPurchaseHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  // 从历史订单快速加入购物车
  async function handleAddHistoryToCart(orderId: number) {
    try {
      const orderDetail = await getPurchaseOrderDetail(orderId);
      const ingredientIds = orderDetail.items.map(item => item.ingredientId);
      
      if (ingredientIds.length > 0) {
        await addToCart(ingredientIds);
        showToast(`已添加 ${ingredientIds.length} 项食材到购物车`, 'success');
        await refreshShoppingList();
      }
    } catch (err) {
      console.error('添加失败:', err);
      showToast('添加失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  // 删除历史订单
  async function handleDeletePurchaseOrder(orderId: number) {
    try {
      await deletePurchaseOrder(orderId);
      showToast('删除成功！', 'success');
      // 重新加载历史记录
      await loadPurchaseHistory();
    } catch (err) {
      console.error('删除失败:', err);
      showToast('删除失败：' + (err instanceof Error ? err.message : '请重试'), 'error');
    }
  }

  // 当切换到历史记录标签时加载数据
  useEffect(() => {
    if (activeTab === 'history') {
      loadPurchaseHistory();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'ingredients' as TabType, label: '食材区', icon: Apple },
    { id: 'storage' as TabType, label: '储物区', icon: Package },
    { id: 'recipes' as TabType, label: '菜谱区', icon: ChefHat },
    { id: 'shopping' as TabType, label: '购物清单', icon: ShoppingCart, badge: shoppingList.length },
    { id: 'history' as TabType, label: '历史记录', icon: History },
  ];

  if (loading) {
    return (
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <Loader size={48} style={{ color: '#52c41a', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <p class="text-slate-600 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* 头部 - 清爽布局 */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div class="header-container" style={{
          maxWidth: '2100px',
          margin: '0 auto',
          padding: '24px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo 区域 - 增加间距 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '18px' }}>
            <div class="header-logo" style={{
              width: '100px',
              height: '100px',
              background: '#fff',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(82,196,26,0.2)',
              overflow: 'hidden'
            }}>
              <img 
                src="/favicon.jpg" 
                alt="购菜管理" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }} 
              />
            </div>
            <div>
              <h1 class="header-title" style={{
                fontSize: isMobile ? '1.65rem' : '1.875rem',
                fontWeight: '700',
                color: '#262626',
                margin: 0,
                lineHeight: 1.2
              }}>购菜管理</h1>
              {!isMobile && (
                <p class="header-subtitle" style={{
                  fontSize: '18px',
                  color: '#8c8c8c',
                  margin: 0
                }}>智能食材管理系统</p>
              )}
            </div>
          </div>
          
          {/* 右侧控制 - 图片网站链接 */}
          <div class="header-controls" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <a
              href="https://zh.freepik.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '9px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                border: 'none',
                color: '#fff',
                fontSize: '20px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(24,144,255,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(24,144,255,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(24,144,255,0.3)';
              }}
            >
              <ExternalLink size={18} strokeWidth={2.5} />
              <span>{isMobile ? '图片' : '菜谱图片素材'}</span>
            </a>
          </div>
        </div>

        {error && (
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto 12px',
            padding: '8px 24px'
          }}>
            <div style={{
              padding: '8px 12px',
              background: '#fff2e8',
              border: '1px solid #ffbb96',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#d4380d'
            }}>
              {error}
            </div>
          </div>
        )}
      </header>

      {/* 标签页导航 - 简洁风格 */}
      <div style={{
        background: '#fff',
        borderBottom: '1.5px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        marginTop: '-1px'
      }}>
        <div class="tabs-container" style={{
          maxWidth: '2100px',
          margin: '0 auto',
          padding: isMobile ? '0 15px' : '0 36px',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                class="tab-button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  padding: isMobile ? '15px 24px' : '18px 30px',
                  fontSize: '21px',
                  fontWeight: '600',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#52c41a' : '#8c8c8c',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
                  minHeight: '66px'
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isMobile) e.currentTarget.style.color = '#262626';
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !isMobile) e.currentTarget.style.color = '#8c8c8c';
                }}
              >
                <Icon size={27} strokeWidth={2.5} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span style={{
                    background: '#ff4d4f',
                    color: '#fff',
                    fontSize: '16.5px',
                    padding: '3px 9px',
                    borderRadius: '15px',
                    fontWeight: '700',
                    minWidth: '27px',
                    textAlign: 'center'
                  }}>
                    {tab.badge}
                  </span>
                )}
                {/* 底部激活条 */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: '#52c41a'
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 内容区域 */}
      <main class="main-content" style={{
        maxWidth: '2100px',
        margin: '0 auto',
        padding: isMobile ? '18px 0' : '24px 0'
      }}>
        {activeTab === 'ingredients' && (
          <IngredientArea 
            ingredients={ingredients}
            onAddIngredient={handleAddIngredient}
            onUpdateIngredient={handleUpdateIngredient}
            onDeleteIngredient={handleDeleteIngredient}
            onBatchDeleteIngredients={handleBatchDeleteIngredients}
            onFetchIngredient={handleFetchIngredient}
            onAddToShoppingList={handleAddToShoppingList}
            isMobile={isMobile} 
          />
        )}
        {activeTab === 'storage' && (
          <StorageArea 
            items={inventory}
            ingredients={ingredients}
            onAddInventory={handleAddInventory}
            onUpdateInventory={handleUpdateInventory}
            onDeleteInventory={handleDeleteInventory}
            onBatchDeleteInventory={handleBatchDeleteInventory}
            onAddToShoppingList={handleAddToShoppingList}
            isMobile={isMobile} 
          />
        )}
        {activeTab === 'recipes' && (
          <RecipeArea
            recipes={recipes}
            selectedRecipes={selectedRecipes}
            onToggleRecipe={toggleRecipe}
            onAddRecipe={handleAddRecipe}
            onUpdateRecipe={handleUpdateRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onBatchDeleteRecipes={handleBatchDeleteRecipes}
            onFetchRecipe={handleFetchRecipe}
            onAddToShoppingList={handleAddRecipeToShoppingList}
            isMobile={isMobile}
          />
        )}
        {activeTab === 'shopping' && (
          <ShoppingList
            shoppingItems={shoppingList}
            expiringItems={expiringItems}
            onConfirmPurchase={handleConfirmPurchase}
            onRemoveFromCart={handleRemoveFromCart}
            onBatchRemoveFromCart={handleBatchRemoveFromCart}
            loading={loadingShoppingList}
            isMobile={isMobile}
          />
        )}
        {activeTab === 'history' && (
          <div style={{ 
            maxWidth: '1400px', 
            margin: '0 auto'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #f0f0f0',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              {/* 标题栏 */}
              <div style={{
                padding: isMobile ? '16px' : '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #eb2f96 0%, #f759ab 100%)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(235,47,150,0.25)'
                  }}>
                    <History size={26} style={{ color: 'white' }} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '700', color: '#262626', margin: 0 }}>
                      历史购买记录
                    </h3>
                    <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#8c8c8c', margin: 0, fontWeight: '500' }}>
                      {purchaseHistory.length} 条记录
                    </p>
                  </div>
                </div>
              </div>

              {/* 内容区域 */}
              <div style={{ padding: isMobile ? '16px' : '20px' }}>
                {loadingHistory ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    padding: '60px 20px',
                    color: '#eb2f96'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        border: '4px solid #f0f0f0',
                        borderTop: '4px solid #eb2f96',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                      }} />
                      <p style={{ fontSize: '15px', fontWeight: '600', color: '#595959' }}>加载中...</p>
                    </div>
                  </div>
                ) : purchaseHistory.length === 0 ? (
                  <div class="empty-state">
                    <div class="empty-icon-container">
                      <History size={96} style={{ color: '#d9d9d9' }} />
                    </div>
                    <p class="empty-title">暂无购买记录</p>
                    <p class="empty-subtitle">
                      完成首次购买后，记录将显示在这里
                    </p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gap: isMobile ? '12px' : '16px'
                  }}>
                    {purchaseHistory.map((order) => (
                      <div 
                        key={order.id}
                        style={{
                          background: '#fafafa',
                          borderRadius: '12px',
                          padding: isMobile ? '16px' : '20px',
                          border: '1px solid #f0f0f0',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#eb2f96';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(235,47,150,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#f0f0f0';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px'
                        }}>
                          <div>
                            <div style={{
                              fontSize: isMobile ? '18px' : '20px',
                              fontWeight: '700',
                              color: '#262626',
                              marginBottom: '6px'
                            }}>
                              订单 #{order.id}
                            </div>
                            <div style={{
                              fontSize: isMobile ? '14px' : '15px',
                              color: '#8c8c8c'
                            }}>
                              {order.createTime ? new Date(order.createTime).toLocaleString('zh-CN') : '未知时间'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleAddHistoryToCart(order.id)}
                              style={{
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #eb2f96 0%, #f759ab 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 8px rgba(235,47,150,0.3)',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(235,47,150,0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(235,47,150,0.3)';
                              }}
                            >
                              <ShoppingCart size={16} strokeWidth={2.5} />
                              再次购买
                            </button>
                            <button
                              onClick={() => handleDeletePurchaseOrder(order.id)}
                              style={{
                                padding: '8px 12px',
                                background: '#fff',
                                color: '#ff4d4f',
                                border: '1px solid #ffccc7',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ff4d4f';
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.color = '#ff4d4f';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <Trash2 size={16} strokeWidth={2.5} />
                              {!isMobile && '删除'}
                            </button>
                          </div>
                        </div>
                        
                        {/* 显示购买的食材列表 */}
                        {order.items && order.items.length > 0 && (
                          <div style={{
                            marginTop: '12px',
                            marginBottom: '12px'
                          }}>
                            <div style={{
                              fontSize: isMobile ? '14px' : '15px',
                              color: '#8c8c8c',
                              fontWeight: '600',
                              marginBottom: '8px'
                            }}>
                              购买食材：
                            </div>
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px'
                            }}>
                              {order.items.map((item: any, idx: number) => (
                                <span
                                  key={idx}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#fff0f6',
                                    color: '#eb2f96',
                                    borderRadius: '8px',
                                    fontSize: isMobile ? '14px' : '15px',
                                    border: '1px solid #ffadd2',
                                    fontWeight: '600'
                                  }}
                                >
                                  {item.ingredientName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {order.remark && (
                          <div style={{
                            fontSize: isMobile ? '13px' : '14px',
                            color: '#595959',
                            marginBottom: '8px',
                            padding: '8px 12px',
                            background: '#fff',
                            borderRadius: '8px',
                            border: '1px solid #f0f0f0'
                          }}>
                            💬 {order.remark}
                          </div>
                        )}
                        {order.totalCost > 0 && (
                          <div style={{
                            fontSize: isMobile ? '16px' : '18px',
                            fontWeight: '700',
                            color: '#ff4d4f',
                            marginTop: '8px'
                          }}>
                            ¥ {order.totalCost.toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

