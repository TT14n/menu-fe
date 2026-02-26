import { useState } from 'preact/hooks';
import type { Item, StorageType } from '../types';
import { calculateFreshness, isExpiringSoon, isExpired } from '../utils/dateUtils';

interface StorageAreaProps {
  items: Item[];
}

const storageLabels: Record<StorageType, string> = {
  'room-temp': '常温',
  'refrigerated': '冷藏',
  'frozen': '冷冻'
};

const typeLabels: Record<string, string> = {
  'fruit': '水果',
  'vegetable': '蔬菜',
  'meat': '肉类',
  'carbs': '碳水'
};

const typeColors: Record<string, string> = {
  'fruit': 'bg-orange-50 text-orange-600',
  'vegetable': 'bg-green-50 text-green-600',
  'meat': 'bg-red-50 text-red-600',
  'carbs': 'bg-yellow-50 text-yellow-600'
};

// 食材图片映射
function getItemImage(itemName: string): string {
  const searchTerm = encodeURIComponent(itemName);
  return `https://source.unsplash.com/400x300/?${searchTerm},food`;
}

type FilterType = 'all' | 'room-temp' | 'refrigerated' | 'frozen' | 'expiring';

export function StorageArea({ items }: StorageAreaProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // 筛选逻辑
  const filteredItems = items.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'expiring') return isExpiringSoon(item.productionDate, item.shelfLife);
    return item.storageType === activeFilter;
  });

  // 计算每个筛选器的数量
  const getFilterCount = (filterId: FilterType) => {
    if (filterId === 'all') return items.length;
    if (filterId === 'expiring') return items.filter(item => isExpiringSoon(item.productionDate, item.shelfLife)).length;
    return items.filter(item => item.storageType === filterId).length;
  };

  const filters = [
    { id: 'all' as FilterType, label: '全部食材', emoji: '📦' },
    { id: 'expiring' as FilterType, label: '快过期', emoji: '⚠️' },
    { id: 'room-temp' as FilterType, label: '常温', emoji: '🌡️' },
    { id: 'refrigerated' as FilterType, label: '冷藏', emoji: '❄️' },
    { id: 'frozen' as FilterType, label: '冷冻', emoji: '🧊' },
  ];

  return (
    <div class="min-h-screen">
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
                background: isActive ? '#52c41a' : '#fff',
                color: isActive ? '#fff' : '#595959',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isActive ? '0 2px 8px rgba(82,196,26,0.2)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#52c41a';
                  e.currentTarget.style.color = '#52c41a';
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
      {filteredItems.length === 0 ? (
        <div class="text-center py-20">
          <div class="inline-block p-8 bg-gray-50 rounded-2xl mb-4">
            <span class="text-6xl">📦</span>
          </div>
          <p class="text-gray-700 font-semibold text-base">暂无食材</p>
          <p class="text-gray-400 text-sm mt-1">去购物清单添加一些食材吧</p>
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
          {filteredItems.map(item => {
            const freshness = calculateFreshness(item.productionDate, item.shelfLife);
            const expiringSoon = isExpiringSoon(item.productionDate, item.shelfLife);
            const expired = isExpired(item.productionDate, item.shelfLife);
            
            // 智能色彩状态
            const getDeadlineColor = (days: number) => {
              if (days <= 3) return '#ff4d4f'; // 红色：紧急
              if (days <= 7) return '#faad14'; // 黄色：注意
              return '#52c41a'; // 绿色：安全
            };

            return (
              <div 
                key={item.id} 
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  background: '#fff',
                  transition: 'all 0.2s ease',
                  opacity: expired ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
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
                    src={getItemImage(item.name)} 
                    alt={item.name}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/160?text=' + encodeURIComponent(item.name);
                    }}
                  />
                  
                  {/* 右上角存储类型标签 */}
                  <span style={{
                    position: 'absolute', 
                    top: '6px', 
                    right: '6px',
                    background: 'rgba(0,0,0,0.6)', 
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '6px', 
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {storageLabels[item.storageType]}
                  </span>

                  {/* 左下角类型标签 */}
                  <span style={{
                    position: 'absolute',
                    bottom: '6px',
                    left: '6px',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: item.type === 'fruit' ? '#fff7e6' :
                               item.type === 'vegetable' ? '#f6ffed' :
                               item.type === 'meat' ? '#fff1f0' : '#fffbe6',
                    color: item.type === 'fruit' ? '#fa8c16' :
                           item.type === 'vegetable' ? '#52c41a' :
                           item.type === 'meat' ? '#f5222d' : '#faad14'
                  }}>
                    {typeLabels[item.type]}
                  </span>
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
                    {item.name}
                  </h4>
                  
                  <div style={{ 
                    fontSize: '13px', 
                    color: getDeadlineColor(item.shelfLife),
                    fontWeight: '700',
                    marginBottom: '6px'
                  }}>
                    剩 {item.shelfLife} 天
                  </div>

                  {/* 新鲜度进度条 */}
                  <div style={{
                    width: '100%',
                    height: '4px',
                    background: '#f0f0f0',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${freshness}%`,
                      height: '100%',
                      background: getDeadlineColor(item.shelfLife),
                      transition: 'width 0.3s ease',
                      borderRadius: '2px'
                    }} />
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
