import { useState } from 'preact/hooks';
import type { ShoppingItem, InventoryWithIngredient, IngredientCategory } from '../types';
import { ShoppingCart, AlertTriangle, CheckCircle, Package, Trash2, X, Plus } from 'lucide-preact';
import { calculateRemainingDays } from '../utils/dateUtils';
import { Popconfirm } from './Popconfirm';
import '../styles/common.css';

interface ShoppingListProps {
  shoppingItems: ShoppingItem[];
  expiringItems: InventoryWithIngredient[];
  onConfirmPurchase: () => void;
  onRemoveFromCart?: (ingredientId: number) => void;
  onBatchRemoveFromCart?: (ingredientIds: number[]) => void;
  isMobile?: boolean;
  loading?: boolean;
}

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

// 分类标签颜色
const categoryColors: Record<IngredientCategory, string> = {
  '水果': 'bg-orange-50 text-orange-600',
  '蔬菜': 'bg-green-50 text-green-600',
  '肉类': 'bg-red-50 text-red-600',
  '碳水': 'bg-yellow-50 text-yellow-600',
  '调料': 'bg-purple-50 text-purple-600'
};

export function ShoppingList({ shoppingItems, expiringItems, onConfirmPurchase, onRemoveFromCart, onBatchRemoveFromCart, isMobile = false, loading = false }: ShoppingListProps) {
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  const toggleManageMode = () => {
    setIsManageMode(!isManageMode);
    setSelectedIds(new Set());
  };

  const toggleSelectItem = (ingredientId: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === shoppingItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(shoppingItems.map(item => item.ingredient.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmBatchDelete = () => {
    if (onBatchRemoveFromCart) {
      onBatchRemoveFromCart(Array.from(selectedIds));
    }
    setShowDeleteConfirm(false);
    setSelectedIds(new Set());
    setIsManageMode(false);
  };

  const handleRemoveItem = (ingredientId: number) => {
    if (onRemoveFromCart) {
      onRemoveFromCart(ingredientId);
    }
  };

  return (
    <div style={{ 
      padding: isMobile ? '10px' : '16px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      minHeight: '100vh',
      background: '#fafafa'
    }}>
      {/* 1. 临期提醒区 - 紧凑卡片设计 */}
      {expiringItems.length > 0 && (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid #ffe7ba',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(250,173,20,0.08)',
          marginBottom: isMobile ? '16px' : '20px'
        }}>
          <div style={{
            padding: isMobile ? '14px 16px' : '16px 20px',
            borderBottom: '1px solid #fff7e6',
            background: '#fffbf0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(250,173,20,0.2)'
              }}>
                <AlertTriangle size={22} style={{ color: 'white' }} strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: '700', color: '#262626', margin: 0 }}>
                  即将过期提醒
                </h3>
                <p style={{ fontSize: isMobile ? '12px' : '13px', color: '#8c8c8c', margin: 0, fontWeight: '500' }}>
                  {expiringItems.length} 项食材需要注意
                </p>
              </div>
            </div>
          </div>
          
          {/* 临期食材列表 - 横向紧凑卡片 */}
          <div style={{
            padding: isMobile ? '12px' : '16px',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: isMobile ? '8px' : '10px'
          }}>
            {expiringItems.map(item => {
              const daysLeft = calculateRemainingDays(item.expiryDate);
              const isUrgent = daysLeft <= 3;
              
              return (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  background: '#fff',
                  borderRadius: '12px',
                  border: `2px solid ${isUrgent ? '#ff4d4f' : '#faad14'}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: isUrgent ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)' : 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: '20px' }}>{isUrgent ? '🚨' : '⚠️'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: '700',
                      color: '#262626',
                      fontSize: isMobile ? '15px' : '16px',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.ingredient?.name || '未知食材'}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '13px' : '14px',
                      fontWeight: '700',
                      color: isUrgent ? '#ff4d4f' : '#faad14'
                    }}>
                      剩余 {daysLeft} 天
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. 待购买清单主区域 */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #f0f0f0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        {/* 标题栏 - 增加批量管理 */}
        <div style={{
          padding: isMobile ? '16px' : '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: isMobile ? '12px' : '0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(82,196,26,0.25)'
            }}>
              <ShoppingCart size={26} style={{ color: 'white' }} strokeWidth={2.5} />
            </div>
            <div>
              <h3 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '700', color: '#262626', margin: 0 }}>
                待购买清单
              </h3>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#8c8c8c', margin: 0, fontWeight: '500' }}>
                {shoppingItems.length} 项待购买
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
            {/* 批量管理按钮 */}
            {shoppingItems.length > 0 && (
              <button
                onClick={toggleManageMode}
                style={{
                  padding: isMobile ? '10px 16px' : '10px 20px',
                  borderRadius: '12px',
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: '600',
                  border: isManageMode ? 'none' : '1.5px dashed #d9d9d9',
                  background: isManageMode ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)' : '#fff',
                  color: isManageMode ? '#fff' : '#595959',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flex: isMobile ? 1 : 'none',
                  justifyContent: 'center',
                  boxShadow: isManageMode ? '0 2px 8px rgba(255,77,79,0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isManageMode) {
                    e.currentTarget.style.borderColor = '#52c41a';
                    e.currentTarget.style.color = '#52c41a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isManageMode) {
                    e.currentTarget.style.borderColor = '#d9d9d9';
                    e.currentTarget.style.color = '#595959';
                  }
                }}
              >
                {isManageMode ? (
                  <>
                    <X size={18} strokeWidth={2.5} />
                    <span>取消</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} strokeWidth={2.5} />
                    <span>批量管理</span>
                  </>
                )}
              </button>
            )}
            
            {/* 确认购买按钮 */}
            {shoppingItems.length > 0 && !isManageMode && (
              <button
                onClick={onConfirmPurchase}
                style={{
                  padding: isMobile ? '10px 20px' : '12px 24px',
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: isMobile ? '14px' : '15px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: isMobile ? 1 : 'none',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(82,196,26,0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(82,196,26,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(82,196,26,0.3)';
                }}
              >
                <CheckCircle size={20} strokeWidth={2.5} />
                确认购买并入库
              </button>
            )}
          </div>
        </div>

        {/* 批量管理模式 - 全选栏 */}
        {isManageMode && shoppingItems.length > 0 && (
          <div style={{
            padding: '12px 20px',
            background: '#fafafa',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <input
              type="checkbox"
              checked={selectedIds.size === shoppingItems.length}
              onChange={toggleSelectAll}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#52c41a'
              }}
            />
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#595959'
            }}>
              全选 ({selectedIds.size}/{shoppingItems.length})
            </span>
          </div>
        )}

        {/* 内容区域 */}
        <div style={{ padding: isMobile ? '16px' : '20px' }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '60px 20px',
              color: '#52c41a'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  border: '4px solid #f0f0f0',
                  borderTop: '4px solid #52c41a',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }} />
                <p style={{ fontSize: '15px', fontWeight: '600', color: '#595959' }}>正在计算购物清单...</p>
              </div>
            </div>
          ) : shoppingItems.length === 0 ? (
            <div class="empty-state">
              <div class="empty-icon-container">
                <ShoppingCart size={96} style={{ color: '#d9d9d9' }} />
              </div>
              <p class="empty-title">购物车空空如也</p>
              <p class="empty-subtitle">
                快去<span style={{ color: '#722ed1', fontWeight: '700' }}>「菜谱区」</span>选择菜谱一键生成<br />
                或从<span style={{ color: '#52c41a', fontWeight: '700' }}>「食材区」</span>手动添加食材吧！
              </p>
            </div>
          ) : (
            <div class="card-grid">
              {shoppingItems.map((item, idx) => {
                const ingredient = item.ingredient;
                const itemName = ingredient?.name || '未知食材';
                const itemCategory = ingredient?.category || '蔬菜';
                const isSelected = selectedIds.has(ingredient.id);
                
                return (
                  <div 
                    key={idx} 
                    class="item-card"
                    style={{
                      position: 'relative',
                      cursor: isManageMode ? 'pointer' : 'default',
                      opacity: isManageMode && !isSelected ? 0.6 : 1,
                      transition: 'opacity 0.2s'
                    }}
                    onClick={() => isManageMode && toggleSelectItem(ingredient.id)}
                  >
                    {/* 批量管理模式：左上角复选框 */}
                    {isManageMode && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isSelected ? '#52c41a' : '#fff',
                        border: isSelected ? 'none' : '2px solid #d9d9d9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s'
                      }}>
                        {isSelected && (
                          <CheckCircle size={20} style={{ color: '#fff' }} strokeWidth={3} />
                        )}
                      </div>
                    )}
                    
                    {/* 图片/占位符容器 - 与食材区完全一致 */}
                    <div 
                      class="card-image-container"
                      style={{
                        background: ingredient?.imageUrl ? '#fafafa' : placeholderBgColors[itemCategory],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      {ingredient?.imageUrl ? (
                        <img 
                          src={ingredient.imageUrl} 
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
                      
                      {/* 左下角分类标签 */}
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
                          {itemCategory}
                        </span>
                      )}
                    </div>

                    {/* 内容区域 */}
                    <div class="card-content">
                      <h4 class="card-title">{itemName}</h4>
                      
                      {/* 删除按钮 - 非管理模式显示 */}
                      {!isManageMode && onRemoveFromCart && (
                        <Popconfirm
                          title="确定要从购物车移除吗？"
                          description="此操作不可撤销"
                          onConfirm={() => handleRemoveItem(ingredient.id)}
                          placement="top"
                        >
                          <button
                            style={{
                              width: '100%',
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
                              transition: 'all 0.2s',
                              marginTop: '12px'
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
                            移除
                          </button>
                        </Popconfirm>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 底部浮动操作条 - 批量管理模式 */}
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
            <CheckCircle size={24} style={{ color: selectedIds.size > 0 ? '#52c41a' : '#d9d9d9' }} />
            <span style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              color: '#262626'
            }}>
              已选 <span style={{ color: '#52c41a', fontSize: isMobile ? '20px' : '22px' }}>{selectedIds.size}</span> 项
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
            批量移除
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
              确定要移除这些食材吗？
            </h3>
            
            {/* 描述 */}
            <p style={{
              fontSize: isMobile ? '15px' : '16px',
              color: '#8c8c8c',
              textAlign: 'center',
              margin: '0 0 32px 0',
              lineHeight: 1.6
            }}>
              即将从购物车移除 <span style={{ color: '#ff4d4f', fontWeight: '700', fontSize: '18px' }}>{selectedIds.size}</span> 项食材<br />
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
                确认移除
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
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
      `}</style>
    </div>
  );
}