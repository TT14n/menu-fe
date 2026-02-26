import type { ShoppingItem, Item } from '../types';
import { ShoppingCart, AlertTriangle, CheckCircle, Package, Trash2 } from 'lucide-preact';
import { isExpiringSoon } from '../utils/dateUtils';

interface ShoppingListProps {
  shoppingItems: ShoppingItem[];
  expiringItems: Item[];
  onConfirmPurchase: () => void;
}

export function ShoppingList({ shoppingItems, expiringItems, onConfirmPurchase }: ShoppingListProps) {
  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 临期预警 - 简洁卡片样式 */}
      {expiringItems.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
          borderRadius: '12px',
          border: '1px solid #ffd591',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(250,173,20,0.1)',
          marginBottom: '16px'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #ffd591',
            background: 'rgba(255,255,255,0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                background: 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={22} class="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#ad6800',
                  margin: 0
                }}>⚠️ 即将耗尽/过期提醒</h3>
                <p style={{
                  fontSize: '13px',
                  color: '#d48806',
                  margin: 0,
                  fontWeight: '600'
                }}>{expiringItems.length} 项食材需要注意</p>
              </div>
            </div>
          </div>
          
          <div style={{
            padding: '12px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '8px'
          }}>
            {expiringItems.map(item => {
              const daysLeft = Math.floor((item.shelfLife - (Date.now() - new Date(item.productionDate).getTime()) / (1000 * 60 * 60 * 24)));
              const isUrgent = daysLeft <= 3;
              
              return (
                <div key={item.id} style={{
                  background: '#fff',
                  borderRadius: '10px',
                  padding: '10px',
                  border: isUrgent ? '2px solid #ff4d4f' : '1px solid #ffd591',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px'
                  }}>
                    <span style={{
                      fontWeight: '600',
                      color: '#262626',
                      fontSize: '13px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{item.name}</span>
                    <span style={{ fontSize: '18px' }}>{isUrgent ? '🚨' : '⚠️'}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{
                      fontSize: '11px',
                      color: '#8c8c8c',
                      fontWeight: '600'
                    }}>剩余</span>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: isUrgent ? '#ff4d4f' : '#fa8c16'
                    }}>
                      {daysLeft} 天
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 购物清单 */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #f0f0f0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #b7eb8f'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '10px',
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(82,196,26,0.2)'
            }}>
              <ShoppingCart size={24} class="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#262626',
                margin: 0
              }}>🛒 购物清单</h3>
              <p style={{
                fontSize: '13px',
                color: '#52c41a',
                margin: 0,
                fontWeight: '600'
              }}>{shoppingItems.length} 项待购买</p>
            </div>
          </div>
          
          {shoppingItems.length > 0 && (
            <button
              onClick={onConfirmPurchase}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                color: '#fff',
                fontWeight: '700',
                fontSize: '14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(82,196,26,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(82,196,26,0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(82,196,26,0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <CheckCircle size={18} strokeWidth={2.5} />
              确认购买
            </button>
          )}
        </div>

        <div style={{ padding: '16px' }}>
          {shoppingItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                display: 'inline-block',
                padding: '24px',
                background: '#fafafa',
                borderRadius: '16px',
                marginBottom: '16px'
              }}>
                <Package size={64} class="text-slate-300" />
              </div>
              <p style={{
                color: '#262626',
                fontWeight: '600',
                fontSize: '16px',
                margin: '0 0 8px 0'
              }}>购物清单为空</p>
              <p style={{
                fontSize: '13px',
                color: '#8c8c8c',
                margin: 0
              }}>在菜谱区选择菜谱后，会自动生成需要购买的食材</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '12px'
            }}>
              {shoppingItems.map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: 'linear-gradient(135deg, #fff 0%, #f6ffed 100%)',
                    borderRadius: '10px',
                    border: '1px solid #d9f7be',
                    padding: '12px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#52c41a';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(82,196,26,0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d9f7be';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span style={{ fontSize: '18px' }}>🛒</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{
                        fontWeight: '700',
                        color: '#262626',
                        fontSize: '14px',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{item.name}</h4>
                      <p style={{
                        fontSize: '11px',
                        color: '#52c41a',
                        fontWeight: '600',
                        margin: 0
                      }}>待购买</p>
                    </div>
                  </div>
                  
                  {item.recipeNames && item.recipeNames.length > 0 && (
                    <div>
                      <p style={{
                        fontSize: '11px',
                        color: '#595959',
                        fontWeight: '600',
                        margin: '0 0 6px 0'
                      }}>用于菜谱：</p>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px'
                      }}>
                        {item.recipeNames.map((recipeName, rIdx) => (
                          <span key={rIdx} style={{
                            padding: '2px 8px',
                            background: '#f6ffed',
                            color: '#389e0d',
                            borderRadius: '6px',
                            fontSize: '11px',
                            border: '1px solid #b7eb8f',
                            fontWeight: '600'
                          }}>
                            {recipeName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
