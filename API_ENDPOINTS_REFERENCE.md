# Socrates Gateway API 接口文档

> **完整的 API 接口参考手册**
> 
> **基础URL**: `http://localhost:8080` (开发环境)
> 
> **认证方式**: 
> - 开发环境: `X-User-ID` Header
> - 生产环境: `Authorization: Bearer <JWT_TOKEN>`

---

## 📑 目录

1. [健康检查](#1-健康检查)
2. [市场订单接口](#2-市场订单接口-预测市场)
3. [市场数据接口](#3-市场数据接口)
4. [用户持仓与结算](#4-用户持仓与结算)
5. [订单查询接口](#5-订单查询接口)
6. [交易查询接口](#6-交易查询接口)
7. [用户记录查询](#7-用户记录查询)
8. [余额查询](#8-余额查询)
9. [费用统计接口](#9-费用统计接口)
10. [代理接口](#10-代理接口-zkwasm)
11. [监控接口](#11-监控接口)

---

## 1. 健康检查

### 1.1 健康检查
```http
GET /health
```

**说明**: 检查服务健康状态

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T12:34:56Z",
  "uptime": 123.45
}
```

### 1.2 就绪检查
```http
GET /ready
```

**说明**: 检查服务是否就绪接受请求

---

## 2. 市场订单接口 (预测市场)

### 2.1 创建市场订单 ⭐
```http
POST /v1/market/orders
Headers:
  X-User-ID: user123
  Content-Type: application/json
  Idempotency-Key: unique-order-id-12345
```

**请求体**:
```json
{
  "client_order_id": "unique-order-id-12345",
  "market_id": "1901763148000",
  "direction": "YES",
  "side": "BUY",
  "type": "LIMIT",
  "price": "0.54",
  "amount": "10"
}
```

**参数说明**:
- `client_order_id` (可选): 客户端订单ID，用于幂等性控制
- `market_id` (必填): 市场ID
- `direction` (必填): `YES` 或 `NO`
- `side` (必填): `BUY` (买入) 或 `SELL` (卖出)
- `type` (必填): `LIMIT` (限价单) 或 `MARKET` (市价单)
- `price` (限价单必填): 价格，范围 0-1（小数字符串，如 "0.54"）
- `amount` (必填): 份额数量（小数字符串，如 "10" 表示10份额）

**交易逻辑**:
- **BUY YES @ 0.54, 数量 10**: 冻结 5.4 USDC，成交后获得 10 个 YES 份额
- **SELL YES @ 0.54, 数量 10**: 冻结 10 个 YES 份额，成交后获得 5.4 USDC
- **BUY NO @ 0.46, 数量 10**: 冻结 4.6 USDC，成交后获得 10 个 NO 份额
- **SELL NO @ 0.46, 数量 10**: 冻结 10 个 NO 份额，成交后获得 4.6 USDC

**响应示例**:
```json
{
  "code": 0,
  "message": "Order created successfully",
  "data": {
    "order_id": "ord_1234567890",
    "client_order_id": "unique-order-id-12345",
    "market_id": "1901763148000",
    "direction": "YES",
    "side": "BUY",
    "type": "LIMIT",
    "price": "0.54",
    "amount": "10",
    "status": "OPEN",
    "created_at": "2025-11-15T12:34:56Z"
  }
}
```

**错误码**:
- `-1`: 余额不足
- `-2`: 无效参数
- `-3`: 市场不可交易

---

## 3. 市场数据接口

### 3.1 获取活跃市场列表
```http
GET /v1/markets/active
Headers:
  X-User-ID: user123
```

**响应示例**:
```json
{
  "code": 0,
  "count": 5,
  "data": [
    {
      "market_id": "1901763148000",
      "description": "BTC价格预测",
      "status": "TRADING",
      "created_at": "2025-11-15T10:00:00Z",
      "expires_at": "2025-11-16T10:00:00Z"
    }
  ]
}
```

### 3.2 获取市场信息
```http
GET /v1/markets/:market_id
Headers:
  X-User-ID: user123
```

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "market_id": "1901763148000",
    "description": "BTC价格预测",
    "status": "TRADING",
    "total_volume": "125000.50",
    "yes_price": "0.54",
    "no_price": "0.46",
    "created_at": "2025-11-15T10:00:00Z",
    "expires_at": "2025-11-16T10:00:00Z"
  }
}
```

### 3.3 获取订单簿深度
```http
GET /v1/markets/:market_id/depth?levels=20
Headers:
  X-User-ID: user123
```

**说明**: 一次请求返回该市场的 YES 和 NO 两个子市场的订单簿数据

**参数**:
- `market_id`: 市场ID（不带 -YES/-NO 后缀），例如 `1901763197500`
- `levels` (可选): 深度层数，默认10，最大50

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

### 3.4 获取最佳买卖价 (Ticker)
```http
GET /v1/markets/:market_id/ticker
Headers:
  X-User-ID: user123
```

**响应示例**:
```json
{
  "code": 0,
  "market_id": "1901763148000-YES",
  "best_bid": "0.54",
  "best_ask": "0.55",
  "spread": "0.01",
  "mid_price": "0.545"
}
```

### 3.5 获取单个市场统计
```http
GET /v1/markets/:market_id/stats
Headers:
  X-User-ID: user123
```

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "market_id": "1901763148000",
    "total_orders": 1250,
    "active_orders": 85,
    "total_trades": 628,
    "total_volume": "125000.50",
    "volume_24h": "8500.25",
    "trades_24h": 42,
    "last_trade_price": "0.54",
    "last_trade_time": "2025-11-15T10:30:00Z",
    "high_price_24h": "0.56",
    "low_price_24h": "0.52"
  }
}
```

### 3.6 获取所有市场统计
```http
GET /v1/markets/stats
Headers:
  X-User-ID: user123
```

**响应示例**:
```json
{
  "code": 0,
  "count": 3,
  "data": [
    {
      "market_id": "1901763148000",
      "total_orders": 1250,
      "total_volume": "125000.50",
      "volume_24h": "8500.25",
      "trades_24h": 42
    },
    {
      "market_id": "1901763148001",
      "total_orders": 890,
      "total_volume": "98000.30",
      "volume_24h": "6200.15",
      "trades_24h": 35
    }
  ]
}
```

---

## 4. 用户持仓与结算

### 4.1 获取用户持仓
```http
GET /v1/users/:user_id/positions
Headers:
  X-User-ID: user123
```

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "positions": [
      {
        "market_id": "1901763148000",
        "yes_shares": "100",
        "no_shares": "50",
        "yes_frozen": "10",
        "no_frozen": "5",
        "avg_yes_price": "0.54",
        "avg_no_price": "0.46",
        "unrealized_pnl": "25.50"
      }
    ]
  }
}
```

### 4.2 获取用户结算信息
```http
GET /v1/users/:user_id/markets/:market_id/settlement
Headers:
  X-User-ID: user123
```

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "market_id": "1901763148000",
    "user_id": "user123",
    "yes_shares": "100",
    "no_shares": "50",
    "winning_outcome": "YES",
    "settlement_amount": "100.00",
    "settled": true,
    "settled_at": "2025-11-16T10:00:00Z"
  }
}
```

### 4.3 获取市场结算状态
```http
GET /v1/markets/:market_id/settlement/status
Headers:
  X-User-ID: user123
```

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "market_id": "1901763148000",
    "status": "SETTLED",
    "winning_outcome": "YES",
    "total_settled_users": 1250,
    "total_settlement_amount": "125000.00",
    "settled_at": "2025-11-16T10:00:00Z"
  }
}
```

---

## 5. 订单查询接口

### 5.1 查询订单列表
```http
GET /v1/orders?symbol=BTC-USDT&status=OPEN&limit=20&offset=0
Headers:
  X-User-ID: user123
```

**参数**:
- `symbol` (可选): 交易对过滤
- `status` (可选): 订单状态 (`OPEN`, `FILLED`, `CANCELLED`, `PARTIALLY_FILLED`)
- `limit` (可选): 分页大小，默认20，最大100
- `offset` (可选): 分页偏移，默认0

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "orders": [
      {
        "order_id": "ord_123",
        "symbol": "1901763148000-YES",
        "side": "BUY",
        "type": "LIMIT",
        "price": "0.54",
        "amount": "10",
        "filled_amount": "5",
        "status": "PARTIALLY_FILLED",
        "created_at": "2025-11-15T12:34:56Z",
        "updated_at": "2025-11-15T12:35:00Z"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

### 5.2 查询单个订单
```http
GET /v1/orders/:order_id
Headers:
  X-User-ID: user123
```

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "order_id": "ord_123",
    "user_id": "user123",
    "symbol": "1901763148000-YES",
    "side": "BUY",
    "type": "LIMIT",
    "price": "0.54",
    "amount": "10",
    "filled_amount": "5",
    "status": "PARTIALLY_FILLED",
    "created_at": "2025-11-15T12:34:56Z",
    "updated_at": "2025-11-15T12:35:00Z"
  }
}
```

### 5.3 取消订单
```http
DELETE /v1/orders/:order_id
Headers:
  X-User-ID: user123
```

**响应示例**:
```json
{
  "code": 0,
  "message": "Order cancelled successfully",
  "data": {
    "order_id": "ord_123",
    "status": "CANCELLED"
  }
}
```

---

## 6. 交易查询接口

### 6.1 查询交易列表
```http
GET /v1/trades?symbol=BTC-USDT&limit=20&offset=0
Headers:
  X-User-ID: user123
```

**参数**:
- `symbol` (可选): 交易对过滤
- `limit` (可选): 分页大小，默认20，最大100
- `offset` (可选): 分页偏移，默认0

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "trades": [
      {
        "trade_id": "trd_456",
        "order_id": "ord_123",
        "symbol": "1901763148000-YES",
        "side": "BUY",
        "price": "0.54",
        "amount": "5",
        "role": "TAKER",
        "fee": "0.027",
        "created_at": "2025-11-15T12:35:00Z"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

### 6.2 查询单个交易
```http
GET /v1/trades/:trade_id
Headers:
  X-User-ID: user123
```

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "trade_id": "trd_456",
    "order_id": "ord_123",
    "user_id": "user123",
    "symbol": "1901763148000-YES",
    "side": "BUY",
    "price": "0.54",
    "amount": "5",
    "role": "TAKER",
    "fee": "0.027",
    "created_at": "2025-11-15T12:35:00Z"
  }
}
```

---

## 7. 用户记录查询

### 7.1 查询用户交易记录
```http
GET /v1/users/:user_id/trades?limit=20&offset=0
Headers:
  X-User-ID: user123
```

**响应示例**: 同 6.1

### 7.2 查询用户订单记录
```http
GET /v1/users/:user_id/orders?limit=20&offset=0
Headers:
  X-User-ID: user123
```

**响应示例**: 同 5.1

### 7.3 查询用户账本记录
```http
GET /v1/users/:user_id/ledger-records?limit=20&offset=0
Headers:
  X-User-ID: user123
```

**说明**: 查询充值/提现记录

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "records": [
      {
        "record_id": "rec_789",
        "user_id": "user123",
        "type": "DEPOSIT",
        "currency": "USDC",
        "amount": "1000.00",
        "status": "COMPLETED",
        "created_at": "2025-11-15T10:00:00Z"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

### 7.4 查询用户结算记录
```http
GET /v1/users/:user_id/settlement-records?limit=20&offset=0
Headers:
  X-User-ID: user123
```

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "records": [
      {
        "settlement_id": "stl_101",
        "market_id": "1901763148000",
        "user_id": "user123",
        "winning_outcome": "YES",
        "shares": "100",
        "settlement_amount": "100.00",
        "settled_at": "2025-11-16T10:00:00Z"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

---

## 8. 余额查询

### 8.1 查询余额
```http
GET /v1/balance?currency=USDC
Headers:
  X-User-ID: user123
```

**参数**:
- `currency` (必填): 币种，如 `USDC`

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "user_id": "user123",
    "currency": "USDC",
    "available": "10000.00",
    "frozen": "500.00",
    "total": "10500.00",
    "version": 42,
    "updated_at": "2025-11-15T12:34:56Z"
  }
}
```

**说明**: 
- `available`: 可用余额
- `frozen`: 冻结余额（未成交订单锁定的资金）
- `total`: 总余额 = available + frozen

---

## 9. 费用统计接口

### 9.1 获取平台费用账户余额
```http
GET /v1/fees/platform/balance
Headers:
  X-User-ID: admin
```

**响应示例**:
```json
{
  "code": 0,
  "available": "5000.50",
  "frozen": "0",
  "total": "5000.50",
  "currency": "USDC"
}
```

### 9.2 获取总费用统计
```http
GET /v1/fees/total
Headers:
  X-User-ID: admin
```

**响应示例**:
```json
{
  "code": 0,
  "total_fees": "5000.50",
  "trade_fees": "4500.30",
  "settlement_fees": "500.20",
  "fee_count": 1250,
  "trade_fee_count": 1100,
  "settlement_count": 150
}
```

### 9.3 按日期范围查询费用
```http
GET /v1/fees/range?start_date=2025-01-01&end_date=2025-01-31
Headers:
  X-User-ID: admin
```

**参数**:
- `start_date` (必填): 开始日期，格式 YYYY-MM-DD
- `end_date` (必填): 结束日期，格式 YYYY-MM-DD

**响应示例**:
```json
{
  "code": 0,
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "total_fees": "5000.50",
  "trade_fees": "4500.30",
  "settlement_fees": "500.20",
  "fee_count": 1250
}
```

### 9.4 查询今日费用
```http
GET /v1/fees/daily
Headers:
  X-User-ID: admin
```

**响应示例**:
```json
{
  "code": 0,
  "date": "2025-11-15",
  "total_fees": "150.50",
  "trade_fees": "135.30",
  "settlement_fees": "15.20",
  "fee_count": 42
}
```

### 9.5 查询费用贡献排行榜
```http
GET /v1/fees/top-contributors?limit=10
Headers:
  X-User-ID: admin
```

**参数**:
- `limit` (可选): 返回数量，默认10

**响应示例**:
```json
{
  "code": 0,
  "data": [
    {
      "user_id": "user123",
      "total_fees": "500.50",
      "trade_fees": "450.30",
      "settlement_fees": "50.20",
      "rank": 1
    }
  ]
}
```

### 9.6 查询用户费用
```http
GET /v1/fees/user/:user_id
Headers:
  X-User-ID: admin
```

**响应示例**:
```json
{
  "code": 0,
  "user_id": "user123",
  "total_fees": "500.50",
  "trade_fees": "450.30",
  "settlement_fees": "50.20",
  "fee_count": 125
}
```

### 9.7 查询市场费用
```http
GET /v1/fees/market/:market_id
Headers:
  X-User-ID: admin
```

**响应示例**:
```json
{
  "code": 0,
  "market_id": "1901763148000",
  "total_fees": "1250.50",
  "trade_fees": "1125.30",
  "settlement_fees": "125.20",
  "fee_count": 628
}
```

---

## 10. 代理接口 (zkWASM)

### 10.1 查询玩家余额
```http
GET /v1/data/player/:pid1/:pid2/balance
Headers:
  X-User-ID: user123
```

**说明**: 透明代理到 prediction-mkt 服务

### 10.2 查询玩家充值记录
```http
GET /v1/data/player/:pid1/:pid2/deposits
Headers:
  X-User-ID: user123
```

### 10.3 查询玩家提现记录
```http
GET /v1/data/player/:pid1/:pid2/withdrawals
Headers:
  X-User-ID: user123
```

### 10.4 查询玩家 SOC 提现记录
```http
GET /v1/data/player/:pid1/:pid2/withdrawals-soc
Headers:
  X-User-ID: user123
```

### 10.5 查询玩家余额更新记录
```http
GET /v1/data/player/:pid1/:pid2/balance-updates
Headers:
  X-User-ID: user123
```

### 10.6 查询所有玩家列表
```http
GET /v1/data/players
Headers:
  X-User-ID: user123
```

### 10.7 查询全局充值记录
```http
GET /v1/data/deposits
Headers:
  X-User-ID: user123
```

### 10.8 查询全局提现记录
```http
GET /v1/data/withdrawals
Headers:
  X-User-ID: user123
```

### 10.9 查询全局 SOC 提现记录
```http
GET /v1/data/withdrawals-soc
Headers:
  X-User-ID: user123
```

### 10.10 查询系统事件
```http
GET /v1/data/system-events
Headers:
  X-User-ID: user123
```

---

## 11. 监控接口

### 11.1 查询分片统计
```http
GET /v1/stats/shards
Headers:
  X-User-ID: user123
```

**说明**: 查看影子账本分片状态（调试用）

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "total_shards": 16,
    "shards": [
      {
        "id": 0,
        "queue_size": 0,
        "processed": 12345
      },
      {
        "id": 1,
        "queue_size": 2,
        "processed": 11234
      }
    ]
  }
}
```

---

## 📝 通用说明

### 认证方式

**开发环境** (Auth.Enabled = false):
```bash
curl -H "X-User-ID: user123" http://localhost:8080/v1/balance?currency=USDC
```

**生产环境** (Auth.Enabled = true):
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." http://localhost:8080/v1/balance?currency=USDC
```

### 幂等性

所有写操作（POST/PUT/DELETE）支持幂等性：

```bash
curl -X POST http://localhost:8080/v1/market/orders \
  -H "X-User-ID: user123" \
  -H "Idempotency-Key: unique-key-12345" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**说明**:
- 相同的 `Idempotency-Key` 在 24 小时内只会执行一次
- 重复请求直接返回缓存的响应

### 错误响应格式

```json
{
  "code": -1,
  "message": "错误描述",
  "details": "详细错误信息（可选）"
}
```

**常见错误码**:
- `0`: 成功
- `-1`: 通用错误
- `-400`: 请求参数错误
- `-401`: 未认证
- `-403`: 无权限
- `-404`: 资源不存在
- `-500`: 服务器内部错误

### 限流

系统实施多级限流：

- **用户级**: 100 req/s
- **全局级**: 50k req/s
- **IP级**: 1000 req/s

超过限流会返回：
```json
{
  "code": -429,
  "message": "Rate limit exceeded"
}
```

### 分页

所有列表查询支持分页：

```http
GET /v1/orders?limit=20&offset=0
```

- `limit`: 每页数量，默认20，最大100
- `offset`: 偏移量，默认0

---

## 🚀 快速开始示例

### 1. 完整交易流程

```bash
# 1. 查询余额
curl -H "X-User-ID: user123" \
  "http://localhost:8080/v1/balance?currency=USDC"

# 2. 创建限价买单
curl -X POST http://localhost:8080/v1/market/orders \
  -H "X-User-ID: user123" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: order-$(date +%s)" \
  -d '{
    "market_id": "1901763148000",
    "outcome": "YES",
    "side": "BUY",
    "type": "LIMIT",
    "price": "0.54",
    "amount": "10"
  }'

# 3. 查询订单状态
curl -H "X-User-ID: user123" \
  "http://localhost:8080/v1/orders?limit=10"

# 4. 查询持仓
curl -H "X-User-ID: user123" \
  "http://localhost:8080/v1/users/user123/positions"

# 5. 查看市场深度
curl -H "X-User-ID: user123" \
  "http://localhost:8080/v1/markets/1901763148000-YES/depth?levels=10"
```

### 2. 市场数据查询

```bash
# 查看所有活跃市场
curl -H "X-User-ID: user123" \
  "http://localhost:8080/v1/markets/active"

# 查看市场统计
curl -H "X-User-ID: user123" \
  "http://localhost:8080/v1/markets/stats"

# 查看最佳买卖价
curl -H "X-User-ID: user123" \
  "http://localhost:8080/v1/markets/1901763148000-YES/ticker"
```

---

## 📊 性能指标

| 接口类型 | P99 延迟 | 吞吐量 |
|---------|---------|--------|
| 下单 API | < 20ms | 10k TPS |
| 查询 API | < 10ms | 50k QPS |
| 市场数据 | < 5ms | 100k QPS |
| 余额查询 | < 2ms | 100k QPS |

---

## 📞 技术支持

- **文档**: 查看项目根目录下的 Markdown 文档
- **Issues**: https://github.com/zkwasm/socrates-gateway/issues

---

**最后更新**: 2025-11-15
**API 版本**: v1
**Gateway 版本**: v0.5.0

