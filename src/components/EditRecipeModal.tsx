import { useState, useEffect } from 'preact/hooks';
import type { Recipe, RecipeType, Ingredient } from '../types';
import { X, Upload } from 'lucide-preact';
import { getIngredients } from '../api';

interface EditRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    id: number;
    name: string;
    type: RecipeType;
    description: string;
    imageFile?: File;
    ingredientIds: number[];
  }) => void;
  recipe: Recipe | null;
  isMobile?: boolean;
}

export function EditRecipeModal({ isOpen, onClose, onSubmit, recipe, isMobile = false }: EditRecipeModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<RecipeType>('快手菜');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<number[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // 加载食材列表
  useEffect(() => {
    if (isOpen) {
      loadIngredients();
    }
  }, [isOpen]);

  async function loadIngredients() {
    try {
      const data = await getIngredients();
      setIngredients(data);
    } catch (err) {
      console.error('加载食材失败:', err);
    }
  }

  // 当 recipe 变化时，更新表单数据
  useEffect(() => {
    if (recipe) {
      setName(recipe.name);
      setType(recipe.type);
      setDescription(recipe.description || '');
      setImagePreview(recipe.coverUrl || '');
      setImageFile(null);
      // 回显关联的食材ID
      setSelectedIngredientIds(recipe.ingredientIds || []);
    }
  }, [recipe]);

  if (!isOpen || !recipe) return null;

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
      alert('请输入菜谱名称');
      return;
    }

    onSubmit({
      id: recipe.id,
      name: name.trim(),
      type,
      description: description.trim(),
      imageFile: imageFile || undefined,
      ingredientIds: selectedIngredientIds
    });

    // 重置表单
    setName('');
    setType('快手菜');
    setDescription('');
    setImageFile(null);
    setImagePreview('');
    setSelectedIngredientIds([]);
    setSearchKeyword('');
  };

  // 过滤食材列表
  const filteredIngredients = ingredients.filter(ing => 
    ing.name.toLowerCase().includes(searchKeyword.toLowerCase()) &&
    !selectedIngredientIds.includes(ing.id)
  );

  // 添加食材
  const addIngredient = (id: number) => {
    setSelectedIngredientIds(prev => [...prev, id]);
    setSearchKeyword('');
    setShowDropdown(false);
  };

  // 移除食材
  const removeIngredient = (id: number) => {
    setSelectedIngredientIds(prev => prev.filter(i => i !== id));
  };

  // 获取选中的食材对象
  const selectedIngredients = ingredients.filter(ing => 
    selectedIngredientIds.includes(ing.id)
  );

  // 处理搜索框回车键
  const handleSearchKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 阻止表单提交
      
      // 如果有搜索结果，自动选择第一个
      if (filteredIngredients.length > 0) {
        addIngredient(filteredIngredients[0].id);
      }
    }
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
            <span style={{ fontSize: '24px' }}>✏️</span>
            修改菜谱
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
          {/* 菜谱图片 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#262626'
            }}>
              菜谱图片
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
            onClick={() => document.getElementById('recipe-image-upload-edit')?.click()}
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
                id="recipe-image-upload-edit"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* 菜谱名称 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#262626'
            }}>
              菜谱名称 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
              placeholder="例如：宫保鸡丁"
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

          {/* 菜谱类型 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#262626'
            }}>
              菜谱类型 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px'
            }}>
              {(['快手菜', '功夫菜'] as RecipeType[]).map(recipeType => (
                <button
                  key={recipeType}
                  type="button"
                  onClick={() => setType(recipeType)}
                  style={{
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: type === recipeType ? 'none' : '1.5px solid #d9d9d9',
                    borderRadius: '8px',
                    background: type === recipeType ? '#1890ff' : '#fff',
                    color: type === recipeType ? '#fff' : '#595959',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>
                    {recipeType === '快手菜' ? '⚡' : '🍲'}
                  </span>
                  {recipeType}
                </button>
              ))}
            </div>
          </div>

          {/* 关联食材 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#262626'
            }}>
              关联食材
            </label>
            
            {/* 搜索输入框 */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <input
                type="text"
                value={searchKeyword}
                onInput={(e) => {
                  setSearchKeyword((e.target as HTMLInputElement).value);
                  setShowDropdown(true);
                }}
                onClick={() => setShowDropdown(true)}
                onFocus={(e) => {
                  setShowDropdown(true);
                  (e.target as HTMLInputElement).style.borderColor = '#1890ff';
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="点击查看所有食材，或输入搜索..."
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
                onBlur={(e) => {
                  setTimeout(() => setShowDropdown(false), 200);
                  (e.target as HTMLInputElement).style.borderColor = '#d9d9d9';
                }}
              />

              {/* 下拉列表 - 聚焦时显示（即使搜索框为空） */}
              {showDropdown && filteredIngredients.length > 0 && (
                <div 
                  class="ingredient-dropdown"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: '#fff',
                    border: '1.5px solid #d9d9d9',
                    borderRadius: '8px',
                    maxHeight: '240px',
                    overflowY: 'auto',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 10
                  }}
                >
                  {filteredIngredients.slice(0, 15).map((ing, index) => (
                    <div
                      key={ing.id}
                      onClick={() => addIngredient(ing.id)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        fontSize: '14px',
                        color: '#262626',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: index < Math.min(filteredIngredients.length, 15) - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e6f7ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                    >
                      <span style={{ fontWeight: '600' }}>{ing.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '12px',
                          color: '#909399',
                          padding: '2px 8px',
                          background: '#f5f5f5',
                          borderRadius: '4px'
                        }}>
                          {ing.category}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: '#bfbfbf'
                        }}>
                          {ing.shelfLifeDays}天
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 已选食材列表 */}
            {selectedIngredients.length > 0 && (
              <div style={{
                border: '1.5px solid #91d5ff',
                borderRadius: '8px',
                background: '#fafafa',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {selectedIngredients.map((ing, index) => (
                  <div
                    key={ing.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: index < selectedIngredients.length - 1 ? '1px solid #91d5ff' : 'none',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e6f7ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        background: '#1890ff',
                        color: '#fff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </span>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#262626',
                        flex: 1
                      }}>
                        {ing.name}
                      </span>
                      <span style={{
                        fontSize: '13px',
                        color: '#8c8c8c',
                        padding: '3px 10px',
                        background: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #e8e8e8'
                      }}>
                        {ing.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeIngredient(ing.id)}
                      style={{
                        marginLeft: '12px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#fff1f0',
                        color: '#f5222d',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        flexShrink: 0
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
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 空状态提示 */}
            {selectedIngredients.length === 0 && (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#8c8c8c',
                fontSize: '14px',
                background: '#fafafa',
                border: '1.5px dashed #d9d9d9',
                borderRadius: '8px'
              }}>
                暂未添加食材，请在上方搜索框中搜索并添加
              </div>
            )}
          </div>

          {/* 菜谱描述 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#262626'
            }}>
              菜谱描述
            </label>
            <textarea
              value={description}
              onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
              placeholder="简单描述一下这道菜..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '1.5px solid #d9d9d9',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => (e.target as HTMLTextAreaElement).style.borderColor = '#1890ff'}
              onBlur={(e) => (e.target as HTMLTextAreaElement).style.borderColor = '#d9d9d9'}
            />
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
              确认修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

