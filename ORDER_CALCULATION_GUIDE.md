# 订单计算与参数转换指南

## 问题总结

### 发现的问题

1. **字段名错误**: API 文档写的是 `outcome`，但后端实际需要 `direction`
2. **精度转换错误**: `amount` 字段从 6位精度（1000000 = 1.0）错误转换，应该是 2位精度（100 = 1.0）

### 修复内容

1. ✅ 修正 `src/services/api.ts` - 使用 `direction` 字段而非 `outcome`
2. ✅ 修正 `src/contexts/MarketContext.tsx` - 将 amount 从 2位精度正确转换为小数字符串
3. ✅ 更新 `API_ENDPOINTS_REFERENCE.md` - 修正文档中的字段名和说明

---

## 完整计算流程

### 场景：用户想用 50 USDC 以 0.5 的价格买入 YES

#### 1. 用户输入（TradingPanel.tsx）

```typescript
amount = 50        // 用户输入的 USDC 金额
limitPrice = 0.5   // 用户设置的限价（0-1 范围）
```

#### 2. 前端计算份额（TradingPanel.tsx 第174行）

```typescript
const estimatedShares = amount / price
// estimatedShares = 50 / 0.5 = 100 份额
```

#### 3. 转换为内部精度（TradingPanel.tsx 第221行）

```typescript
amount: Math.round(estimatedShares * 100)
// amount = Math.round(100 * 100) = 10000
// 表示 100.00 份额（2位精度）
```

#### 4. 转换为 API 参数（MarketContext.tsx 第409-415行）

```typescript
// 价格转换：BPS (0-10000) -> 小数 (0-1)
const priceStr = (Number(params.price) / 10000).toFixed(4).replace(/\.?0+$/, "")
// priceStr = (5000 / 10000).toFixed(4) = "0.5"

// 份额转换：2位精度 (100 = 1.0) -> 小数字符串
const amountBig = params.amount  // 10000n
const intPart = amountBig / 100n  // 100n
const fracPart = amountBig % 100n  // 0n
let amountStr = `${intPart}.${fracPart.toString().padStart(2, "0")}`
// amountStr = "100.00"
amountStr = amountStr.replace(/\.?0+$/, "")
// amountStr = "100"
```

#### 5. 发送给 Gateway API

```json
{
  "client_order_id": "b35430ab-8bd4-46b7-9a44-c24e8d4bb4f5",
  "market_id": "1901763196600",
  "side": "BUY",
  "direction": "YES",
  "type": "LIMIT",
  "price": "0.5",
  "amount": "100"
}
```

#### 6. 后端处理

- 冻结 USDC: `100 * 0.5 = 50 USDC` ✅
- 成交后获得: `100 个 YES 份额` ✅

---

## 精度说明

### 前端内部精度

| 类型 | 精度 | 示例 | 说明 |
|------|------|------|------|
| 价格 (BPS) | 4位 (10000 = 1.0) | 5000 = 50% | 基点表示，0-10000 |
| 份额 | 2位 (100 = 1.0) | 10000 = 100.00 | 份额数量 |
| USDC | 2位 (100 = 1.0) | 5000 = 50.00 | 货币金额 |

### Gateway API 格式

| 字段 | 格式 | 示例 | 说明 |
|------|------|------|------|
| price | 小数字符串 (0-1) | "0.5" | 50% 概率 |
| amount | 小数字符串 | "100" | 100 份额 |

---

## 常见场景示例

### 示例 1: 买入 10 USDC @ 0.6

```typescript
// 前端输入
amount = 10
price = 0.6

// 计算份额
shares = 10 / 0.6 = 16.67

// 内部精度
amountInternal = Math.round(16.67 * 100) = 1667  // 16.67 份额
priceInternal = Math.round(0.6 * 10000) = 6000   // 60%

// API 参数
{
  "price": "0.6",
  "amount": "16.67"
}

// 后端冻结
16.67 * 0.6 = 10.002 USDC ≈ 10 USDC ✅
```

### 示例 2: 买入 100 USDC @ 0.45

```typescript
// 前端输入
amount = 100
price = 0.45

// 计算份额
shares = 100 / 0.45 = 222.22

// 内部精度
amountInternal = Math.round(222.22 * 100) = 22222  // 222.22 份额
priceInternal = Math.round(0.45 * 10000) = 4500    // 45%

// API 参数
{
  "price": "0.45",
  "amount": "222.22"
}

// 后端冻结
222.22 * 0.45 = 99.999 USDC ≈ 100 USDC ✅
```

### 示例 3: 市价单 50 USDC

```typescript
// 前端输入
amount = 50
orderType = "market"

// 市价单价格为 0（后端自动匹配最优价格）
priceInternal = 0

// 假设市场价格为 0.52，计算份额
shares = 50 / 0.52 = 96.15

// 内部精度
amountInternal = Math.round(96.15 * 100) = 9615  // 96.15 份额

// API 参数
{
  "type": "MARKET",
  "price": "",  // 市价单不需要价格
  "amount": "96.15"
}
```

---

## 验证检查清单

在下单前，确保：

- [ ] `amount` 是份额数量，不是 USDC 金额
- [ ] `price` 在 0-1 范围内（限价单）
- [ ] `direction` 字段为 "YES" 或 "NO"
- [ ] `side` 字段为 "BUY" 或 "SELL"
- [ ] `type` 字段为 "LIMIT" 或 "MARKET"
- [ ] 市价单的 `price` 可以为空字符串或不传
- [ ] `client_order_id` 至少 16 个字符（用于幂等性）

---

## 错误排查

### 错误 1: "Invalid request: Field validation for 'Direction' failed"

**原因**: 缺少 `direction` 字段或字段名错误

**解决**: 确保请求体包含 `"direction": "YES"` 或 `"direction": "NO"`

### 错误 2: 余额不足

**原因**: 计算的份额数量 × 价格 > 用户余额

**解决**: 
- 检查 `amount` 是否正确转换为份额数量
- 验证 `amount * price ≤ userBalance`

### 错误 3: amount 参数过小（如 0.01）

**原因**: 精度转换错误，使用了错误的除数

**解决**: 
- 确保使用 `amountBig / 100n`（2位精度）
- 不要使用 `amountBig / 1000000n`（6位精度）

---

## 最后更新

- **日期**: 2025-11-15
- **版本**: v1.0
- **修复**: 字段名和精度转换问题

