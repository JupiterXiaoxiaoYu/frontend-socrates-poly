# BTC Prediction Market - API 集成指南

> 基于 Socrates Prediction Market 后端系统的完整前端集成文档
> 
> 更新时间: 2025-01-01

---

## 目录

1. [系统架构](#系统架构)
2. [核心概念](#核心概念)
3. [API 端点总览](#api-端点总览)
4. [前端数据模型](#前端数据模型)
5. [交易流程](#交易流程)
6. [REST API 详细说明](#rest-api-详细说明)
7. [WebSocket 实时事件](#websocket-实时事件)
8. [前端页面数据需求](#前端页面数据需求)
9. [代码示例](#代码示例)
10. [错误处理](#错误处理)

---

## 系统架构

### 技术栈

**后端 (zkWASM)**
- Rust 智能合约
- zkWASM 虚拟机执行
- MongoDB 事件持久化
- REST API + WebSocket 事件流

**前端集成点**
- zkwasm-minirollup-rpc: 交易发送
- REST API: 数据查询
- WebSocket: 实时事件监听

### 架构图

```
┌─────────────────┐
│   前端 React    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────────┐
│ REST  │ │ WebSocket │
│  API  │ │  Events   │
└───┬───┘ └──┬────────┘
    │        │
┌───▼────────▼───┐
│  zkWASM RPC    │
│  (Port 3000)   │
└───────┬────────┘
        │
┌───────▼────────┐
│   智能合约     │
│  (Rust/WASM)  │
└───────┬────────┘
        │
┌───────▼────────┐
│    MongoDB     │
│  事件持久化    │
└────────────────┘
```

---

## 核心概念

### 1. 统一市场 (Unified Market)

**设计原则**: 一个市场 ID 同时管理 UP/DOWN 两个子市场

```typescript
interface UnifiedMarket {
  marketId: bigint;          // 统一市场ID
  upMarket: SubMarket;      // 看涨子市场
  downMarket: SubMarket;    // 看跌子市场
  oracleStartPrice: bigint; // 起始价格
  oracleEndPrice: bigint;   // 结束价格（解析后）
  winningOutcome: 'UP' | 'DOWN' | 'TIE';
}
```

### 2. 成交即铸造 (Mint on Match)

- **下单**: 锁定 USDC
- **成交**: 铸造份额
- **买方**: 获得所购方向份额（UP 或 DOWN）
- **卖方**: 获得相反方向份额

### 3. 市场状态

```typescript
enum MarketStatus {
  Pending = 0,   // 等待启动 (未到 startTick)
  Active = 1,    // 交易中 (startTick ~ endTick)
  Closed = 3,    // 已关闭 (等待 Oracle 解析)
  Resolved = 2,  // 已解析 (可 claim 收益)
}
```

### 4. 订单类型

```typescript
enum OrderType {
  LIMIT_BUY = 0,   // 限价买单：锁定 price × amount USDC
  LIMIT_SELL = 1,  // 限价卖单：锁定 (1-price) × amount USDC
  MARKET_BUY = 2,  // 市价买单：锁定 amount USDC
  MARKET_SELL = 3, // 市价卖单：锁定 amount USDC
}
```

### 5. 时间系统

- **Tick**: 5 秒 = 1 tick
- **Counter**: 全局时间计数器（每 5 秒 +1）
- **市场窗口**: 12 ticks (1分钟) / 36 ticks (3分钟) / 60 ticks (5分钟)
- **Grace Period**: 市场结束后 12 ticks (1分钟) 内必须解析

---

## API 端点总览

### zkWASM RPC Base URL
```
生产环境: https://rpc.btcprediction.zkwasm.ai
开发环境: http://localhost:3000
```

### REST API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/data/markets` | GET | 获取所有市场列表 |
| `/data/market/:marketId` | GET | 获取单个市场详情 |
| `/data/market/:marketId/orders` | GET | 获取市场订单列表 |
| `/data/market/:marketId/trades` | GET | 获取市场成交记录 |
| `/data/market/:marketId/trade-history` | GET | 获取市场成交历史（带时间戳） |
| `/data/player/:pid1/:pid2/positions` | GET | 获取玩家持仓 |
| `/data/player/:pid1/:pid2/deposits` | GET | 获取充值记录 |
| `/data/player/:pid1/:pid2/withdrawals` | GET | 获取提现记录 |
| `/data/player/:pid1/:pid2/claims` | GET | 获取 Claim 记录 |
| `/data/player/:pid1/:pid2/financial-activity` | GET | 获取所有财务活动 |
| `/data/state` | GET | 获取全局状态 |

### 命令（通过 zkWASM RPC 发送）

| 命令 | CMD 值 | 参数 | 说明 |
|------|--------|------|------|
| TICK | 0 | - | 推进时间（仅 Admin） |
| REGISTER | 1 | - | 注册玩家 |
| DEPOSIT | 2 | targetPid, amount | 充值（仅 Admin） |
| WITHDRAW | 3 | amount | 提现 |
| PLACE_ORDER | 4 | marketId, direction, orderType, price, amount | 下单 |
| CANCEL_ORDER | 5 | orderId | 撤单 |
| CLAIM | 6 | marketId | 提取收益 |
| CREATE_MARKET | 7 | assetId, startTick, endTick, oracleStartTime, oracleStartPrice | 创建市场（仅 Admin） |
| CLOSE_MARKET | 8 | marketId | 关闭市场（仅 Admin） |
| EXECUTE_TRADE | 9 | buyOrderId, sellOrderId, price, amount | 撮合交易（仅 Admin） |
| RESOLVE_MARKET | 10 | marketId, oracleEndTime, oracleEndPrice | 解析市场（仅 Admin） |
| SET_FEE_EXEMPT | 11 | targetPid, enabled | 设置费用豁免（仅 Admin） |

---

## 前端数据模型

### 1. Market (市场)

```typescript
interface Market {
  // 基础信息
  marketId: string;
  assetId: string;           // 1=BTC, 2=ETH
  status: MarketStatus;      // 0=Pending, 1=Active, 2=Resolved, 3=Closed
  
  // 时间相关
  startTick: string;         // 启动时间（tick）
  endTick: string;           // 结束时间（tick）
  windowTicks: string;       // 窗口长度（tick）
  windowMinutes: number;     // 窗口长度（分钟）1/3/5
  
  // Oracle 数据
  oracleStartTime: string;   // 起始时间戳（秒）
  oracleStartPrice: string;  // 起始价格（精度：小数点后2位）
  oracleEndTime: string;     // 结束时间戳（秒）
  oracleEndPrice: string;    // 结束价格
  
  // 结果
  winningOutcome: number;    // 0=DOWN, 1=UP, 2=TIE
  
  // 子市场数据
  upMarket: {
    orders: string[];        // 订单ID列表
    volume: string;          // 成交量
    lastOrderId: string;     // 最后订单ID
  };
  downMarket: {
    orders: string[];
    volume: string;
    lastOrderId: string;
  };
  
  // 计算字段（前端生成）
  isClosed: boolean;         // status === 3
  isResolved: boolean;       // status === 2
  timeRemaining?: number;    // 剩余秒数
  currentPrice?: number;     // 当前 Oracle 价格（实时）
}
```

### 2. Order (订单)

```typescript
interface Order {
  orderId: string;
  pid1: string;              // 玩家ID第一部分
  pid2: string;              // 玩家ID第二部分
  marketId: string;
  direction: number;         // 0=DOWN, 1=UP
  orderType: number;         // 0=LIMIT_BUY, 1=LIMIT_SELL, 2=MARKET_BUY, 3=MARKET_SELL
  status: number;            // 0=ACTIVE, 1=FILLED, 2=CANCELLED
  price: string;             // BPS 格式（0-10000）
  totalAmount: string;       // 总数量
  filledAmount: string;      // 已成交数量
  lockedAmount: string;      // 锁定 USDC 数量
  createTick: string;        // 创建时间（tick）
  updatedAt: Date;           // 更新时间
}
```

### 3. Trade (成交)

```typescript
interface Trade {
  tradeId: string;
  marketId: string;
  direction: number;         // 0=DOWN, 1=UP（成交发生的子市场）
  buyOrderId: string;
  sellOrderId: string;
  price: string;             // 成交价格（BPS）
  amount: string;            // 成交数量
  tick: string;              // 成交时间（tick）
  createdAt: Date;
}
```

### 4. Position (持仓)

```typescript
interface Position {
  pid1: string;
  pid2: string;
  tokenIdx: string;          // 0=USDC, 1=Market1-UP, 2=Market1-DOWN, ...
  balance: string;           // 可用余额
  lockBalance: string;       // 锁定余额
}
```

### 5. 财务事件

```typescript
// 充值事件
interface DepositEvent {
  pid: [string, string];
  amount: string;
  nonce: string;
  callerPid: [string, string];  // 充值发起者（Admin）
  timestamp: Date;
}

// 提现事件
interface WithdrawEvent {
  pid: [string, string];
  amount: string;
  nonce: string;
  timestamp: Date;
}

// Claim 事件
interface ClaimEvent {
  pid: [string, string];
  marketId: string;
  totalClaimed: string;      // 总 Claim 金额
  winningOutcome: number;    // 0=DOWN, 1=UP, 2=TIE
  assetId: string;
  windowMinutes: string;
  timestamp: Date;
}
```

### 6. 全局状态

```typescript
interface GlobalState {
  counter: string;           // 当前 tick 计数器
  totalFunds: string;        // 累计协议费
  totalPlayers: string;      // 总玩家数
  nextMarketId: string;      // 下一个市场ID
  nextOrderId: string;       // 下一个订单ID
  nextTradeId: string;       // 下一个交易ID
}
```

---

## 交易流程

### 1. 用户注册流程

```typescript
// 1. 连接 L2 钱包
const l2Account = useWallet().l2Account;

// 2. 初始化 API
const api = new ExchangePlayer(l2Account.getPrivateKey(), rpc);

// 3. 注册玩家
await api.register();  // 幂等操作，重复调用不报错

// 4. 生成 Player ID
const pubkey = l2Account.pubkey;
const leHexBN = new LeHexBN(bnToHexLe(pubkey));
const pkeyArray = leHexBN.toU64Array();
const playerId: [string, string] = [
  pkeyArray[1].toString(), 
  pkeyArray[2].toString()
];
```

### 2. 充值流程

```typescript
// 由 Admin 执行充值
const admin = new ExchangeAdmin(adminKey, rpc);
await admin.depositTo(targetPlayerKey, amount);

// 充值事件触发后，前端监听并更新余额
// EVENT_DEPOSIT → handleDepositEvent → 更新 Position (tokenIdx=0)
```

### 3. 下单流程

```typescript
// 用户在 UP 子市场下限价买单
await player.placeOrder({
  marketId: 1n,
  direction: 'UP',
  orderType: 'limit_buy',
  price: 5000n,      // 0.50 USDC (50% 概率)
  amount: 10000n     // 10,000 份额
});

// 锁定金额计算：
// - LIMIT_BUY: price × amount / 10000 = 5000 × 10000 / 10000 = 5000 USDC
// - 手续费 (2%): 5000 × 200 / 10000 = 100 USDC
// - 总锁定: 5100 USDC
```

### 4. 撮合流程（链下引擎）

```typescript
// 撮合引擎监听订单事件
eventService.onOrderUpdate(async (order) => {
  // 1. 更新订单簿
  orderBook.addOrder(order);
  
  // 2. 尝试撮合
  const matches = orderBook.matchOrders();
  
  // 3. 提交成交命令
  for (const match of matches) {
    await admin.executeTrade({
      buyOrderId: match.buyOrderId,
      sellOrderId: match.sellOrderId,
      price: match.price,
      amount: match.amount
    });
  }
});
```

### 5. 市场解析流程

```typescript
// Oracle 服务监听市场关闭
oracleService.onMarketEnd(async (market) => {
  // 1. 关闭市场（停止交易）
  await admin.closeMarket(market.marketId);
  
  // 2. 获取真实价格
  const realPrice = await fetchBTCPrice();
  
  // 3. 提交解析
  await admin.resolveMarket(
    market.marketId,
    BigInt(Math.floor(Date.now() / 1000)),
    realPrice
  );
  
  // 4. 确定胜方
  // if (realPrice > startPrice) → UP wins
  // if (realPrice < startPrice) → DOWN wins
  // if (realPrice === startPrice) → TIE (refund)
});
```

### 6. Claim 流程

```typescript
// 用户提取收益
await player.claim(marketId);

// 链上逻辑：
// 1. 检查市场已解析
// 2. 检查用户持有胜方份额
// 3. 计算收益：shares × 1 USDC
// 4. 销毁份额，释放 USDC
// 5. 触发 EVENT_CLAIM 和 EVENT_POSITION
```

---

## REST API 详细说明

### 1. 获取所有市场

**请求**
```http
GET /data/markets
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "marketId": "1",
      "assetId": "1",
      "status": 1,
      "startTick": "100",
      "endTick": "136",
      "windowTicks": "36",
      "windowMinutes": 3,
      "oracleStartTime": "1704067200",
      "oracleStartPrice": "4350000",
      "oracleEndTime": "0",
      "oracleEndPrice": "0",
      "winningOutcome": 2,
      "upMarket": {
        "orders": [],
        "volume": "0",
        "lastOrderId": "0"
      },
      "downMarket": {
        "orders": [],
        "volume": "0",
        "lastOrderId": "0"
      },
      "isClosed": false,
      "isResolved": false
    }
  ]
}
```

### 2. 获取单个市场

**请求**
```http
GET /data/market/1
```

**响应** (同上 data[0])

### 3. 获取市场订单

**请求**
```http
GET /data/market/1/orders
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "orderId": "1",
      "pid1": "12345",
      "pid2": "67890",
      "marketId": "1",
      "direction": 1,
      "orderType": 0,
      "status": 0,
      "price": "5000",
      "totalAmount": "10000",
      "filledAmount": "0",
      "lockedAmount": "5100000000",
      "createTick": "102",
      "updatedAt": "2025-01-01T12:00:00.000Z"
    }
  ]
}
```

### 4. 获取市场成交

**请求**
```http
GET /data/market/1/trades
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "tradeId": "1",
      "marketId": "1",
      "direction": 1,
      "buyOrderId": "1",
      "sellOrderId": "2",
      "price": "4900",
      "amount": "1000",
      "tick": "105",
      "createdAt": "2025-01-01T12:00:25.000Z"
    }
  ]
}
```

### 5. 获取玩家持仓

**请求**
```http
GET /data/player/12345/67890/positions
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "pid1": "12345",
      "pid2": "67890",
      "tokenIdx": "0",
      "balance": "100000000000",
      "lockBalance": "5100000000"
    },
    {
      "pid1": "12345",
      "pid2": "67890",
      "tokenIdx": "1",
      "balance": "10000",
      "lockBalance": "0"
    }
  ]
}
```

**Token 索引映射**
- `0`: USDC
- `marketId * 2 + 1`: UP 份额
- `marketId * 2 + 2`: DOWN 份额

例如: Market 1 → UP=1, DOWN=2; Market 2 → UP=3, DOWN=4

### 6. 获取财务活动

**请求**
```http
GET /data/player/12345/67890/financial-activity?limit=100
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "type": "deposit",
      "pid": ["12345", "67890"],
      "amount": "50000000000",
      "nonce": "1",
      "callerPid": ["99999", "88888"],
      "timestamp": "2025-01-01T10:00:00.000Z"
    },
    {
      "type": "claim",
      "pid": ["12345", "67890"],
      "marketId": "1",
      "totalClaimed": "10000",
      "winningOutcome": 1,
      "assetId": "1",
      "windowMinutes": "3",
      "timestamp": "2025-01-01T11:30:00.000Z"
    },
    {
      "type": "withdrawal",
      "pid": ["12345", "67890"],
      "amount": "20000000000",
      "nonce": "5",
      "timestamp": "2025-01-01T12:00:00.000Z"
    }
  ]
}
```

---

## WebSocket 实时事件

### 事件监听架构

```typescript
import { Service, TxWitness } from 'zkwasm-ts-server';

const EVENT_POSITION = 1;
const EVENT_ORDER = 4;
const EVENT_TRADE = 5;
const EVENT_INDEXED_OBJECT = 6;
const EVENT_DEPOSIT = 7;
const EVENT_WITHDRAW = 8;
const EVENT_CLAIM = 9;

async function eventCallback(arg: TxWitness, data: BigUint64Array) {
  if (data[0] !== 0n) {
    console.error('Transaction failed:', data[0]);
    return;
  }
  
  let i = 2;
  while (i < data.length) {
    const eventType = Number(data[i] >> 32n);
    const eventLength = Number(data[i] & 0xffffffffn);
    const eventData = data.slice(i + 1, i + 1 + eventLength);
    
    switch (eventType) {
      case EVENT_POSITION:
        handlePositionEvent(eventData);
        break;
      case EVENT_ORDER:
        handleOrderEvent(eventData);
        break;
      case EVENT_TRADE:
        handleTradeEvent(eventData);
        break;
      case EVENT_INDEXED_OBJECT:
        handleIndexedObject(eventData);
        break;
      // ... 其他事件
    }
    
    i += 1 + eventLength;
  }
}
```

### 前端实时更新策略

```typescript
// 1. 订单簿更新
function handleOrderEvent(data: BigUint64Array) {
  const order = decodeOrderEvent(data);
  
  // 更新订单簿 UI
  if (order.marketId === currentMarketId) {
    updateOrderBook(order);
    
    // 闪烁动画
    if (order.status === 0) {
      flashNewOrder(order.orderId);
    }
  }
}

// 2. 成交更新
function handleTradeEvent(data: BigUint64Array) {
  const trade = decodeTradeEvent(data);
  
  // 更新成交列表
  addTradeToFeed(trade);
  
  // 更新价格图表
  updatePriceChart(trade.price);
  
  // 更新市场统计
  incrementVolume(trade.marketId, trade.amount);
}

// 3. 持仓更新
function handlePositionEvent(data: BigUint64Array) {
  const position = decodePositionEvent(data);
  
  // 如果是当前用户
  if (isSelfPosition(position.pid)) {
    updateUserBalance(position);
    updatePortfolio(position);
  }
}

// 4. 市场状态更新
function handleMarketEvent(data: BigUint64Array) {
  const market = decodeMarketEvent(data);
  
  // 市场解析完成
  if (market.status === MarketStatus.Resolved) {
    showSettlementModal(market);
    enableClaimButton(market.marketId);
  }
}
```

---

## 前端页面数据需求

### 1. 市场列表页 (`/`)

**初始加载**
```typescript
// 1. 获取所有市场
const markets = await fetch('/data/markets').then(r => r.json());

// 2. 获取全局状态（用于计算倒计时）
const globalState = await fetch('/data/state').then(r => r.json());

// 3. WebSocket 订阅
subscribeToMarketEvents(); // 监听 EVENT_INDEXED_OBJECT (MARKET_INFO)
```

**实时更新**
- 每秒更新倒计时
- 监听市场状态变更
- 监听 Oracle 价格更新（单独 WebSocket）

**显示数据**
```typescript
interface MarketCardData {
  marketId: string;
  title: string;              // "BTC above $43,500 at 12:00, Jan 1?"
  status: MarketStatus;
  badge: 'Live' | 'Pending' | 'Closed' | 'Settled';
  timeRemaining: string;      // "23:45"
  targetPrice: number;        // 43500
  currentPrice: number;       // 44200 (from Oracle)
  yesChance: number;          // 65%
  noChance: number;           // 35%
  volume: string;             // "125,430 USDC"
  traders: number;            // 42
  isWinning: boolean;         // currentPrice > targetPrice
}
```

### 2. 市场详情页 (`/market/:id`)

**初始加载**
```typescript
// 1. 市场详情
const market = await fetch(`/data/market/${marketId}`).then(r => r.json());

// 2. 订单列表
const orders = await fetch(`/data/market/${marketId}/orders`).then(r => r.json());

// 3. 成交记录
const trades = await fetch(`/data/market/${marketId}/trades`).then(r => r.json());

// 4. 用户持仓（如果已登录）
if (playerId) {
  const positions = await fetch(`/data/player/${pid1}/${pid2}/positions`).then(r => r.json());
}
```

**实时订阅**
```typescript
// 订单簿更新
subscribeToOrders(marketId);

// 成交流更新
subscribeToTrades(marketId);

// Oracle 价格更新（单独 WebSocket）
subscribeToOraclePrice('BTC');
```

**图表数据需求**

```typescript
// 价格K线图
interface ChartDataPoint {
  time: number;              // Unix timestamp
  price: number;             // Oracle 价格
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

// 订单簿深度图
interface OrderBookDepth {
  bids: { price: number; depth: number }[];
  asks: { price: number; depth: number }[];
}
```

### 3. 交易面板

**标准模式**
```typescript
interface TradingFormData {
  side: 'yes' | 'no';        // 买 UP 或 DOWN
  amount: string;            // 投注金额（USDC）
  estimatedShares: number;   // 预估份额
  estimatedPayout: number;   // 预估收益
  fee: number;               // 手续费
  isFeeExempt: boolean;      // 是否豁免
}

// 计算逻辑
function calculateShares(amount: number, price: number): number {
  return (amount * 10000) / price;
}

function calculatePayout(shares: number): number {
  return shares; // 每份 = 1 USDC
}

function calculateFee(amount: number, isFeeExempt: boolean): number {
  return isFeeExempt ? 0 : (amount * 200) / 10000; // 2%
}
```

**专业模式**
```typescript
interface AdvancedTradingFormData {
  side: 'yes' | 'no';
  orderType: 'limit' | 'market';
  price: number;             // BPS (0-10000)
  amount: number;            // 份额数量
  cost: number;              // 成本
  toWin: number;             // 潜在收益
  fee: number;
}
```

### 4. 持仓管理页 (`/positions`)

**数据查询**
```typescript
// 1. 所有持仓
const positions = await fetch(`/data/player/${pid1}/${pid2}/positions`).then(r => r.json());

// 2. 每个市场的详情
const marketDetails = await Promise.all(
  positions
    .filter(p => p.tokenIdx !== '0') // 排除 USDC
    .map(p => {
      const marketId = Math.floor(parseInt(p.tokenIdx) / 2);
      return fetch(`/data/market/${marketId}`).then(r => r.json());
    })
);
```

**计算字段**
```typescript
interface PositionDisplay {
  marketId: number;
  marketTitle: string;
  side: 'UP' | 'DOWN';
  shares: number;
  avgPrice: number;           // 平均成本（需从历史计算）
  currentPrice: number;       // 当前市场价
  cost: number;               // 总成本
  estValue: number;           // 当前估值
  unrealizedPnL: number;      // 未实现盈亏
  unrealizedPnLPercent: number;
  canClaim: boolean;          // 是否可提取
}
```

### 5. 钱包/投资组合页 (`/wallet`)

**总览卡片**
```typescript
interface PortfolioSummary {
  totalValue: number;        // 总资产 (USDC + 所有份额估值)
  cash: number;              // 可用 USDC
  locked: number;            // 锁定 USDC
  positions: number;         // 持仓市值
  profitLoss: number;        // 累计盈亏
  profitLossPercent: number;
  toClaim: number;           // 可提取金额
}
```

**交易历史**
```typescript
// 获取所有财务活动
const activities = await fetch(
  `/data/player/${pid1}/${pid2}/financial-activity?limit=100`
).then(r => r.json());

interface TransactionRow {
  type: 'Deposit' | 'Withdraw' | 'Trade' | 'Claim';
  amount: number;
  asset: 'USDC' | 'UP' | 'DOWN';
  timestamp: Date;
  status: 'Completed' | 'Pending' | 'Failed';
  txHash?: string;
}
```

### 6. Admin 面板 (`/admin`)

**权限验证**
```typescript
const ADMIN_PUBKEY = process.env.VITE_ADMIN_PUBKEY;

function useAdminAccess() {
  const { user } = useUser();
  return user?.publicKey === ADMIN_PUBKEY;
}
```

**市场管理**
```typescript
// 1. 市场列表（同用户端）
const markets = await fetch('/data/markets').then(r => r.json());

// 2. 创建市场
await admin.createMarket({
  assetId: 1n,
  startTick: currentCounter + 5n,
  endTick: currentCounter + 5n + 36n,
  oracleStartTime: BigInt(Math.floor(Date.now() / 1000) + 25),
  oracleStartPrice: 4350000n
});

// 3. 关闭市场
await admin.closeMarket(marketId);

// 4. 解析市场
const btcPrice = await fetchOraclePrice('BTC');
await admin.resolveMarket(marketId, timestamp, btcPrice);
```

**Oracle 监控**
```typescript
interface OracleStatus {
  connectionStatus: 'connected' | 'disconnected';
  lastHeartbeat: number;
  latestPrice: number;
  apiLatency: number;
  priceHistory: { time: number; price: number }[];
}
```

---

## 代码示例

### 1. 初始化 zkWASM 客户端

```typescript
import { ZKWasmAppRpc } from 'zkwasm-minirollup-rpc';
import { ExchangePlayer, ExchangeAdmin, ExchangeAPI } from './api';

// RPC 客户端
const rpc = new ZKWasmAppRpc('https://rpc.btcprediction.zkwasm.ai');

// 玩家客户端（需要私钥）
const player = new ExchangePlayer(l2Account.getPrivateKey(), rpc);

// REST API 客户端
const api = new ExchangeAPI('https://rpc.btcprediction.zkwasm.ai');
```

### 2. 注册并充值

```typescript
// 1. 注册玩家
async function registerPlayer(player: ExchangePlayer) {
  try {
    await player.register();
    console.log('Player registered');
  } catch (e) {
    if (e.message === 'PlayerAlreadyExists') {
      console.log('Player already exists');
    } else {
      throw e;
    }
  }
}

// 2. Admin 充值
async function depositFunds(admin: ExchangeAdmin, targetKey: string, amount: bigint) {
  await admin.depositTo(targetKey, amount);
  console.log(`Deposited ${amount} to ${targetKey}`);
}
```

### 3. 下单

```typescript
// 在 UP 子市场下限价买单
async function placeLimitBuyOrder(
  player: ExchangePlayer,
  marketId: bigint,
  price: bigint,
  amount: bigint
) {
  await player.placeOrder({
    marketId,
    direction: 'UP',
    orderType: 'limit_buy',
    price,      // BPS (0-10000)
    amount
  });
  
  console.log(`Placed limit buy order: ${amount} shares @ ${price / 100}%`);
}

// 在 DOWN 子市场下市价买单
async function placeMarketBuyOrder(
  player: ExchangePlayer,
  marketId: bigint,
  amount: bigint
) {
  await player.placeOrder({
    marketId,
    direction: 'DOWN',
    orderType: 'market_buy',
    price: 0n,  // 市价单 price 无意义
    amount
  });
  
  console.log(`Placed market buy order: ${amount} USDC`);
}
```

### 4. 查询数据

```typescript
// 获取市场列表
async function fetchMarkets(api: ExchangeAPI) {
  const markets = await api.getMarkets();
  return markets.filter(m => m.status === 1); // 只显示活跃市场
}

// 获取用户持仓
async function fetchUserPositions(api: ExchangeAPI, playerId: [bigint, bigint]) {
  const positions = await api.getPositions(playerId);
  
  // 分离 USDC 和份额
  const usdcPosition = positions.find(p => p.tokenIdx === '0');
  const sharePositions = positions.filter(p => p.tokenIdx !== '0');
  
  return {
    cash: usdcPosition?.balance || '0',
    locked: usdcPosition?.lockBalance || '0',
    shares: sharePositions.map(p => ({
      marketId: Math.floor(parseInt(p.tokenIdx) / 2),
      side: parseInt(p.tokenIdx) % 2 === 1 ? 'UP' : 'DOWN',
      balance: p.balance,
      locked: p.lockBalance
    }))
  };
}
```

### 5. WebSocket 事件监听（前端）

```typescript
// 使用 zkwasm-ts-server 的 Service 模块
import { Service, TxWitness } from 'zkwasm-ts-server';
import { decodeOrderEvent, decodeTradeEvent } from './models';

class EventListener {
  private service: Service;
  private callbacks = new Map<number, Set<Function>>();
  
  async initialize() {
    this.service = new Service(
      this.eventCallback.bind(this),
      this.batchCallback.bind(this),
      () => {}
    );
    await this.service.initialize();
    this.service.serve();
  }
  
  on(eventType: number, callback: Function) {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, new Set());
    }
    this.callbacks.get(eventType)!.add(callback);
  }
  
  private async eventCallback(arg: TxWitness, data: BigUint64Array) {
    if (data[0] !== 0n) return;
    
    let i = 2;
    while (i < data.length) {
      const eventType = Number(data[i] >> 32n);
      const eventLength = Number(data[i] & 0xffffffffn);
      const eventData = data.slice(i + 1, i + 1 + eventLength);
      
      const callbacks = this.callbacks.get(eventType);
      if (callbacks) {
        callbacks.forEach(cb => cb(eventData));
      }
      
      i += 1 + eventLength;
    }
  }
  
  private async batchCallback(txs: TxWitness[], pre: string, post: string) {
    // 批次处理完成
  }
}

// 使用示例
const listener = new EventListener();
await listener.initialize();

listener.on(EVENT_ORDER, (data: BigUint64Array) => {
  const order = decodeOrderEvent(data);
  console.log('New order:', order);
  updateOrderBook(order);
});

listener.on(EVENT_TRADE, (data: BigUint64Array) => {
  const trade = decodeTradeEvent(data);
  console.log('New trade:', trade);
  updateTradeHistory(trade);
});
```

### 6. Oracle 价格集成

```typescript
// Binance WebSocket 价格流
class OraclePriceService {
  private ws: WebSocket | null = null;
  private subscribers = new Map<string, Set<Function>>();
  
  subscribe(asset: string, callback: (price: number) => void) {
    if (!this.subscribers.has(asset)) {
      this.subscribers.set(asset, new Set());
      this.connectWebSocket(asset);
    }
    this.subscribers.get(asset)!.add(callback);
    
    return () => {
      const subs = this.subscribers.get(asset);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.disconnectWebSocket(asset);
        }
      }
    };
  }
  
  private connectWebSocket(asset: string) {
    const symbol = `${asset.toLowerCase()}usdt`;
    this.ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol}@ticker`
    );
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.c); // 最新价格
      
      const subs = this.subscribers.get(asset);
      if (subs) {
        subs.forEach(cb => cb(price));
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  private disconnectWebSocket(asset: string) {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// 使用示例
const oracleService = new OraclePriceService();

// 在市场详情页订阅
useEffect(() => {
  const unsubscribe = oracleService.subscribe('BTC', (price) => {
    setCurrentPrice(price);
    updateChartData({ time: Date.now(), price });
  });
  
  return () => {
    unsubscribe();
  };
}, []);
```

---

## 错误处理

### 常见错误码

| 错误名称 | 错误码 | 说明 | 前端处理 |
|----------|--------|------|----------|
| `ERROR_INVALID_MARKET_TIME` | - | 市场时间窗口不符合规则 | 提示用户检查时间参数 |
| `ERROR_MARKET_NOT_FOUND` | - | 市场不存在 | 刷新市场列表 |
| `ERROR_MARKET_NOT_ACTIVE` | - | 市场未激活 | 禁用交易按钮 |
| `ERROR_INSUFFICIENT_BALANCE` | - | 余额不足 | 显示余额不足提示 |
| `ERROR_ORDER_NOT_FOUND` | - | 订单不存在 | 刷新订单列表 |
| `ERROR_INVALID_PRICE` | - | 价格无效 | 校验价格范围 (0-10000) |
| `PlayerAlreadyExists` | - | 玩家已注册 | 正常流程，继续操作 |

### 错误处理示例

```typescript
// 1. 交易错误处理
async function placeBetWithErrorHandling(
  player: ExchangePlayer,
  marketId: bigint,
  direction: 'UP' | 'DOWN',
  amount: bigint
) {
  try {
    await player.placeOrder({
      marketId,
      direction,
      orderType: 'market_buy',
      price: 0n,
      amount
    });
    
    toast.success('Order placed successfully');
  } catch (error) {
    if (error.message.includes('INSUFFICIENT_BALANCE')) {
      toast.error('Insufficient balance. Please deposit funds.');
    } else if (error.message.includes('MARKET_NOT_ACTIVE')) {
      toast.error('Market is not active.');
    } else {
      toast.error('Failed to place order. Please try again.');
      console.error('Order error:', error);
    }
  }
}

// 2. API 查询错误处理
async function fetchDataWithRetry<T>(
  fetcher: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetcher();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      console.warn(`Retry ${i + 1}/${maxRetries}`, error);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

// 使用示例
const markets = await fetchDataWithRetry(() => 
  api.getMarkets()
);
```

---

## 附录

### A. 精度转换表

| 单位 | 精度 | 示例 | 转换 |
|------|------|------|------|
| USDC | 1e6 | 1 USDC = 1,000,000 | `amount / 1e6` |
| 份额 | 1e6 | 1 份额 = 1,000,000 | `shares / 1e6` |
| BPS | 1e4 | 50% = 5000 BPS | `bps / 100` |
| 价格 | 1e2 | $43,500.00 = 4,350,000 | `price / 100` |

### B. 常量定义

```typescript
// 配置常量
export const TICK_SECONDS = 5;              // 5 秒 = 1 tick
export const GRACE_PERIOD_TICKS = 12;       // 1 分钟
export const PROTOCOL_FEE_BPS = 200;        // 2%
export const PRICE_PRECISION = 10000;       // BPS 精度
export const AMOUNT_PRECISION = 1000000;    // USDC/份额精度

// 市场窗口
export const MARKET_WINDOWS = {
  ONE_MIN: 12,    // 12 ticks = 1 分钟
  THREE_MIN: 36,  // 36 ticks = 3 分钟
  FIVE_MIN: 60,   // 60 ticks = 5 分钟
};

// Token 索引
export const TOKEN_USDC = 0;
export const tokenIdxForMarket = (marketId: number, direction: 'UP' | 'DOWN') => {
  return marketId * 2 + (direction === 'UP' ? 1 : 2);
};
```

### C. 计算工具函数

```typescript
// BPS 转百分比
export function bpsToPercent(bps: number): number {
  return bps / 100;
}

// 百分比转 BPS
export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}

// 计算购买成本
export function calculateCost(shares: number, priceBps: number): number {
  return (shares * priceBps) / 10000;
}

// 计算潜在收益
export function calculatePayout(shares: number): number {
  return shares; // 每份 = 1 USDC
}

// 计算手续费
export function calculateFee(amount: number, isFeeExempt: boolean): number {
  return isFeeExempt ? 0 : (amount * 200) / 10000;
}

// Tick 转时间戳
export function tickToTimestamp(tick: number, deploymentTime: number): number {
  return deploymentTime + tick * TICK_SECONDS * 1000;
}

// 时间戳转 Tick
export function timestampToTick(timestamp: number, deploymentTime: number): number {
  return Math.floor((timestamp - deploymentTime) / (TICK_SECONDS * 1000));
}

// 计算剩余时间
export function calculateTimeRemaining(
  currentTick: number,
  endTick: number
): { minutes: number; seconds: number } {
  const remainingTicks = endTick - currentTick;
  const totalSeconds = remainingTicks * TICK_SECONDS;
  
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60
  };
}
```

---

## 总结

本文档涵盖了 BTC Prediction Market 前端集成所需的所有核心内容：

1. ✅ **API 端点完整列表**
2. ✅ **数据模型定义**
3. ✅ **交易流程详解**
4. ✅ **WebSocket 事件监听**
5. ✅ **页面数据需求**
6. ✅ **完整代码示例**
7. ✅ **错误处理方案**

**下一步行动**:
- 根据本文档实现前端 API 服务层
- 集成 zkWASM RPC 客户端
- 实现 WebSocket 事件监听
- 开发页面组件并接入数据

**参考资源**:
- 后端 API 文档: `OFFCHAIN_API_GUIDE.md`
- 前端规范: `FRONTEND_SPECIFICATION.md`
- Rust 源码: `src/`
- TypeScript SDK: `ts/src/`

