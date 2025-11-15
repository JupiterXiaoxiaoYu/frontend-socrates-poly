# 订单簿集成说明

## 概述

订单簿 API 已集成到前端，支持实时查询市场的买卖盘深度数据。

---

## API 端点

### Gateway API

```
GET /v1/markets/:market_id/depth?levels=20
```

**市场ID格式**: 纯市场ID（不带 -YES/-NO 后缀）
- 例如: `1901763197500`

**参数**:
- `levels`: 深度层数，默认10，最大50

**响应示例**:
```json
{
  "code": 0,
  "market_id": "1901763197500",
  "levels": 20,
  "yes": {
    "bids": [
      {"price": "0.54", "quantity": "1000"},
      {"price": "0.53", "quantity": "500"}
    ],
    "asks": [
      {"price": "0.55", "quantity": "800"},
      {"price": "0.56", "quantity": "600"}
    ],
    "timestamp": 1763198380688
  },
  "no": {
    "bids": [
      {"price": "0.46", "quantity": "800"},
      {"price": "0.45", "quantity": "600"}
    ],
    "asks": [
      {"price": "0.47", "quantity": "1000"},
      {"price": "0.48", "quantity": "500"}
    ],
    "timestamp": 1763198380688
  }
}
```

**说明**: 一次请求同时返回 YES 和 NO 两个子市场的订单簿数据

---

## 前端集成

### 1. 数据类型

```typescript
export interface OrderBookData {
  marketId: string;
  direction: "YES" | "NO";
  bids: Array<{ price: string; quantity: string }>;
  asks: Array<{ price: string; quantity: string }>;
  timestamp: number;
}
```

### 2. Context 提供的数据和方法

```typescript
import { useMarket } from "@/contexts/MarketContext";

function MyComponent() {
  const { 
    orderBooks,      // Map<string, OrderBookData> - 缓存的订单簿数据
    getOrderBook     // (marketId: string, direction: "YES" | "NO") => Promise<OrderBookData>
  } = useMarket();
  
  // 使用方法...
}
```

### 3. 使用订单簿数据

#### 方式 1: 从缓存读取（推荐）

```typescript
import { useMarket } from "@/contexts/MarketContext";

function OrderBookDisplay() {
  const { orderBooks, currentMarket } = useMarket();
  
  if (!currentMarket) return null;
  
  // 从缓存中获取订单簿
  const yesOrderBook = orderBooks.get(`${currentMarket.marketId}-YES`);
  const noOrderBook = orderBooks.get(`${currentMarket.marketId}-NO`);
  
  return (
    <div>
      <h3>YES 订单簿</h3>
      <div>
        <h4>买盘 (Bids)</h4>
        {yesOrderBook?.bids.map((bid, i) => (
          <div key={i}>
            价格: {bid.price} | 数量: {bid.quantity}
          </div>
        ))}
      </div>
      <div>
        <h4>卖盘 (Asks)</h4>
        {yesOrderBook?.asks.map((ask, i) => (
          <div key={i}>
            价格: {ask.price} | 数量: {ask.quantity}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 方式 2: 手动刷新

```typescript
import { useMarket } from "@/contexts/MarketContext";
import { useEffect, useState } from "react";

function OrderBookDisplay() {
  const { getOrderBook } = useMarket();
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  
  useEffect(() => {
    const loadOrderBook = async () => {
      // getOrderBook 会一次性获取 YES 和 NO，并缓存到 orderBooks
      const data = await getOrderBook("1901763197500", "YES");
      setOrderBook(data);
    };
    
    loadOrderBook();
    
    // 每5秒刷新一次
    const interval = setInterval(loadOrderBook, 5000);
    return () => clearInterval(interval);
  }, []);
  
  if (!orderBook) return <div>Loading...</div>;
  
  return (
    <div>
      <h3>订单簿</h3>
      <p>最后更新: {new Date(orderBook.timestamp).toLocaleTimeString()}</p>
      {/* 渲染订单簿 */}
    </div>
  );
}
```

---

## 自动轮询机制

订单簿数据会在以下情况自动刷新：

1. **切换市场时**: 立即加载新市场的订单簿
2. **定时轮询**: 每5秒自动刷新当前市场的订单簿
3. **下单后**: 下单成功后会触发数据刷新

### 轮询逻辑

```typescript
// 在 MarketContext.tsx 中
useEffect(() => {
  // 立即加载
  loadInitialData();
  
  // 每5秒轮询
  const interval = setInterval(() => {
    refreshData(); // 包含订单簿刷新
  }, 5000);
  
  return () => clearInterval(interval);
}, [currentMarketId]);
```

---

## 错误处理

### 订单簿不存在

当市场没有订单簿数据时，API 会返回空数据而不是抛出错误：

```typescript
{
  market_id: "1901763197200-YES",
  timestamp: Date.now(),
  bids: [],
  asks: [],
  levels: 0
}
```

### 常见错误

#### 1. 市场ID格式错误

❌ 错误: `1601763197200` (开头是16，或者带了 -YES/-NO 后缀)
✅ 正确: `1901763197500` (开头是19，不带后缀)

**注意**: 新版 API 不需要在市场ID后面加 `-YES` 或 `-NO`，一次请求返回两个子市场

#### 2. 市场不存在

如果市场ID不存在，会返回空订单簿，不会抛出错误。

#### 3. 网络错误

网络错误会被捕获并返回空订单簿，同时在控制台输出警告。

---

## 完整示例：订单簿组件

```typescript
import { useMarket } from "@/contexts/MarketContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OrderBookPanel() {
  const { orderBooks, currentMarket } = useMarket();
  
  if (!currentMarket) {
    return <div>请选择一个市场</div>;
  }
  
  const yesBook = orderBooks.get(`${currentMarket.marketId}-YES`);
  const noBook = orderBooks.get(`${currentMarket.marketId}-NO`);
  
  const renderOrderBook = (
    book: OrderBookData | undefined, 
    title: string
  ) => {
    if (!book || (book.bids.length === 0 && book.asks.length === 0)) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">暂无订单</p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-xs text-muted-foreground">
            更新时间: {new Date(book.timestamp).toLocaleTimeString()}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* 买盘 */}
            <div>
              <h4 className="font-semibold text-sm mb-2 text-green-600">
                买盘 (Bids)
              </h4>
              <div className="space-y-1">
                {book.bids.slice(0, 10).map((bid, i) => (
                  <div 
                    key={i} 
                    className="flex justify-between text-sm"
                  >
                    <span className="text-green-600">{bid.price}</span>
                    <span className="text-muted-foreground">
                      {parseFloat(bid.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                {book.bids.length === 0 && (
                  <p className="text-xs text-muted-foreground">无买单</p>
                )}
              </div>
            </div>
            
            {/* 卖盘 */}
            <div>
              <h4 className="font-semibold text-sm mb-2 text-red-600">
                卖盘 (Asks)
              </h4>
              <div className="space-y-1">
                {book.asks.slice(0, 10).map((ask, i) => (
                  <div 
                    key={i} 
                    className="flex justify-between text-sm"
                  >
                    <span className="text-red-600">{ask.price}</span>
                    <span className="text-muted-foreground">
                      {parseFloat(ask.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                {book.asks.length === 0 && (
                  <p className="text-xs text-muted-foreground">无卖单</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderOrderBook(yesBook, "YES 订单簿")}
      {renderOrderBook(noBook, "NO 订单簿")}
    </div>
  );
}
```

---

## 性能优化建议

### 1. 使用 useMemo 缓存计算

```typescript
const bestBid = useMemo(() => {
  const book = orderBooks.get(`${marketId}-YES`);
  return book?.bids[0]?.price || "0";
}, [orderBooks, marketId]);
```

### 2. 限制渲染深度

只渲染前10-20档订单，避免渲染过多数据：

```typescript
{book.bids.slice(0, 10).map(...)}
```

### 3. 防抖处理

如果需要手动刷新，使用防抖避免频繁请求：

```typescript
import { debounce } from "lodash";

const debouncedRefresh = useMemo(
  () => debounce(() => getOrderBook(marketId, "YES"), 1000),
  [marketId]
);
```

---

## 调试

### 查看订单簿数据

在浏览器控制台：

```javascript
// 查看所有订单簿
console.log(Array.from(orderBooks.entries()));

// 查看特定市场的订单簿
console.log(orderBooks.get("1901763197200-YES"));
```

### 检查 API 请求

打开浏览器开发者工具 → Network 标签，筛选 `depth` 查看请求：

- URL 格式是否正确
- 响应状态码
- 响应数据结构

---

## 常见问题

### Q: 为什么订单簿是空的？

A: 可能原因：
1. 市场刚创建，还没有订单
2. 市场ID格式错误
3. 后端订单簿服务未启动
4. 网络连接问题

### Q: 订单簿更新频率是多少？

A: 默认每5秒自动刷新一次。可以在 `MarketContext.tsx` 中修改轮询间隔。

### Q: 如何获取最佳买卖价？

A: 使用 `getTicker` API：

```typescript
const ticker = await apiClient.getTicker(marketId, "YES");
console.log("最佳买价:", ticker.best_bid);
console.log("最佳卖价:", ticker.best_ask);
console.log("价差:", ticker.spread);
```

---

## 更新日志

- **2025-11-15**: 初始版本，添加订单簿 API 集成
- **2025-11-15**: 改进错误处理，订单簿不存在时返回空数据而不是抛出错误

---

## 相关文档

- [API_ENDPOINTS_REFERENCE.md](./API_ENDPOINTS_REFERENCE.md) - 完整 API 文档
- [ORDER_CALCULATION_GUIDE.md](./ORDER_CALCULATION_GUIDE.md) - 订单计算指南

