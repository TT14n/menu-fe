# 购菜管理系统 - 前端

一个基于 Preact + Tailwind CSS + Lucide Icons 的购菜管理系统前端应用。

## 功能特性

### 核心功能
- **储物区**：展示现有食材，按储存方式（常温/冷藏/冷冻）分类显示
- **菜谱区**：展示可选菜单，支持勾选加入今日计划
- **购物清单**：自动生成需要购买的食材

### 智能联动
- 勾选菜谱后，系统自动比对储物区已有食材
- 缺少的食材自动加入购物清单
- 支持"忽略调料"开关，开启后调料不进入清单

### 保质期管理
- 进度条显示食材新鲜度
- 快过期食材视觉提醒（剩余不足20%）
- 临期预警弹窗提示

### 功能亮点
- 🎨 **颜色区分**：肉类红色、蔬菜绿色、冷冻蓝色边框
- ⚠️ **临期预警**：自动提醒即将耗尽/过期的食材
- ✅ **一键购买**：确认购买后自动同步到储物区

## 技术栈

- **框架**：Preact 10.27
- **构建工具**：Vite 7.3
- **样式**：Tailwind CSS 4.2
- **图标**：Lucide Preact
- **HTTP 客户端**：Axios
- **语言**：TypeScript

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 项目结构

```
src/
├── api/
│   └── index.ts          # API 接口和 Mock 数据
├── components/
│   ├── StorageArea.tsx   # 储物区组件
│   ├── RecipeArea.tsx    # 菜谱区组件
│   └── ShoppingList.tsx  # 购物清单组件
├── utils/
│   └── dateUtils.ts      # 日期和保质期工具函数
├── types.ts              # TypeScript 类型定义
├── app.tsx               # 主应用组件
├── main.tsx              # 应用入口
└── index.css             # 全局样式
```

## 数据模型

### 食材 (Item)
```typescript
{
  id: string;
  name: string;
  productionDate: string;  // ISO 日期字符串
  shelfLife: number;       // 保质期天数
  type: 'fruit' | 'vegetable' | 'meat' | 'carbs';
  storageType: 'room-temp' | 'refrigerated' | 'frozen';
}
```

### 菜谱 (Recipe)
```typescript
{
  id: string;
  name: string;
  type: 'quick' | 'slow';
  ingredients: string[];   // 食材清单
  seasonings: string[];    // 调料清单
}
```

## 后端 API 接口

### 获取食材列表
```
GET /api/inventory
```

### 添加食材
```
POST /api/inventory
```

### 批量添加食材
```
POST /api/inventory/batch
```

### 获取菜谱列表
```
GET /api/recipes
```

## 配置

创建 `.env.local` 文件配置后端 API 地址：

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## 开发模式

应用内置了"使用测试数据"开关，开启后使用 Mock 数据进行开发，无需连接后端。

## 许可证

MIT

