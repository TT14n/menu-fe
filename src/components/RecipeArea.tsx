import { useState } from 'preact/hooks';
import type { RecipeWithIngredients, RecipeType, Recipe } from '../types';
import { Clock, Zap, Plus, Trash2, Edit2, CheckCircle2, X, ShoppingCart } from 'lucide-preact';
import { AddRecipeModal } from './AddRecipeModal';
import { EditRecipeModal } from './EditRecipeModal';
import { Popconfirm } from './Popconfirm';
import '../styles/common.css';

interface RecipeAreaProps {
  recipes: RecipeWithIngredients[];
  selectedRecipes: Set<number>;
  onToggleRecipe: (recipeId: number) => void;
  onAddRecipe: (data: {
    name: string;
    type: RecipeType;
    description: string;
    imageFile?: File;
    ingredientIds: number[];
  }) => void;
  onUpdateRecipe: (data: {
    id: number;
    name: string;
    type: RecipeType;
    description: string;
    imageFile?: File;
    ingredientIds: number[];
  }) => void;
  onDeleteRecipe: (id: number) => void;
  onBatchDeleteRecipes?: (ids: number[]) => void;
  onFetchRecipe: (id: number) => Promise<Recipe>;
  onAddToShoppingList?: (recipeId: number) => void;
  isMobile?: boolean;
}

const recipeTypeLabels: Record<RecipeType, string> = {
  '快手菜': '快手菜',
  '功夫菜': '功夫菜'
};

// 占位符背景色（极淡的紫色）
const placeholderBgColor = 'rgba(114, 46, 209, 0.04)';

// 占位符文字色（稍深的紫色）
const placeholderTextColor = 'rgba(114, 46, 209, 0.25)';

// 获取菜谱图片URL
const getRecipeImage = (_name: string, url?: string) => {
  if (!url) return '';
  // 如果是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // 否则拼接后端地址
  return `${import.meta.env.VITE_API_BASE_URL}${url}`;
};

type RecipeFilterType = 'all' | '快手菜' | '功夫菜';

export function RecipeArea({ recipes, onAddRecipe, onUpdateRecipe, onDeleteRecipe, onBatchDeleteRecipes, onFetchRecipe, onAddToShoppingList, isMobile = false }: RecipeAreaProps) {
  const [activeFilter, setActiveFilter] = useState<RecipeFilterType>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddRecipe = (data: {
    name: string;
    type: RecipeType;
    description: string;
    imageFile?: File;
    ingredientIds: number[];
  }) => {
    onAddRecipe(data);
    setIsAddModalOpen(false);
  };

  const handleUpdateRecipe = (data: {
    id: number;
    name: string;
    type: RecipeType;
    description: string;
    imageFile?: File;
    ingredientIds: number[];
  }) => {
    onUpdateRecipe(data);
    setIsEditModalOpen(false);
    setEditingRecipe(null);
  };

  const handleOpenEdit = async (recipe: RecipeWithIngredients) => {
    setLoading(true);
    try {
      // 从后端获取最新的菜谱信息
      const latestRecipe = await onFetchRecipe(recipe.id);
      setEditingRecipe(latestRecipe);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('获取菜谱信息失败:', err);
      alert('获取菜谱信息失败，请重试');
    } finally {
      setLoading(false);
    }
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
    if (onBatchDeleteRecipes) {
      onBatchDeleteRecipes(Array.from(selectedIds));
    }
    setShowDeleteConfirm(false);
    setSelectedIds(new Set());
    setIsManageMode(false);
  };

  const filteredRecipes = recipes.filter(recipe => {
    if (activeFilter === 'all') return true;
    return recipe.type === activeFilter;
  });

  const getFilterCount = (filterId: RecipeFilterType) => {
    if (filterId === 'all') return recipes.length;
    return recipes.filter(recipe => recipe.type === filterId).length;
  };

  const filters = [
    { id: 'all' as RecipeFilterType, label: '全部', emoji: '🍽️' },
    { id: '快手菜' as RecipeFilterType, label: '快手菜', emoji: '⚡' },
    { id: '功夫菜' as RecipeFilterType, label: '功夫菜', emoji: '🍲' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* 新增菜谱按钮 - 固定在右下角，统一 64px */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        style={{
          position: 'fixed',
          bottom: isMobile ? '24px' : '40px',
          right: isMobile ? '24px' : '40px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
          border: 'none',
          boxShadow: '0 4px 16px rgba(114,46,209,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(114,46,209,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(114,46,209,0.4)';
        }}
      >
        <Plus size={isMobile ? 32 : 40} style={{ color: '#fff' }} strokeWidth={3} />
      </button>

      {/* 添加菜谱弹窗 */}
      <AddRecipeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddRecipe}
        isMobile={isMobile}
      />

      {/* 修改菜谱弹窗 */}
      <EditRecipeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRecipe(null);
        }}
        onSubmit={handleUpdateRecipe}
        recipe={editingRecipe}
        isMobile={isMobile}
      />

      {/* 筛选器 - 统一样式 */}
      <div class="filter-container" style={{ position: 'relative' }}>
        {filters.map(filter => {
          const isActive = activeFilter === filter.id;
          const count = getFilterCount(filter.id);
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              class={`filter-button theme-purple ${isActive ? 'active' : 'inactive'}`}
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
            border: isManageMode ? 'none' : '1.5px dashed #d3adf7',
            background: isManageMode ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)' : '#f9f0ff',
            color: isManageMode ? '#fff' : '#722ed1',
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
              e.currentTarget.style.background = '#722ed1';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderStyle = 'solid';
            }
          }}
          onMouseLeave={(e) => {
            if (isManageMode) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)';
            } else {
              e.currentTarget.style.background = '#f9f0ff';
              e.currentTarget.style.color = '#722ed1';
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

      {/* 菜谱网格 - 统一样式 */}
      {filteredRecipes.length === 0 ? (
        <div class="empty-state">
          <div class="empty-icon-container">
            <span class="empty-icon">👨‍🍳</span>
          </div>
          <p class="empty-title">暂无菜谱</p>
          <p class="empty-subtitle">点击右下角按钮添加菜谱</p>
        </div>
      ) : (
        <div class="card-grid">
          {filteredRecipes.map(recipe => (
            <div 
              key={recipe.id}
              class="item-card"
              style={{
                position: 'relative',
                cursor: isManageMode ? 'pointer' : 'default'
              }}
              onClick={() => isManageMode && toggleSelectItem(recipe.id)}
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
                  background: selectedIds.has(recipe.id) ? '#722ed1' : '#fff',
                  border: selectedIds.has(recipe.id) ? 'none' : '2px solid #d9d9d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s'
                }}>
                  {selectedIds.has(recipe.id) && (
                    <CheckCircle2 size={20} style={{ color: '#fff' }} strokeWidth={3} />
                  )}
                </div>
              )}
              
              {/* 非管理模式：右上角添加到购物清单按钮 */}
              {!isManageMode && onAddToShoppingList && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToShoppingList(recipe.id);
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
                  background: recipe.coverUrl ? '#fafafa' : placeholderBgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isManageMode && !selectedIds.has(recipe.id) ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                  position: 'relative'
                }}
              >
                {recipe.coverUrl ? (
                  <img 
                    src={getRecipeImage(recipe.name, recipe.coverUrl)} 
                    alt={recipe.name}
                    class="card-image"
                    loading="lazy"
                  />
                ) : (
                  <div style={{
                    fontSize: isMobile ? '72px' : '96px',
                    color: placeholderTextColor,
                    fontWeight: '500',
                    letterSpacing: '0.02em'
                  }}>
                    {recipe.name.charAt(0)}
                  </div>
                )}
                
                {/* 左下角类型标签 - 无论有无图片都显示 */}
                {!isManageMode && (
                  <span 
                    class="card-tag bottom-left"
                    style={{
                      zIndex: 10,
                      background: recipe.type === '快手菜' ? 'rgba(250,173,20,0.9)' : 'rgba(24,144,255,0.9)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    {recipe.type === '快手菜' ? <Zap size={16.5} /> : <Clock size={16.5} />}
                    {recipeTypeLabels[recipe.type]}
                  </span>
                )}
              </div>

              {/* 内容区域 */}
              <div class="card-content">
                <h4 class="card-title">{recipe.name}</h4>

                {/* 食材预览 - 添加空值保护 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {(recipe.ingredients || []).slice(0, 2).map((ing, i) => (
                    <span key={i} style={{
                      padding: '3px 9px',
                      background: '#f9f0ff',
                      color: '#722ed1',
                      borderRadius: '6px',
                      fontSize: '16.5px',
                      fontWeight: '600',
                      border: '1.5px solid #efdbff'
                    }}>
                      {ing.name}
                    </span>
                  ))}
                  {(recipe.ingredients?.length || 0) > 2 && (
                    <span style={{
                      padding: '3px 9px',
                      background: '#f5f5f5',
                      color: '#595959',
                      borderRadius: '6px',
                      fontSize: '16.5px',
                      fontWeight: '700'
                    }}>
                      +{(recipe.ingredients?.length || 0) - 2}
                    </span>
                  )}
                </div>

                {/* 操作按钮 - 非管理模式显示 */}
                {!isManageMode && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleOpenEdit(recipe)}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: loading ? '#f5f5f5' : '#e6f7ff',
                        border: '1px solid #91d5ff',
                        borderRadius: '8px',
                        color: loading ? '#d9d9d9' : '#1890ff',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background = '#1890ff';
                          e.currentTarget.style.color = '#fff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background = '#e6f7ff';
                          e.currentTarget.style.color = '#1890ff';
                        }
                      }}
                    >
                      <Edit2 size={14} />
                      {loading ? '加载中...' : '修改'}
                    </button>
                    
                    <Popconfirm
                      title="确定要删除这个菜谱吗？"
                      description="此操作不可撤销"
                      onConfirm={() => onDeleteRecipe(recipe.id)}
                      placement="top"
                    >
                      <button
                        disabled={loading}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: loading ? '#f5f5f5' : '#fff1f0',
                          border: '1px solid #ffccc7',
                          borderRadius: '8px',
                          color: loading ? '#d9d9d9' : '#f5222d',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.background = '#f5222d';
                            e.currentTarget.style.color = '#fff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading) {
                            e.currentTarget.style.background = '#fff1f0';
                            e.currentTarget.style.color = '#f5222d';
                          }
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
          ))}
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
            <CheckCircle2 size={24} style={{ color: selectedIds.size > 0 ? '#722ed1' : '#d9d9d9' }} />
            <span style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              color: '#262626'
            }}>
              已选 <span style={{ color: '#722ed1', fontSize: isMobile ? '20px' : '22px' }}>{selectedIds.size}</span> 项
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
              确定要删除这些菜谱吗？
            </h3>
            
            {/* 描述 */}
            <p style={{
              fontSize: isMobile ? '15px' : '16px',
              color: '#8c8c8c',
              textAlign: 'center',
              margin: '0 0 32px 0',
              lineHeight: 1.6
            }}>
              即将删除 <span style={{ color: '#ff4d4f', fontWeight: '700', fontSize: '18px' }}>{selectedIds.size}</span> 个菜谱<br />
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
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
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
