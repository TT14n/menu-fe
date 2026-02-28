import { useState, useEffect } from 'preact/hooks';
import type { InventoryWithIngredient, StorageType, IngredientCategory, Inventory, Ingredient } from '../types';
import { calculateFreshness, isExpiringSoon, isExpired, calculateRemainingDays } from '../utils/dateUtils';
import { AddInventoryModal } from './AddInventoryModal';
import { Popconfirm } from './Popconfirm';
import { Plus, Edit2, Trash2, CheckCircle2, X, ShoppingCart } from 'lucide-preact';
import { getExpiringInventory } from '../api';
import '../styles/common.css';

interface StorageAreaProps {
  items: InventoryWithIngredient[];
  ingredients: Ingredient[];
  onAddInventory: (data: {
    ingredientId: number;
    productionDate: string;
    storageType: StorageType;
  }) => void;
  onUpdateInventory: (inventory: Inventory) => void;
  onDeleteInventory: (id: number) => void;
  onBatchDeleteInventory?: (ids: number[]) => void;
  onAddToShoppingList?: (ingredientId: number) => void;
  isMobile?: boolean;
}

const storageLabels: Record<StorageType, string> = {
  '常温': '常温',
  '冷藏': '冷藏',
  '冷冻': '冷冻'
};

const categoryLabels: Record<IngredientCategory, string> = {
  '水果': '水果',
  '蔬菜': '蔬菜',
  '肉类': '肉类',
  '碳水': '碳水',
  '调料': '调料'
};

const categoryColors: Record<IngredientCategory, string> = {
  '水果': 'bg-orange-50 text-orange-600',
  '蔬菜': 'bg-green-50 text-green-600',
  '肉类': 'bg-red-50 text-red-600',
  '碳水': 'bg-yellow-50 text-yellow-600',
  '调料': 'bg-purple-50 text-purple-600'
};

// 占位符背景色（极淡的分类色）
const placeholderBgColors: Record<IngredientCategory, string> = {
  '水果': 'rgba(255, 140, 0, 0.04)',
  '蔬菜': 'rgba(82, 196, 26, 0.04)',
  '肉类': 'rgba(245, 34, 45, 0.04)',
  '碳水': 'rgba(250, 173, 20, 0.04)',
  '调料': 'rgba(114, 46, 209, 0.04)'
};

// 占位符文字色（稍深的分类色）
const placeholderTextColors: Record<IngredientCategory, string> = {
  '水果': 'rgba(255, 140, 0, 0.25)',
  '蔬菜': 'rgba(82, 196, 26, 0.25)',
  '肉类': 'rgba(245, 34, 45, 0.25)',
  '碳水': 'rgba(250, 173, 20, 0.25)',
  '调料': 'rgba(114, 46, 209, 0.25)'
};

// 食材图片映射
function getItemImage(itemName: string, imageUrl?: string): string {
  if (imageUrl) return imageUrl;
  return '';
}

type FilterType = 'all' | '蔬菜' | '水果' | '肉类' | '碳水' | '调料' | 'expiring';

export function StorageArea({ items, ingredients, onAddInventory, onUpdateInventory, onDeleteInventory, onBatchDeleteInventory, onAddToShoppingList, isMobile = false }: StorageAreaProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryWithIngredient | null>(null);
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expiringItems, setExpiringItems] = useState<Inventory[]>([]);
  const [loadingExpiring, setLoadingExpiring] = useState(false);

  // 组件加载时就获取临期数据，以便显示正确的数量
  useEffect(() => {
    loadExpiringItems();
  }, []);

  async function loadExpiringItems() {
    setLoadingExpiring(true);
    try {
      const data = await getExpiringInventory(3); // 获取3天内过期的食材
      setExpiringItems(data);
    } catch (err) {
      console.error('获取临期食材失败:', err);
      setExpiringItems([]);
    } finally {
      setLoadingExpiring(false);
    }
  }

  // 筛选逻辑 - 根据食材类别筛选
  const filteredItems = items.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'expiring') {
      // 使用从后端获取的临期数据
      return expiringItems.some(expiring => expiring.id === item.id);
    }
    // 根据食材的类别进行筛选
    return item.ingredient?.category === activeFilter;
  });

  // 计算每个筛选器的数量
  const getFilterCount = (filterId: FilterType) => {
    if (filterId === 'all') return items.length;
    if (filterId === 'expiring') return expiringItems.length;
    // 根据食材类别统计数量
    return items.filter(item => item.ingredient?.category === filterId).length;
  };

  const filters = [
    { id: 'all' as FilterType, label: '全部', emoji: '📦' },
    { id: '蔬菜' as FilterType, label: '蔬菜', emoji: '🥬' },
    { id: '水果' as FilterType, label: '水果', emoji: '🍎' },
    { id: '肉类' as FilterType, label: '肉类', emoji: '🥩' },
    { id: '碳水' as FilterType, label: '碳水', emoji: '🍚' },
    { id: '调料' as FilterType, label: '调料', emoji: '🧂' },
    { id: 'expiring' as FilterType, label: '快过期', emoji: '⚠️' },
  ];

  const handleAddInventory = (data: {
    ingredientId: number;
    productionDate: string;
    storageType: StorageType;
  }) => {
    onAddInventory(data);
    setIsModalOpen(false);
  };

  const handleOpenEdit = (item: InventoryWithIngredient) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleUpdateInventory = (productionDate: string, storageType: StorageType) => {
    if (!editingItem) return;
    
    // 计算新的过期日期
    const shelfLifeDays = editingItem.ingredient?.shelfLifeDays || 7;
    const prodDate = new Date(productionDate);
    const expiryDate = new Date(prodDate);
    expiryDate.setDate(expiryDate.getDate() + shelfLifeDays);
    
    const updatedInventory: Inventory = {
      id: editingItem.id,
      ingredientId: editingItem.ingredientId,
      productionDate: productionDate,
      expiryDate: expiryDate.toISOString().split('T')[0],
      storageType: storageType,
      updateTime: new Date().toISOString()
    };
    
    onUpdateInventory(updatedInventory);
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (id: number) => {
    onDeleteInventory(id);
  };

  const toggleManageMode = () => {
    setIsManageMode(!isManageMode);
    setSelectedIds(new Set());
  };

  const toggleSelectItem = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmBatchDelete = () => {
    if (onBatchDeleteInventory) {
      onBatchDeleteInventory(Array.from(selectedIds));
    }
    setShowDeleteConfirm(false);
    setSelectedIds(new Set());
    setIsManageMode(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* 新增食材按钮 - 固定在右下角，统一 64px */}
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          position: 'fixed',
          bottom: isMobile ? '24px' : '40px',
          right: isMobile ? '24px' : '40px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
          border: 'none',
          boxShadow: '0 4px 16px rgba(250,173,20,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(250,173,20,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(250,173,20,0.4)';
        }}
      >
        <Plus size={isMobile ? 32 : 40} style={{ color: '#fff' }} strokeWidth={3} />
      </button>

      {/* 添加库存弹窗 */}
      <AddInventoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddInventory}
        ingredients={ingredients}
        isMobile={isMobile}
      />

      {/* 修改库存弹窗 */}
      {isEditModalOpen && editingItem && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease',
            padding: isMobile ? '20px' : '40px'
          }}
          onClick={() => {
            setIsEditModalOpen(false);
            setEditingItem(null);
          }}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '420px',
              maxHeight: '90vh',
              overflow: 'auto',
              animation: 'slideUp 0.3s ease',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div style={{
              padding: isMobile ? '14px 16px' : '16px 18px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: 'linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%)',
              zIndex: 1,
              borderRadius: '16px 16px 0 0'
            }}>
              <h3 style={{
                fontSize: isMobile ? '18px' : '20px',
                fontWeight: '700',
                color: '#262626',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>✏️</span>
                修改库存
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'}
              >
                <X size={18} style={{ color: '#595959' }} />
              </button>
            </div>
            
            <EditInventoryForm
              item={editingItem}
              onSubmit={handleUpdateInventory}
              onCancel={() => {
                setIsEditModalOpen(false);
                setEditingItem(null);
              }}
              isMobile={isMobile}
            />
          </div>
        </div>
      )}

      {/* 分类筛选器 - 统一样式 */}
      <div class="filter-container">
        {filters.map(filter => {
          const isActive = activeFilter === filter.id;
          const count = getFilterCount(filter.id);
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              class={`filter-button theme-yellow ${isActive ? 'active' : 'inactive'}`}
            >
              <span class="filter-emoji">{filter.emoji}</span>
              <span>{filter.label}</span>
              <span class={`filter-badge ${isActive ? 'active' : 'inactive'}`}>
                {count}
              </span>
            </button>
          );
        })}
        
        {/* 管理按钮 */}
        <button
          onClick={toggleManageMode}
          style={{
            marginLeft: 'auto',
            padding: '12px 24px',
            borderRadius: '10px',
            fontSize: '20px',
            fontWeight: '600',
            border: isManageMode ? 'none' : '1.5px dashed #ffd591',
            background: isManageMode ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)' : '#fffbe6',
            color: isManageMode ? '#fff' : '#faad14',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minHeight: '52px',
            minWidth: '120px',
            justifyContent: 'center',
            boxShadow: isManageMode ? '0 2px 8px rgba(255,77,79,0.3)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (isManageMode) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ff7875 0%, #ffa39e 100%)';
            } else {
              e.currentTarget.style.background = '#faad14';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderStyle = 'solid';
            }
          }}
          onMouseLeave={(e) => {
            if (isManageMode) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)';
            } else {
              e.currentTarget.style.background = '#fffbe6';
              e.currentTarget.style.color = '#faad14';
              e.currentTarget.style.borderStyle = 'dashed';
            }
          }}
        >
          {isManageMode ? (
            <>
              <X size={20} strokeWidth={2.5} />
              <span>取消</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={20} strokeWidth={2.5} />
              <span>管理</span>
            </>
          )}
        </button>
      </div>

      {/* 网格布局 - 统一样式 */}
      {filteredItems.length === 0 ? (
        <div class="empty-state">
          <div class="empty-icon-container">
            <span class="empty-icon">📦</span>
          </div>
          <p class="empty-title">暂无食材</p>
          <p class="empty-subtitle">点击右下角按钮添加食材</p>
        </div>
      ) : (
        <div class="card-grid">
          {filteredItems.map(item => {
            const remainingDays = calculateRemainingDays(item.expiryDate);
            const freshness = calculateFreshness(item.productionDate, item.expiryDate);
            const expiringSoon = isExpiringSoon(item.expiryDate);
            const expired = isExpired(item.expiryDate);
            
            // 智能色彩状态
            const getDeadlineColor = (days: number) => {
              if (days <= 3) return '#ff4d4f';
              if (days <= 7) return '#faad14';
              return '#52c41a';
            };

            const ingredient = item.ingredient;
            const itemName = ingredient?.name || '未知食材';
            const itemCategory = ingredient?.category || '蔬菜';

            return (
              <div 
                key={item.id} 
                class="item-card"
                style={{ 
                  opacity: expired ? 0.7 : 1,
                  position: 'relative',
                  cursor: isManageMode ? 'pointer' : 'default'
                }}
                onClick={() => isManageMode && toggleSelectItem(item.id)}
              >
                {/* 管理模式：右上角勾选框 */}
                {isManageMode && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: selectedIds.has(item.id) ? '#faad14' : '#fff',
                    border: selectedIds.has(item.id) ? 'none' : '2px solid #d9d9d9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s'
                  }}>
                    {selectedIds.has(item.id) && (
                      <CheckCircle2 size={20} style={{ color: '#fff' }} strokeWidth={3} />
                    )}
                  </div>
                )}
                
                {/* 非管理模式：右上角添加到购物清单按钮 */}
                {!isManageMode && onAddToShoppingList && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToShoppingList(item.ingredientId);
                    }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      boxShadow: '0 2px 8px rgba(82,196,26,0.3)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(82,196,26,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(82,196,26,0.3)';
                    }}
                  >
                    <ShoppingCart size={18} style={{ color: '#fff' }} strokeWidth={2.5} />
                  </button>
                )}
                
                {/* 图片容器 */}
                <div 
                  class="card-image-container"
                  style={{
                    background: ingredient?.imageUrl ? '#fafafa' : placeholderBgColors[itemCategory],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    opacity: isManageMode && !selectedIds.has(item.id) ? 0.6 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {ingredient?.imageUrl ? (
                    <img 
                      src={getItemImage(itemName, ingredient?.imageUrl)} 
                      alt={itemName}
                      class="card-image"
                      loading="lazy"
                    />
                  ) : (
                    <div style={{
                      fontSize: isMobile ? '72px' : '96px',
                      color: placeholderTextColors[itemCategory],
                      fontWeight: '500',
                      letterSpacing: '0.02em'
                    }}>
                      {itemName.charAt(0)}
                    </div>
                  )}
                  
                  {/* 左上角存储类型标签 - 显示食材的默认存储方式 */}
                  {!isManageMode && ingredient && (
                    <span 
                      class="card-tag top-left"
                      style={{
                        zIndex: 10,
                        background: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(4px)',
                        color: 'white'
                      }}
                    >
                      {storageLabels[ingredient.storageType]}
                    </span>
                  )}

                  {/* 左下角类型标签 - 无论有无图片都显示 */}
                  {!isManageMode && (
                    <span 
                      class="card-tag bottom-left"
                      style={{
                        zIndex: 10,
                        background: itemCategory === '水果' ? '#fff7e6' :
                                   itemCategory === '蔬菜' ? '#f6ffed' :
                                   itemCategory === '肉类' ? '#fff1f0' : 
                                   itemCategory === '碳水' ? '#fffbe6' : '#f9f0ff',
                        color: itemCategory === '水果' ? '#fa8c16' :
                               itemCategory === '蔬菜' ? '#52c41a' :
                               itemCategory === '肉类' ? '#f5222d' : 
                               itemCategory === '碳水' ? '#faad14' : '#722ed1'
                      }}
                    >
                      {categoryLabels[itemCategory]}
                    </span>
                  )}
                </div>

                {/* 内容区域 */}
                <div class="card-content">
                  <h4 class="card-title">{itemName}</h4>
                  
                  <div 
                    class="card-subtitle" 
                    style={{ color: getDeadlineColor(remainingDays), marginBottom: '12px' }}
                  >
                    剩 {remainingDays} 天
                  </div>

                  {/* 新鲜度进度条 */}
                  <div class="progress-bar-container" style={{ marginBottom: '16px' }}>
                    <div 
                      class="progress-bar-fill"
                      style={{
                        width: `${freshness}%`,
                        background: getDeadlineColor(remainingDays)
                      }}
                    />
                  </div>

                  {/* 操作按钮 - 非管理模式显示 */}
                  {!isManageMode && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: '#e6f7ff',
                          border: '1px solid #91d5ff',
                          borderRadius: '8px',
                          color: '#1890ff',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#1890ff';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#e6f7ff';
                          e.currentTarget.style.color = '#1890ff';
                        }}
                      >
                        <Edit2 size={14} />
                        修改
                      </button>
                      
                      <Popconfirm
                        title="确定要从储物区移除吗？"
                        description="此操作不可撤销"
                        onConfirm={() => handleDelete(item.id)}
                        placement="top"
                      >
                        <button
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: '#fff1f0',
                            border: '1px solid #ffccc7',
                            borderRadius: '8px',
                            color: '#f5222d',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f5222d';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff1f0';
                            e.currentTarget.style.color = '#f5222d';
                          }}
                        >
                          <Trash2 size={14} />
                          删除
                        </button>
                      </Popconfirm>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 底部浮动操作条 - 管理模式显示 */}
      {isManageMode && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '2px solid #f0f0f0',
          padding: isMobile ? '16px 20px' : '20px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 100,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
          animation: 'slideUp 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <CheckCircle2 size={24} style={{ color: selectedIds.size > 0 ? '#faad14' : '#d9d9d9' }} />
            <span style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              color: '#262626'
            }}>
              已选 <span style={{ color: '#faad14', fontSize: isMobile ? '20px' : '22px' }}>{selectedIds.size}</span> 项
            </span>
          </div>
          
          <button
            onClick={handleBatchDelete}
            disabled={selectedIds.size === 0}
            style={{
              padding: isMobile ? '12px 24px' : '14px 32px',
              background: selectedIds.size > 0 ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)' : '#f5f5f5',
              color: selectedIds.size > 0 ? '#fff' : '#d9d9d9',
              border: 'none',
              borderRadius: '12px',
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: '700',
              cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: selectedIds.size > 0 ? '0 4px 12px rgba(255,77,79,0.3)' : 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (selectedIds.size > 0) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,77,79,0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedIds.size > 0) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,77,79,0.3)';
              }
            }}
          >
            <Trash2 size={20} strokeWidth={2.5} />
            批量删除
          </button>
        </div>
      )}

      {/* 删除确认抽屉 */}
      {showDeleteConfirm && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: '24px 24px 0 0',
              width: '100%',
              maxWidth: '600px',
              padding: isMobile ? '32px 24px' : '40px 32px',
              animation: 'slideUpDrawer 0.3s ease',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部指示条 */}
            <div style={{
              width: '48px',
              height: '4px',
              background: '#d9d9d9',
              borderRadius: '2px',
              margin: '0 auto 24px'
            }} />
            
            {/* 警告图标 */}
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Trash2 size={32} style={{ color: '#ff4d4f' }} strokeWidth={2} />
            </div>
            
            {/* 标题 */}
            <h3 style={{
              fontSize: isMobile ? '20px' : '22px',
              fontWeight: '700',
              color: '#262626',
              textAlign: 'center',
              margin: '0 0 12px 0'
            }}>
              确定要删除这些库存吗？
            </h3>
            
            {/* 描述 */}
            <p style={{
              fontSize: isMobile ? '15px' : '16px',
              color: '#8c8c8c',
              textAlign: 'center',
              margin: '0 0 32px 0',
              lineHeight: 1.6
            }}>
              即将删除 <span style={{ color: '#ff4d4f', fontWeight: '700', fontSize: '18px' }}>{selectedIds.size}</span> 个库存项<br />
              此操作不可撤销，请谨慎操作
            </p>
            
            {/* 按钮组 */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#595959',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e8e8e8'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f5'}
              >
                取消
              </button>
              <button
                onClick={confirmBatchDelete}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255,77,79,0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,77,79,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,77,79,0.3)';
                }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideUpDrawer {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        /* 增强日期输入框样式 */
        .date-input-enhanced::-webkit-calendar-picker-indicator {
          width: 22px;
          height: 22px;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        
        .date-input-enhanced::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
        
        /* 移动端优化 */
        @media (max-width: 768px) {
          .date-input-enhanced::-webkit-calendar-picker-indicator {
            width: 26px;
            height: 26px;
          }
        }
      `}</style>
    </div>
  );
}

// 修改库存表单组件
interface EditInventoryFormProps {
  item: InventoryWithIngredient;
  onSubmit: (productionDate: string, storageType: StorageType) => void;
  onCancel: () => void;
  isMobile?: boolean;
}

function EditInventoryForm({ item, onSubmit, onCancel, isMobile = false }: EditInventoryFormProps) {
  const [productionDate, setProductionDate] = useState(item.productionDate);
  
  const shelfLifeDays = item.ingredient?.shelfLifeDays || 7;
  const storageType = item.storageType; // 不可修改，直接使用原值
  
  // 计算过期日期
  const calculateExpiryDate = (prodDate: string) => {
    const date = new Date(prodDate);
    date.setDate(date.getDate() + shelfLifeDays);
    return date.toISOString().split('T')[0];
  };
  
  const expiryDate = calculateExpiryDate(productionDate);
  
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    onSubmit(productionDate, storageType);
  };
  
  return (
    <form onSubmit={handleSubmit} style={{ padding: isMobile ? '16px' : '18px' }}>
      {/* 食材名称 - 不可修改 */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: '#262626',
          marginBottom: '8px'
        }}>
          食材名称
        </label>
        <input
          type="text"
          value={item.ingredient?.name || '未知食材'}
          disabled
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1.5px solid #d9d9d9',
            borderRadius: '8px',
            fontSize: '15px',
            background: '#f5f5f5',
            color: '#8c8c8c',
            cursor: 'not-allowed',
            boxSizing: 'border-box'
          }}
        />
      </div>
      
      {/* 生产日期 - 可修改 */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: '#262626',
          marginBottom: '8px'
        }}>
          生产日期 <span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <input
          type="date"
          value={productionDate}
          onChange={(e) => setProductionDate((e.target as HTMLInputElement).value)}
          max={new Date().toISOString().split('T')[0]}
          required
          class="date-input-large"
          style={{
            width: '100%',
            minWidth: '320px',
            padding: '10px 42px 10px 12px',
            border: '1.5px solid #d9d9d9',
            borderRadius: '8px',
            fontSize: '17px',
            fontWeight: '500',
            transition: 'all 0.2s',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#faad14'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#d9d9d9'}
        />
      </div>
      
      {/* 过期日期预览 */}
      <div style={{
        padding: '10px 12px',
        background: '#fffbe6',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#8c8c8c',
          marginBottom: '4px'
        }}>
          保质期 {shelfLifeDays} 天 · 储存方式 {storageType}
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#faad14'
        }}>
          过期日期：{expiryDate}
        </div>
      </div>
      
      {/* 按钮组 */}
      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end'
      }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            fontSize: '15px',
            fontWeight: '600',
            border: '1.5px solid #d9d9d9',
            borderRadius: '8px',
            background: '#fff',
            color: '#595959',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#faad14';
            e.currentTarget.style.color = '#faad14';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d9d9d9';
            e.currentTarget.style.color = '#595959';
          }}
        >
          取消
        </button>
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            fontSize: '15px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(250,173,20,0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          确认修改
        </button>
      </div>
    </form>
  );
}
