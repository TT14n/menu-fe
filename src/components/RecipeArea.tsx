import { useState } from 'preact/hooks';
import type { Recipe } from '../types';
import { Clock, Zap, Check } from 'lucide-preact';

interface RecipeAreaProps {
  recipes: Recipe[];
  selectedRecipes: Set<string>;
  onToggleRecipe: (recipeId: string) => void;
}

const recipeTypeLabels: Record<string, string> = {
  'quick': '快菜',
  'slow': '慢菜'
};

// 菜谱图片映射
function getRecipeImage(recipeName: string): string {
  const searchTerm = encodeURIComponent(recipeName);
  return `https://source.unsplash.com/400x300/?${searchTerm},dish,food`;
}

type RecipeFilterType = 'all' | 'quick' | 'slow' | 'selected';

export function RecipeArea({ recipes, selectedRecipes, onToggleRecipe }: RecipeAreaProps) {
  const [activeFilter, setActiveFilter] = useState<RecipeFilterType>('all');

  // 筛选逻辑
  const filteredRecipes = recipes.filter(recipe => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'selected') return selectedRecipes.has(recipe.id);
    return recipe.type === activeFilter;
  });

  // 计算每个筛选器的数量
  const getFilterCount = (filterId: RecipeFilterType) => {
    if (filterId === 'all') return recipes.length;
    if (filterId === 'selected') return selectedRecipes.size;
    return recipes.filter(recipe => recipe.type === filterId).length;
  };

  const filters = [
    { id: 'all' as RecipeFilterType, label: '全部菜谱', emoji: '🍽️' },
    { id: 'selected' as RecipeFilterType, label: '已选择', emoji: '✅' },
    { id: 'quick' as RecipeFilterType, label: '快菜', emoji: '⚡' },
    { id: 'slow' as RecipeFilterType, label: '慢菜', emoji: '🍲' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* 分类筛选器 - 简洁现代风格 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        padding: '16px',
        marginBottom: '8px'
      }}>
        {filters.map(filter => {
          const isActive = activeFilter === filter.id;
          const count = getFilterCount(filter.id);
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              style={{
                whiteSpace: 'nowrap',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                border: isActive ? 'none' : '1px solid #e8e8e8',
                background: isActive ? '#722ed1' : '#fff',
                color: isActive ? '#fff' : '#595959',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isActive ? '0 2px 8px rgba(114,46,209,0.2)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#722ed1';
                  e.currentTarget.style.color = '#722ed1';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#e8e8e8';
                  e.currentTarget.style.color = '#595959';
                }
              }}
            >
              <span style={{ fontSize: '14px' }}>{filter.emoji}</span>
              <span>{filter.label}</span>
              <span style={{
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '700',
                background: isActive ? 'rgba(255,255,255,0.3)' : '#f5f5f5',
                color: isActive ? '#fff' : '#8c8c8c'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 网格布局 - 高密度信息展示 */}
      {filteredRecipes.length === 0 ? (
        <div class="text-center py-20">
          <div class="inline-block p-8 bg-gray-50 rounded-2xl mb-4">
            <span class="text-6xl">👨‍🍳</span>
          </div>
          <p class="text-gray-700 font-semibold text-base">暂无菜谱</p>
          <p class="text-gray-400 text-sm mt-1">选择一些菜谱来生成购物清单</p>
        </div>
      ) : (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '12px',
            padding: '0 16px 24px'
          }}
        >
          {filteredRecipes.map(recipe => {
            const isSelected = selectedRecipes.has(recipe.id);
            
            return (
              <div 
                key={recipe.id}
                onClick={() => onToggleRecipe(recipe.id)}
                style={{
                  border: isSelected ? '2px solid #722ed1' : '1px solid #f0f0f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: isSelected ? '0 4px 16px rgba(114,46,209,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                  background: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = isSelected 
                    ? '0 6px 20px rgba(114,46,209,0.25)' 
                    : '0 4px 16px rgba(0,0,0,0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = isSelected 
                    ? '0 4px 16px rgba(114,46,209,0.15)' 
                    : '0 2px 8px rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* 图片容器 - 固定 1:1 比例 */}
                <div style={{ 
                  width: '100%', 
                  aspectRatio: '1/1', 
                  background: '#fafafa', 
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={getRecipeImage(recipe.name)} 
                    alt={recipe.name}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/160?text=' + encodeURIComponent(recipe.name);
                    }}
                  />
                  
                  {/* 左上角类型标签 */}
                  <span style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: recipe.type === 'quick' ? 'rgba(250,173,20,0.9)' : 'rgba(24,144,255,0.9)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {recipe.type === 'quick' ? <Zap size={11} /> : <Clock size={11} />}
                    {recipeTypeLabels[recipe.type]}
                  </span>

                  {/* 右上角选中标识 */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: '#722ed1',
                      color: 'white',
                      padding: '4px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(114,46,209,0.4)'
                    }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* 内容区域 - 紧凑布局 */}
                <div style={{ padding: '10px' }}>
                  <h4 style={{ 
                    margin: '0 0 6px 0', 
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#262626',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {recipe.name}
                  </h4>

                  {/* 食材和调料数量 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#8c8c8c',
                    marginBottom: '6px'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <span>🥘</span>
                      <span style={{ fontWeight: '600' }}>{recipe.ingredients.length}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <span>🧂</span>
                      <span style={{ fontWeight: '600' }}>{recipe.seasonings.length}</span>
                    </span>
                  </div>

                  {/* 食材预览 */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {recipe.ingredients.slice(0, 2).map((ingredient, idx) => (
                      <span key={idx} style={{
                        padding: '2px 6px',
                        background: '#f9f0ff',
                        color: '#722ed1',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        border: '1px solid #efdbff'
                      }}>
                        {ingredient}
                      </span>
                    ))}
                    {recipe.ingredients.length > 2 && (
                      <span style={{
                        padding: '2px 6px',
                        background: '#f5f5f5',
                        color: '#595959',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        +{recipe.ingredients.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
