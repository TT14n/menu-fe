import { useState, useEffect } from 'preact/hooks';
import type { Item, Recipe, ShoppingItem } from './types';
import { StorageArea } from './components/StorageArea';
import { RecipeArea } from './components/RecipeArea';
import { ShoppingList } from './components/ShoppingList';
import { getInventory, getRecipes, mockItems, mockRecipes, addInventoryItems } from './api';
import { isExpiringSoon } from './utils/dateUtils';
import { Package, ChefHat, ShoppingCart, Loader } from 'lucide-preact';

type TabType = 'storage' | 'recipes' | 'shopping';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('storage');
  const [items, setItems] = useState<Item[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [ignoreSeasonings, setIgnoreSeasonings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(true);

  useEffect(() => {
    loadData();
  }, [useMockData]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      if (useMockData) {
        setItems(mockItems);
        setRecipes(mockRecipes);
      } else {
        const [inventoryData, recipesData] = await Promise.all([
          getInventory(),
          getRecipes(),
        ]);
        setItems(inventoryData);
        setRecipes(recipesData);
      }
    } catch (err) {
      setError('加载数据失败，请检查后端连接');
      console.error(err);
      setItems(mockItems);
      setRecipes(mockRecipes);
    } finally {
      setLoading(false);
    }
  }

  function toggleRecipe(recipeId: string) {
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

  function calculateShoppingList(): ShoppingItem[] {
    const itemNames = new Set(items.map(item => item.name));
    const shoppingMap = new Map<string, string[]>();

    selectedRecipes.forEach(recipeId => {
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) return;

      recipe.ingredients.forEach(ingredient => {
        if (!itemNames.has(ingredient)) {
          if (!shoppingMap.has(ingredient)) {
            shoppingMap.set(ingredient, []);
          }
          shoppingMap.get(ingredient)!.push(recipe.name);
        }
      });

      if (!ignoreSeasonings) {
        recipe.seasonings.forEach(seasoning => {
          if (!itemNames.has(seasoning)) {
            if (!shoppingMap.has(seasoning)) {
              shoppingMap.set(seasoning, []);
            }
            shoppingMap.get(seasoning)!.push(recipe.name);
          }
        });
      }
    });

    return Array.from(shoppingMap.entries()).map(([name, recipeNames]) => ({
      name,
      isFromRecipe: true,
      recipeNames,
    }));
  }

  function getExpiringItems(): Item[] {
    return items.filter(item => isExpiringSoon(item.productionDate, item.shelfLife));
  }

  async function handleConfirmPurchase() {
    const shoppingList = calculateShoppingList();
    if (shoppingList.length === 0) return;

    try {
      const newItems = shoppingList.map(item => ({
        name: item.name,
        productionDate: new Date().toISOString(),
        shelfLife: 7,
        type: 'vegetable' as const,
        storageType: 'refrigerated' as const,
      }));

      if (useMockData) {
        const itemsWithIds = newItems.map((item, idx) => ({
          ...item,
          id: `${Date.now()}-${idx}`,
        }));
        setItems(prev => [...prev, ...itemsWithIds]);
      } else {
        const addedItems = await addInventoryItems(newItems);
        setItems(prev => [...prev, ...addedItems]);
      }

      setSelectedRecipes(new Set());
      alert('购买成功！食材已添加到储物区');
    } catch (err) {
      console.error(err);
      alert('购买失败，请重试');
    }
  }

  const shoppingList = calculateShoppingList();
  const expiringItems = getExpiringItems();

  const tabs = [
    { id: 'storage' as TabType, label: '储物区', icon: Package },
    { id: 'recipes' as TabType, label: '菜谱区', icon: ChefHat },
    { id: 'shopping' as TabType, label: '购物清单', icon: ShoppingCart, badge: shoppingList.length },
  ];

  if (loading) {
    return (
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <Loader size={48} class="animate-spin text-emerald-600 mx-auto mb-4" />
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
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo 区域 - 增加间距 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(82,196,26,0.2)'
            }}>
              <ChefHat size={22} class="text-white" />
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#262626',
                margin: 0,
                lineHeight: 1.2
              }}>购菜管理</h1>
              <p style={{
                fontSize: '12px',
                color: '#8c8c8c',
                margin: 0
              }}>智能食材管理系统</p>
            </div>
          </div>
          
          {/* 右侧控制 - 增加间距 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#f6ffed',
              border: '1px solid #d9f7be',
              transition: 'all 0.2s'
            }}>
              <input
                type="checkbox"
                checked={useMockData}
                onChange={(e) => setUseMockData((e.target as HTMLInputElement).checked)}
                style={{ width: '14px', height: '14px', accentColor: '#52c41a' }}
              />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#52c41a' }}>测试数据</span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              transition: 'all 0.2s'
            }}>
              <input
                type="checkbox"
                checked={ignoreSeasonings}
                onChange={(e) => setIgnoreSeasonings((e.target as HTMLInputElement).checked)}
                style={{ width: '14px', height: '14px', accentColor: '#faad14' }}
              />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#faad14' }}>忽略调料</span>
            </label>
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
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: '73px',
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          gap: '4px'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#52c41a' : '#8c8c8c',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#262626';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#8c8c8c';
                }}
              >
                <Icon size={18} strokeWidth={2.5} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span style={{
                    background: '#ff4d4f',
                    color: '#fff',
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    minWidth: '18px',
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
                    height: '2px',
                    background: '#52c41a'
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 内容区域 */}
      <main class="max-w-[1400px] mx-auto px-4 py-6">
        {activeTab === 'storage' && <StorageArea items={items} />}
        {activeTab === 'recipes' && (
          <RecipeArea
            recipes={recipes}
            selectedRecipes={selectedRecipes}
            onToggleRecipe={toggleRecipe}
          />
        )}
        {activeTab === 'shopping' && (
          <ShoppingList
            shoppingItems={shoppingList}
            expiringItems={expiringItems}
            onConfirmPurchase={handleConfirmPurchase}
          />
        )}
      </main>
    </div>
  );
}
