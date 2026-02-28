import { useState } from 'preact/hooks';
import type { StorageType, IngredientCategory } from '../types';
import { X, Upload, Image as ImageIcon } from 'lucide-preact';

interface AddIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    category: IngredientCategory;
    shelfLifeDays: number;
    storageType: StorageType;
    productionDate: string;
    imageFile?: File;
  }) => void;
  isMobile?: boolean;
}

export function AddIngredientModal({ isOpen, onClose, onSubmit, isMobile = false }: AddIngredientModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('蔬菜');
  const [shelfLifeDays, setShelfLifeDays] = useState(7);
  const [storageType, setStorageType] = useState<StorageType>('冷藏');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  if (!isOpen) return null;

  const handleImageChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      
      // 验证文件大小（限制为5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
      }
      
      setImageFile(file);
      
      // 生成预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('请输入食材名称');
      return;
    }
    
    if (shelfLifeDays <= 0) {
      alert('保质期必须大于0天');
      return;
    }

    onSubmit({
      name: name.trim(),
      category,
      shelfLifeDays,
      storageType,
      productionDate: new Date().toISOString().split('T')[0], // 自动使用当天日期
      imageFile: imageFile || undefined
    });

    // 重置表单
    setName('');
    setCategory('蔬菜');
    setShelfLifeDays(7);
    setStorageType('冷藏');
    setImageFile(null);
    setImagePreview('');
  };

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
        padding: isMobile ? '20px' : '40px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div style={{
          padding: isMobile ? '20px' : '24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #e6f7ff 0%, #91d5ff 100%)'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? '20px' : '22px',
            fontWeight: '700',
            color: '#262626',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '24px' }}>🥬</span>
            新增食材
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={24} style={{ color: '#8c8c8c' }} />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '20px' : '24px' }}>
          {/* 食材图片 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#262626'
            }}>
              食材图片
            </label>
            <div style={{
              border: '2px dashed #d9d9d9',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: imagePreview ? '#fafafa' : '#fff'
            }}
            onClick={() => document.getElementById('image-upload')?.click()}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1890ff'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d9d9d9'}
            >
              {imagePreview ? (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={imagePreview} 
                    alt="预览" 
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload size={32} style={{ color: '#8c8c8c', margin: '0 auto 8px' }} />
                  <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#262626', fontWeight: '600' }}>
                    点击上传图片
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#8c8c8c' }}>
                    支持 JPG、PNG 格式，大小不超过 5MB
                  </p>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* 食材名称 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#262626'
            }}>
              食材名称 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
              placeholder="例如：西红柿"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '1.5px solid #d9d9d9',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#1890ff'}
              onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#d9d9d9'}
            />
          </div>

          {/* 食材分类 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#262626'
            }}>
              食材分类 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px'
            }}>
              {(['蔬菜', '水果', '肉类', '碳水', '调料'] as IngredientCategory[]).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '10px 8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: category === cat ? 'none' : '1.5px solid #d9d9d9',
                    borderRadius: '8px',
                    background: category === cat ? '#1890ff' : '#fff',
                    color: category === cat ? '#fff' : '#595959',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 储存方式 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#262626'
            }}>
              储存方式 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px'
            }}>
              {(['常温', '冷藏', '冷冻'] as StorageType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setStorageType(type)}
                  style={{
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: storageType === type ? 'none' : '1.5px solid #d9d9d9',
                    borderRadius: '8px',
                    background: storageType === type ? '#1890ff' : '#fff',
                    color: storageType === type ? '#fff' : '#595959',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>
                    {type === '常温' ? '🌡️' : type === '冷藏' ? '❄️' : '🧊'}
                  </span>
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 保质期 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#262626'
            }}>
              保质期（天） <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <input
              type="number"
              value={shelfLifeDays}
              onInput={(e) => setShelfLifeDays(parseInt((e.target as HTMLInputElement).value) || 0)}
              min="1"
              placeholder="例如：7"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '1.5px solid #d9d9d9',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#52c41a'}
              onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#d9d9d9'}
            />
            <p style={{
              fontSize: '12px',
              color: '#8c8c8c',
              margin: '6px 0 0 0'
            }}>
              生产日期将自动设置为今天
            </p>
          </div>

          {/* 按钮组 */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
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
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.color = '#1890ff';
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
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(24,144,255,0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              确认添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

