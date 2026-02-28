import { useState, useEffect } from 'preact/hooks';
import type { Ingredient, StorageType } from '../types';
import { X } from 'lucide-preact';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    ingredientId: number;
    productionDate: string;
    storageType: StorageType;
  }) => void;
  ingredients: Ingredient[];
  isMobile?: boolean;
}

export function AddInventoryModal({ isOpen, onClose, onSubmit, ingredients, isMobile = false }: AddInventoryModalProps) {
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | null>(null);
  const [productionDate, setProductionDate] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    if (isOpen) {
      // 重置表单
      setSelectedIngredientId(null);
      setProductionDate(new Date().toISOString().split('T')[0]); // 默认今天
      setSearchKeyword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedIngredient = ingredients.find(ing => ing.id === selectedIngredientId);
  
  // 计算过期日期
  const calculateExpiryDate = () => {
    if (!selectedIngredient || !productionDate) return '';
    const prodDate = new Date(productionDate);
    const expiryDate = new Date(prodDate);
    expiryDate.setDate(expiryDate.getDate() + selectedIngredient.shelfLifeDays);
    return expiryDate.toISOString().split('T')[0];
  };

  const expiryDate = calculateExpiryDate();

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    if (!selectedIngredientId) {
      alert('请选择食材');
      return;
    }
    
    if (!productionDate) {
      alert('请选择生产日期');
      return;
    }
    
    // 使用食材的默认储存方式
    const storageType = selectedIngredient?.storageType || '冷藏';
    
    onSubmit({
      ingredientId: selectedIngredientId,
      productionDate,
      storageType
    });
  };

  // 过滤食材
  const filteredIngredients = ingredients.filter(ing => 
    ing.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );



  return (
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
      onClick={onClose}
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
            <span style={{ fontSize: '20px' }}>📦</span>
            添加库存
          </h3>
          <button
            onClick={onClose}
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

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '16px' : '18px' }}>
          {/* 选择食材 */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#262626',
              marginBottom: '8px'
            }}>
              选择食材 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            
            {/* 搜索框 */}
            <input
              type="text"
              placeholder="搜索食材名称..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword((e.target as HTMLInputElement).value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #d9d9d9',
                borderRadius: '8px',
                fontSize: '15px',
                marginBottom: '8px',
                transition: 'all 0.2s',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#faad14'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#d9d9d9'}
            />

            {/* 食材列表 */}
            <div 
              class="ingredient-list-container"
              style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1.5px solid #d9d9d9',
                borderRadius: '8px',
                padding: '3px'
              }}
            >
              {filteredIngredients.length === 0 ? (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#8c8c8c',
                  fontSize: '14px'
                }}>
                  {searchKeyword ? '未找到匹配的食材' : '暂无食材，请先在食材区添加'}
                </div>
              ) : (
                filteredIngredients.map((ingredient, index) => (
                  <div
                    key={ingredient.id}
                    onClick={() => setSelectedIngredientId(ingredient.id)}
                    class="ingredient-option-item"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: selectedIngredientId === ingredient.id ? '#fffbe6' : '#fff',
                      border: selectedIngredientId === ingredient.id ? '2px solid #faad14' : '2px solid transparent',
                      marginBottom: index === filteredIngredients.length - 1 ? '0' : '3px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedIngredientId !== ingredient.id) {
                        e.currentTarget.style.background = '#fafafa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedIngredientId !== ingredient.id) {
                        e.currentTarget.style.background = '#fff';
                      }
                    }}
                  >
                    {/* 左侧：食材名称 */}
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#262626',
                      flex: '0 0 auto'
                    }}>
                      {ingredient.name}
                    </div>
                    
                    {/* 右侧容器：固定布局 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: '0 0 auto'
                    }}>
                      {/* 分类+保质期 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{
                          padding: '2px 6px',
                          background: ingredient.category === '水果' ? '#fff7e6' :
                                     ingredient.category === '蔬菜' ? '#f6ffed' :
                                     ingredient.category === '肉类' ? '#fff1f0' : 
                                     ingredient.category === '碳水' ? '#fffbe6' : '#f9f0ff',
                          color: ingredient.category === '水果' ? '#fa8c16' :
                                 ingredient.category === '蔬菜' ? '#52c41a' :
                                 ingredient.category === '肉类' ? '#f5222d' : 
                                 ingredient.category === '碳水' ? '#faad14' : '#722ed1',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {ingredient.category}
                        </span>
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: '600',
                          color: '#8c8c8c'
                        }}>
                          {ingredient.shelfLifeDays}天
                        </span>
                      </div>
                      
                      {/* 选中标记占位容器 - 始终占据空间 */}
                      <div style={{
                        width: '16px',
                        height: '16px',
                        flex: '0 0 auto'
                      }}>
                        {selectedIngredientId === ingredient.id && (
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: '#faad14',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 生产日期 */}
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
          {selectedIngredient && productionDate && (
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
                保质期 {selectedIngredient.shelfLifeDays} 天 · 储存方式 {selectedIngredient.storageType}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#faad14'
              }}>
                过期日期：{expiryDate}
              </div>
            </div>
          )}

          {/* 按钮组 */}
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
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
              disabled={!selectedIngredientId || !productionDate}
              style={{
                padding: '10px 20px',
                fontSize: '15px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                background: selectedIngredientId && productionDate 
                  ? 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)' 
                  : '#f5f5f5',
                color: selectedIngredientId && productionDate ? '#fff' : '#d9d9d9',
                cursor: selectedIngredientId && productionDate ? 'pointer' : 'not-allowed',
                boxShadow: selectedIngredientId && productionDate ? '0 2px 8px rgba(250,173,20,0.3)' : 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedIngredientId && productionDate) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedIngredientId && productionDate) {
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              确认添加
            </button>
          </div>
        </form>
      </div>

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
        
        /* 日期输入框的日历按钮 */
        .date-input-large::-webkit-calendar-picker-indicator {
          width: 32px;
          height: 32px;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s;
          margin-right: -6px;
        }
        
        .date-input-large::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
        
        /* 增大下拉日历面板的宽度 */
        .date-input-large::-webkit-datetime-edit {
          padding-right: 8px;
        }
        
        /* 移动端优化 */
        @media (max-width: 768px) {
          .date-input-large::-webkit-calendar-picker-indicator {
            width: 36px;
            height: 36px;
            margin-right: -8px;
          }
        }
      `}</style>
    </div>
  );
}

