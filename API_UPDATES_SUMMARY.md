# API 更新总结

## 最新修复（2025-11-15）

### 1. 订单参数修复 ✅

#### 问题
- **字段名错误**: API 文档写的是 `outcome`，实际后端需要 `direction`
- **精度转换错误**: amount 使用了 6位精度（1000000 = 1.0），应该是 2位精度（100 = 1.0）

#### 修复
- ✅ `src/services/api.ts`: 使用正确的字段名 `direction`
- ✅ `src/contexts/MarketContext.tsx`: 修正 amount 精度转换（从 `/1000000n` 改为 `/100n`）
- ✅ `API_ENDPOINTS_REFERENCE.md`: 更新文档，修正字段名和说明

#### 示例
**修复前**（错误）:
```json
{
  "outcome": "YES",  // ❌ 字段名错误
  "amount": "0.01"   // ❌ 精度错误
}
```

**修复后**（正确）:
```json
{
  "direction": "YES",  // ✅ 正确字段名
  "amount": "100"      // ✅ 正确精度（100份额）
}
```

---

### 2. 订单簿 API 集成 ✅

#### 发现
后端 API 实际上是**一次请求返回 YES 和 NO 两个子市场**的订单簿数据，而不是分开请求。

#### API 格式

**请求**:
```
GET /v1/markets/1901763197500/depth?levels=20
```

**注意**: 
- ❌ 不要加 `-YES` 或 `-NO` 后缀
- ✅ 使用纯市场ID

**响应**:
```json
{
  "code": 0,
  "market_id": "1901763197500",
  "levels": 20,
  "yes": {
    "bids": [{"price": "0.54", "quantity": "1000"}],
    "asks": [{"price": "0.55", "quantity": "800"}],
    "timestamp": 1763198380688
  },
  "no": {
    "bids": [{"price": "0.46", "quantity": "800"}],
    "asks": [{"price": "0.47", "quantity": "1000"}],
    "timestamp": 1763198380688
  }
}
```

#### 修复内容

1. **`src/services/api.ts`**
   - 修改 `getOrderBookDepth()` 方法
   - 移除 `direction` 参数
   - 返回包含 `yes` 和 `no` 两个子市场的数据
   - 改进错误处理，返回空数据而不是抛出错误

2. **`src/contexts/MarketContext.tsx`**
   - 更新 `refreshData()` 中的调用方式
   - 一次请求获取两个子市场数据
   - 同时缓存 YES 和 NO 两个订单簿

3. **文档更新**
   - `API_ENDPOINTS_REFERENCE.md`: 更新订单簿 API 说明
   - `ORDERBOOK_INTEGRATION.md`: 更新使用示例和说明

---

## 完整的下单流程

### 场景：用户用 50 USDC 以 0.5 的价格买入 YES

#### 1. 前端输入
```typescript
amount = 50        // USDC
limitPrice = 0.5   // 价格
```

#### 2. 计算份额
```typescript
shares = 50 / 0.5 = 100 份额
```

#### 3. 转换为内部精度
```typescript
amountInternal = Math.round(100 * 100) = 10000  // 2位精度
priceInternal = Math.round(0.5 * 10000) = 5000  // BPS
```

#### 4. 转换为 API 参数
```typescript
// 价格: BPS -> 小数
priceStr = (5000 / 10000).toFixed(4) = "0.5"

// 份额: 2位精度 -> 小数
amountBig = 10000n
intPart = 10000n / 100n = 100n
fracPart = 10000n % 100n = 0n
amountStr = "100.00".replace(/\.?0+$/, "") = "100"
```

#### 5. 发送请求
```json
POST /v1/market/orders
{
  "client_order_id": "uuid",
  "market_id": "1901763197500",
  "side": "BUY",
  "direction": "YES",
  "type": "LIMIT",
  "price": "0.5",
  "amount": "100"
}
```

#### 6. 后端处理
- 冻结: `100 × 0.5 = 50 USDC` ✅
- 成交后获得: `100 个 YES 份额` ✅

---

## 订单簿使用

### 自动轮询
订单簿会在以下情况自动刷新：
- 切换市场时立即加载
- 每5秒自动轮询
- 下单成功后刷新

### 在组件中使用
```typescript
import { useMarket } from "@/contexts/MarketContext";

function MyComponent() {
  const { orderBooks, currentMarket } = useMarket();
  
  // 获取订单簿
  const yesBook = orderBooks.get(`${currentMarket?.marketId}-YES`);
  const noBook = orderBooks.get(`${currentMarket?.marketId}-NO`);
  
  // 渲染
  return (
    <div>
      <h3>YES 买盘</h3>
      {yesBook?.bids.map(bid => (
        <div>{bid.price} - {bid.quantity}</div>
      ))}
    </div>
  );
}
```

---

## 关键要点

### ✅ 正确做法

1. **下单参数**
   - 使用 `direction` 字段（不是 `outcome`）
   - `amount` 是份额数量（不是 USDC 金额）
   - `price` 是 0-1 范围的小数字符串

2. **订单簿请求**
   - 使用纯市场ID（不带 -YES/-NO 后缀）
   - 一次请求返回两个子市场
   - 错误时返回空数据，不中断应用

3. **精度转换**
   - 价格: BPS (10000 = 1.0) ↔ 小数 (0-1)
   - 份额: 2位精度 (100 = 1.0) ↔ 小数
   - USDC: 2位精度 (100 = 1.0) ↔ 小数

### ❌ 常见错误

1. **字段名错误**
   - ❌ `outcome: "YES"`
   - ✅ `direction: "YES"`

2. **市场ID格式错误**
   - ❌ `1901763197500-YES` (带后缀)
   - ✅ `1901763197500` (不带后缀)

3. **amount 理解错误**
   - ❌ 认为是 USDC 金额
   - ✅ 实际是份额数量

4. **精度转换错误**
   - ❌ 使用 6位精度 (1000000 = 1.0)
   - ✅ 使用 2位精度 (100 = 1.0)

---

## 相关文档

- [ORDER_CALCULATION_GUIDE.md](./ORDER_CALCULATION_GUIDE.md) - 订单计算详细指南
- [ORDERBOOK_INTEGRATION.md](./ORDERBOOK_INTEGRATION.md) - 订单簿集成指南
- [API_ENDPOINTS_REFERENCE.md](./API_ENDPOINTS_REFERENCE.md) - 完整 API 文档

---

## 测试检查清单

### 下单测试
- [ ] 50 USDC @ 0.5 → 应该冻结 50 USDC，获得 100 份额
- [ ] 10 USDC @ 0.6 → 应该冻结 10 USDC，获得 16.67 份额
- [ ] 100 USDC @ 0.45 → 应该冻结 100 USDC，获得 222.22 份额

### 订单簿测试
- [ ] 切换市场时自动加载订单簿
- [ ] 订单簿每5秒自动刷新
- [ ] 市场不存在时返回空订单簿，不报错
- [ ] YES 和 NO 订单簿同时显示

### API 测试
```bash
# 测试订单簿 API
curl "http://your-gateway/v1/markets/1901763197500/depth?levels=20" \
  -H "X-User-ID: user123"

# 测试下单 API
curl -X POST "http://your-gateway/v1/market/orders" \
  -H "X-User-ID: user123" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-order-123456" \
  -d '{
    "client_order_id": "test-order-123456",
    "market_id": "1901763197500",
    "side": "BUY",
    "direction": "YES",
    "type": "LIMIT",
    "price": "0.5",
    "amount": "100"
  }'
```

---

**最后更新**: 2025-11-15
**版本**: v2.0

