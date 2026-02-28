# 购物车功能集成说明

## 📋 已完成的功能

### 1. API 接口集成

已在 `src/api/index.ts` 中添加了完整的采购管理接口：

```typescript
// 计算采购清单（POST /api/purchase/calculate）
calculatePurchaseList(recipeIds: number[]): Promise<Ingredient[]>

// 确认购买并入库（POST /api/purchase/confirm）
confirmPurchase(request: PurchaseRequest): Promise<void>

// 获取采购订单列表（GET /api/purchase/list）
getPurchaseOrders(status?: number): Promise<any[]>

// 获取订单详情（GET /api/purchase/{id}）
getPurchaseOrderDetail(id: number): Promise<any>
```

### 2. 购物清单计算逻辑

在 `src/app.tsx` 中实现了智能购物清单计算：

- **后端优先**：优先调用 `/api/purchase/calculate` 接口，由后端计算缺少的食材
- **前端回退**：如果后端调用失败，自动回退到前端本地计算逻辑
- **Mock 模式**：在 Mock 模式下使用前端逻辑
- **手动添加**：支持手动添加食材到购物清单

### 3. 确认购买流程

实现了完整的购买确认流程：

1. 用户在菜谱区选择菜谱，或手动添加食材
2. 系统自动调用后端 API 计算需要购买的食材
3. 在购物清单页面展示待购买食材
4. 用户点击"确认购买并入库"
5. 调用 `/api/purchase/confirm` 接口
6. 后端自动将食材添加到库存
7. 前端刷新数据，显示成功提示

### 4. 用户体验优化

- ✅ 添加了加载状态提示（计算购物清单时显示 loading）
- ✅ 实时更新购物清单（选中菜谱变化时自动重新计算）
- ✅ 友好的错误提示（API 调用失败时显示具体错误信息）
- ✅ 成功反馈（购买成功后显示 Toast 提示）

## 🔄 数据流程

```
用户选择菜谱
    ↓
调用 POST /api/purchase/calculate
    ↓
后端返回缺少的食材列表
    ↓
前端展示购物清单
    ↓
用户确认购买
    ↓
调用 POST /api/purchase/confirm
    ↓
后端自动入库到储物区
    ↓
前端刷新数据并提示成功
```

## 🎯 关键特性

### 1. 智能计算
- 后端根据当前库存智能计算缺少的食材
- 避免重复购买已有的食材
- 支持忽略调料选项

### 2. 双模式支持
- **真实模式**：调用后端 API
- **Mock 模式**：使用前端模拟数据（用于开发测试）

### 3. 容错机制
- 后端 API 失败时自动回退到前端计算
- 网络错误时显示友好提示
- 空清单时阻止提交

## 📝 使用示例

### 前端调用示例

```typescript
// 1. 计算采购清单
const missingIngredients = await calculatePurchaseList([1, 2, 3]); // 菜谱 ID 数组

// 2. 确认购买
await confirmPurchase({
  ingredientIds: [101, 102],
  totalCost: 25.5,
  remark: "超市周三会员日采购"
});
```

### 后端接口对应

```
POST /api/purchase/calculate
Body: [1, 2, 3]
Response: [{ id: 101, name: "西红柿", ... }]

POST /api/purchase/confirm
Body: { ingredientIds: [101, 102], totalCost: 25.5, remark: "..." }
Response: 200 OK
```

## ⚠️ 注意事项

1. **数据类型转换**：前端使用中文枚举（如"蔬菜"），后端使用整数枚举（如 1），API 层自动处理转换
2. **错误处理**：所有 API 调用都包含 try-catch，失败时显示用户友好的错误信息
3. **状态同步**：购买成功后会重新加载所有数据，确保库存状态同步
4. **空值保护**：对所有可能为空的数组字段（如 ingredients、seasonings）都做了空值保护

## 🚀 后续可扩展功能

- [ ] 添加采购历史记录查看（使用 `getPurchaseOrders` 接口）
- [ ] 添加订单详情查看（使用 `getPurchaseOrderDetail` 接口）
- [ ] 支持用户输入总价格
- [ ] 支持编辑购物清单（删除不需要的食材）
- [ ] 支持批量购买多个购物清单

