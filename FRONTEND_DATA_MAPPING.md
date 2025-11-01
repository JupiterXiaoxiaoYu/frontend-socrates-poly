# 前端页面数据映射文档

> 详细说明每个前端页面/组件所需的API数据及其映射关系

---

## 目录

1. [市场列表页 (MarketList)](#1-市场列表页-marketlist)
2. [市场详情页 (MarketDetail)](#2-市场详情页-marketdetail)
3. [投资组合页 (Portfolio)](#3-投资组合页-portfolio)
4. [钱包页 (Wallet)](#4-钱包页-wallet)
5. [管理员面板 (Admin)](#5-管理员面板-admin)
6. [通用组件数据需求](#6-通用组件数据需求)

---

## 1. 市场列表页 (MarketList)

### 页面路径
- `/` 或 `/markets`

### 数据源

#### 1.1 API 端点

```typescript
// 获取所有市场
GET /data/markets

// 获取全局状态（用于当前 tick 计数器）
GET /data/state
```

#### 1.2 响应数据结构

```typescript
// Markets API 响应
{
  "success": true,
  "data": [
    {
      "marketId": "1",
      "assetId": "1",                    // 1=BTC
      "status": 1,                       // 0=Pending, 1=Active, 2=Resolved, 3=Closed
      "startTick": "100",
      "endTick": "136",
      "windowTicks": "36",
      "windowMinutes": 3,
      "oracleStartTime": "1704067200",   // Unix timestamp (秒)
      "oracleStartPrice": "4350000",     // 价格 × 100 (43500.00)
      "oracleEndTime": "0",
      "oracleEndPrice": "0",
      "winningOutcome": 2,               // 0=DOWN, 1=UP, 2=TIE
      "upMarket": {
        "orders": [],
        "volume": "5000000",             // 成交量（USDC，精度1e6）
        "lastOrderId": "10"
      },
      "downMarket": {
        "orders": [],
        "volume": "3000000",
        "lastOrderId": "8"
      },
      "isClosed": false,
      "isResolved": false
    }
  ]
}

// Global State API 响应
{
  "success": true,
  "data": {
    "counter": "120",                    // 当前 tick 计数器
    "totalFunds": "1000000000",          // 累计协议费
    "totalPlayers": "50",
    "nextMarketId": "5",
    "nextOrderId": "100",
    "nextTradeId": "200"
  }
}
```

### 前端组件数据映射

#### MarketCard 组件

```typescript
interface MarketCardProps {
  market: {
    // 基础信息
    marketId: string;
    title: string;                       // 生成: "BTC above $43,500 at 12:00, Jan 1?"
    status: 'Pending' | 'Active' | 'Closed' | 'Resolved';
    
    // 时间相关
    timeRemaining: string;               // 计算: "23:45"
    endTime: Date;                       // 转换: oracleStartTime + windowMinutes * 60
    
    // 价格相关
    targetPrice: number;                 // 转换: oracleStartPrice / 100
    currentPrice: number;                // 来自 Oracle WebSocket
    
    // 概率相关
    yesChance: number;                   // 计算: upMarket.volume / totalVolume
    noChance: number;                    // 计算: downMarket.volume / totalVolume
    
    // 统计数据
    totalVolume: number;                 // 计算: upMarket.volume + downMarket.volume
    traders: number;                     // TODO: 需要新 API
    
    // 视觉状态
    isWinning: boolean;                  // currentPrice > targetPrice
    badge: 'Live' | 'Pending' | 'Closed' | 'Settled';
  };
}

// 数据转换函数
function transformMarketData(apiMarket: any, globalState: any, currentPrice: number): MarketCardProps['market'] {
  const targetPrice = parseInt(apiMarket.oracleStartPrice) / 100;
  const currentTick = parseInt(globalState.counter);
  const endTick = parseInt(apiMarket.endTick);
  const remainingTicks = endTick - currentTick;
  const remainingSeconds = remainingTicks * 5;
  
  const upVolume = parseInt(apiMarket.upMarket.volume) / 1e6;
  const downVolume = parseInt(apiMarket.downMarket.volume) / 1e6;
  const totalVolume = upVolume + downVolume;
  
  return {
    marketId: apiMarket.marketId,
    title: generateMarketTitle(apiMarket),
    status: getStatusLabel(apiMarket.status),
    
    timeRemaining: formatTimeRemaining(remainingSeconds),
    endTime: new Date((parseInt(apiMarket.oracleStartTime) + apiMarket.windowMinutes * 60) * 1000),
    
    targetPrice,
    currentPrice,
    
    yesChance: totalVolume > 0 ? (upVolume / totalVolume) * 100 : 50,
    noChance: totalVolume > 0 ? (downVolume / totalVolume) * 100 : 50,
    
    totalVolume,
    traders: 0, // TODO: 从订单中统计唯一玩家
    
    isWinning: currentPrice > targetPrice,
    badge: getBadge(apiMarket.status, remainingSeconds)
  };
}

// 辅助函数
function generateMarketTitle(market: any): string {
  const asset = market.assetId === '1' ? 'BTC' : 'ETH';
  const price = (parseInt(market.oracleStartPrice) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  const time = new Date(parseInt(market.oracleStartTime) * 1000).toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  });
  return `${asset} above ${price} at ${time}?`;
}

function getStatusLabel(status: number): string {
  const labels = ['Pending', 'Active', 'Resolved', 'Closed'];
  return labels[status] || 'Unknown';
}

function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getBadge(status: number, remainingSeconds: number): string {
  if (status === 2) return 'Settled';
  if (status === 3) return 'Closed';
  if (status === 1) return 'Live';
  return 'Pending';
}
```

### 实时更新策略

```typescript
// 1. 定时更新倒计时（每秒）
useEffect(() => {
  const interval = setInterval(() => {
    setTimeRemaining(prev => Math.max(0, prev - 1));
  }, 1000);
  
  return () => clearInterval(interval);
}, []);

// 2. 轮询市场状态（每 5 秒）
useEffect(() => {
  const interval = setInterval(async () => {
    const markets = await fetchMarkets();
    setMarkets(markets);
  }, 5000);
  
  return () => clearInterval(interval);
}, []);

// 3. WebSocket 监听价格更新
useEffect(() => {
  const unsubscribe = oracleService.subscribe('BTC', (price) => {
    setCurrentPrice(price);
  });
  
  return () => unsubscribe();
}, []);

// 4. WebSocket 监听市场事件
useEffect(() => {
  const unsubscribe = eventService.on(EVENT_INDEXED_OBJECT, (data) => {
    const market = decodeMarketEvent(data);
    updateMarketInList(market);
  });
  
  return () => unsubscribe();
}, []);
```

---

## 2. 市场详情页 (MarketDetail)

### 页面路径
- `/market/:marketId`

### 数据源

#### 2.1 API 端点

```typescript
// 市场详情
GET /data/market/:marketId

// 订单列表
GET /data/market/:marketId/orders

// 成交记录
GET /data/market/:marketId/trades

// 用户持仓（如果已登录）
GET /data/player/:pid1/:pid2/positions
```

#### 2.2 响应数据

```typescript
// Market Detail
{
  "success": true,
  "data": {
    // ... (同 Market List，单个市场)
  }
}

// Orders
{
  "success": true,
  "data": [
    {
      "orderId": "1",
      "pid1": "12345",
      "pid2": "67890",
      "marketId": "1",
      "direction": 1,                    // 0=DOWN, 1=UP
      "orderType": 0,                    // 0=LIMIT_BUY, 1=LIMIT_SELL, 2=MARKET_BUY, 3=MARKET_SELL
      "status": 0,                       // 0=ACTIVE, 1=FILLED, 2=CANCELLED
      "price": "5000",                   // BPS (0-10000)
      "totalAmount": "10000000000",      // 份额数量（精度 1e6）
      "filledAmount": "5000000000",      // 已成交
      "lockedAmount": "5100000000",      // 锁定 USDC
      "createTick": "102",
      "updatedAt": "2025-01-01T12:00:00.000Z"
    }
  ]
}

// Trades
{
  "success": true,
  "data": [
    {
      "tradeId": "1",
      "marketId": "1",
      "direction": 1,
      "buyOrderId": "1",
      "sellOrderId": "2",
      "price": "4900",                   // BPS
      "amount": "1000000000",            // 份额数量
      "tick": "105",
      "createdAt": "2025-01-01T12:00:25.000Z"
    }
  ]
}
```

### 前端组件数据映射

#### MarketHeader 组件

```typescript
interface MarketHeaderProps {
  title: string;                         // "BTC above $43,500 at 12:00, Sep 16?"
  targetPrice: number;                   // 43500.00
  currentPrice: number;                  // 44200.00 (实时)
  timeRemaining: {
    minutes: number;
    seconds: number;
  };
  stats: {
    liquidity: number;                   // upMarket.volume + downMarket.volume
    traders: number;                     // 统计唯一玩家数
    volume: number;                      // 总成交量
  };
  yesChance: number;                     // 65%
  noChance: number;                      // 35%
}

function transformToMarketHeader(market: any, currentPrice: number): MarketHeaderProps {
  const upVolume = parseInt(market.upMarket.volume) / 1e6;
  const downVolume = parseInt(market.downMarket.volume) / 1e6;
  const totalVolume = upVolume + downVolume;
  
  return {
    title: generateMarketTitle(market),
    targetPrice: parseInt(market.oracleStartPrice) / 100,
    currentPrice,
    timeRemaining: calculateTimeRemaining(market.endTick, globalState.counter),
    stats: {
      liquidity: totalVolume,
      traders: 0, // TODO: 从订单统计
      volume: totalVolume
    },
    yesChance: totalVolume > 0 ? (upVolume / totalVolume) * 100 : 50,
    noChance: totalVolume > 0 ? (downVolume / totalVolume) * 100 : 50
  };
}
```

#### OrderBook 组件

```typescript
interface OrderBookProps {
  bids: OrderLevel[];                    // 买单（UP 方向）
  asks: OrderLevel[];                    // 卖单（DOWN 方向）
  spread: number;
  lastTradePrice: number;
}

interface OrderLevel {
  price: number;                         // BPS → 百分比
  amount: number;                        // 份额数量
  total: number;                         // 累计数量
  myOrders: number;                      // 用户自己的订单数量
}

function transformToOrderBook(orders: any[], currentUserId: [string, string]): OrderBookProps {
  // 分离买单和卖单
  const buyOrders = orders.filter(o => 
    o.direction === 1 && o.orderType === 0 && o.status === 0
  );
  const sellOrders = orders.filter(o => 
    o.direction === 1 && o.orderType === 1 && o.status === 0
  );
  
  // 按价格聚合
  const bids = aggregateOrders(buyOrders, 'buy', currentUserId);
  const asks = aggregateOrders(sellOrders, 'sell', currentUserId);
  
  // 计算价差
  const bestBid = bids[0]?.price || 0;
  const bestAsk = asks[0]?.price || 10000;
  const spread = bestAsk - bestBid;
  
  return {
    bids: bids.slice(0, 10),             // 显示前 10 档
    asks: asks.slice(0, 10),
    spread: spread / 100,                // 转为百分比
    lastTradePrice: 0                    // 从最新成交获取
  };
}

function aggregateOrders(orders: any[], side: 'buy' | 'sell', userId: [string, string]): OrderLevel[] {
  const priceMap = new Map<number, { amount: number; myAmount: number }>();
  
  orders.forEach(order => {
    const price = parseInt(order.price);
    const remaining = parseInt(order.totalAmount) - parseInt(order.filledAmount);
    const isMyOrder = order.pid1 === userId[0] && order.pid2 === userId[1];
    
    if (!priceMap.has(price)) {
      priceMap.set(price, { amount: 0, myAmount: 0 });
    }
    
    const level = priceMap.get(price)!;
    level.amount += remaining / 1e6;
    if (isMyOrder) {
      level.myAmount += remaining / 1e6;
    }
  });
  
  // 转为数组并排序
  const levels = Array.from(priceMap.entries()).map(([price, data]) => ({
    price,
    amount: data.amount,
    total: 0, // 稍后计算累计
    myOrders: data.myAmount
  }));
  
  levels.sort((a, b) => side === 'buy' ? b.price - a.price : a.price - b.price);
  
  // 计算累计数量
  let cumulative = 0;
  levels.forEach(level => {
    cumulative += level.amount;
    level.total = cumulative;
  });
  
  return levels;
}
```

#### PriceChart 组件

```typescript
interface PriceChartProps {
  data: ChartDataPoint[];
  targetPrice: number;
  mode: 'price' | 'percentage';          // 价格模式 or 概率模式
}

interface ChartDataPoint {
  time: number;                          // Unix timestamp (毫秒)
  price: number;                         // Oracle 价格
  volume?: number;                       // 成交量（可选）
}

// 数据来源：Oracle WebSocket 实时推送
// 前端缓存最近 100 个数据点
const chartDataBuffer: ChartDataPoint[] = [];

oracleService.subscribe('BTC', (price: number) => {
  const point: ChartDataPoint = {
    time: Date.now(),
    price
  };
  
  chartDataBuffer.push(point);
  
  // 保留最近 100 个点
  if (chartDataBuffer.length > 100) {
    chartDataBuffer.shift();
  }
  
  updateChart(chartDataBuffer);
});
```

#### TradingPanel 组件

```typescript
interface TradingPanelProps {
  mode: 'standard' | 'advanced';
  marketId: string;
  userBalance: number;                   // USDC 余额
  isFeeExempt: boolean;                  // 是否豁免手续费
}

// 标准模式
interface StandardTradingForm {
  side: 'yes' | 'no';                    // UP or DOWN
  amount: number;                        // 投注金额（USDC）
  estimatedShares: number;               // 预估份额
  estimatedPayout: number;               // 预估收益
  fee: number;                           // 手续费
}

// 计算逻辑
function calculateStandardMode(
  amount: number,
  currentPrice: number,
  isFeeExempt: boolean
): StandardTradingForm {
  const fee = isFeeExempt ? 0 : amount * 0.02;
  const netAmount = amount - fee;
  
  // 使用当前市场价估算份额
  const shares = (netAmount * 10000) / currentPrice;
  
  return {
    side: 'yes',
    amount,
    estimatedShares: shares,
    estimatedPayout: shares,             // 每份 = 1 USDC
    fee
  };
}

// 高级模式
interface AdvancedTradingForm {
  side: 'yes' | 'no';
  orderType: 'limit' | 'market';
  price: number;                         // BPS (0-10000)
  amount: number;                        // 份额数量
  cost: number;                          // 总成本
  toWin: number;                         // 潜在收益
  fee: number;
}

function calculateAdvancedMode(
  shares: number,
  price: number,
  isFeeExempt: boolean
): AdvancedTradingForm {
  const cost = (shares * price) / 10000;
  const fee = isFeeExempt ? 0 : cost * 0.02;
  
  return {
    side: 'yes',
    orderType: 'limit',
    price,
    amount: shares,
    cost: cost + fee,
    toWin: shares - cost,
    fee
  };
}
```

#### RecentTrades 组件

```typescript
interface TradeEntry {
  time: Date;
  side: 'buy' | 'sell';                  // 买入 or 卖出
  direction: 'UP' | 'DOWN';              // UP 或 DOWN 子市场
  price: number;                         // 成交价（BPS → 百分比）
  amount: number;                        // 成交数量（份额）
  total: number;                         // 成交金额（USDC）
}

function transformToTrades(apiTrades: any[]): TradeEntry[] {
  return apiTrades.map(trade => {
    const price = parseInt(trade.price);
    const amount = parseInt(trade.amount) / 1e6;
    const total = (amount * price) / 10000;
    
    return {
      time: new Date(trade.createdAt),
      side: 'buy',                       // TODO: 需要判断买卖方向
      direction: trade.direction === 1 ? 'UP' : 'DOWN',
      price: price / 100,                // 转为百分比
      amount,
      total
    };
  });
}
```

---

## 3. 投资组合页 (Portfolio)

### 页面路径
- `/portfolio`

### 数据源

```typescript
// 用户所有持仓
GET /data/player/:pid1/:pid2/positions

// 每个持仓市场的详情（需要批量查询）
GET /data/market/:marketId (多次调用)

// 用户财务活动
GET /data/player/:pid1/:pid2/financial-activity?limit=100
```

### 前端组件数据映射

#### PortfolioSummary 组件

```typescript
interface PortfolioSummaryProps {
  totalValue: number;                    // 总资产
  cash: number;                          // 可用 USDC
  locked: number;                        // 锁定 USDC
  positions: number;                     // 持仓市值
  profitLoss: number;                    // 累计盈亏
  profitLossPercent: number;
  toClaim: number;                       // 可提取金额
}

async function calculatePortfolioSummary(
  positions: any[],
  markets: Map<number, any>
): Promise<PortfolioSummaryProps> {
  // 1. USDC 余额
  const usdcPosition = positions.find(p => p.tokenIdx === '0');
  const cash = parseInt(usdcPosition?.balance || '0') / 1e6;
  const locked = parseInt(usdcPosition?.lockBalance || '0') / 1e6;
  
  // 2. 份额持仓
  const sharePositions = positions.filter(p => p.tokenIdx !== '0');
  
  let positionsValue = 0;
  let toClaim = 0;
  
  for (const pos of sharePositions) {
    const tokenIdx = parseInt(pos.tokenIdx);
    const marketId = Math.floor(tokenIdx / 2);
    const direction = tokenIdx % 2 === 1 ? 'UP' : 'DOWN';
    const market = markets.get(marketId);
    
    if (!market) continue;
    
    const shares = parseInt(pos.balance) / 1e6;
    
    // 如果市场已解析
    if (market.status === 2) {
      const isWinner = 
        (market.winningOutcome === 1 && direction === 'UP') ||
        (market.winningOutcome === 0 && direction === 'DOWN');
      
      if (isWinner) {
        toClaim += shares;               // 每份 = 1 USDC
      }
    } else {
      // 未解析市场，按当前价格估值
      const currentPrice = getCurrentMarketPrice(market, direction);
      positionsValue += shares * (currentPrice / 10000);
    }
  }
  
  const totalValue = cash + locked + positionsValue + toClaim;
  
  // TODO: 计算累计盈亏需要历史成本数据
  const profitLoss = 0;
  const profitLossPercent = 0;
  
  return {
    totalValue,
    cash,
    locked,
    positions: positionsValue,
    profitLoss,
    profitLossPercent,
    toClaim
  };
}
```

#### PositionCard 组件

```typescript
interface PositionCardProps {
  marketId: number;
  marketTitle: string;
  side: 'UP' | 'DOWN';
  shares: number;
  avgPrice: number;                      // 平均成本（需从历史计算）
  currentPrice: number;                  // 当前市场价
  cost: number;                          // 总成本
  estValue: number;                      // 当前估值
  unrealizedPnL: number;                 // 未实现盈亏
  unrealizedPnLPercent: number;
  canClaim: boolean;                     // 是否可提取
  claimAmount?: number;                  // 可提取金额
}

function transformToPosition(
  position: any,
  market: any,
  avgPrice: number,                      // 从历史订单计算
  currentPrice: number
): PositionCardProps {
  const shares = parseInt(position.balance) / 1e6;
  const tokenIdx = parseInt(position.tokenIdx);
  const direction = tokenIdx % 2 === 1 ? 'UP' : 'DOWN';
  
  const cost = shares * (avgPrice / 10000);
  const estValue = shares * (currentPrice / 10000);
  const unrealizedPnL = estValue - cost;
  const unrealizedPnLPercent = cost > 0 ? (unrealizedPnL / cost) * 100 : 0;
  
  const isResolved = market.status === 2;
  const isWinner = 
    (market.winningOutcome === 1 && direction === 'UP') ||
    (market.winningOutcome === 0 && direction === 'DOWN');
  
  return {
    marketId: Math.floor(tokenIdx / 2),
    marketTitle: generateMarketTitle(market),
    side: direction,
    shares,
    avgPrice: avgPrice / 100,
    currentPrice: currentPrice / 100,
    cost,
    estValue,
    unrealizedPnL,
    unrealizedPnLPercent,
    canClaim: isResolved && isWinner,
    claimAmount: isResolved && isWinner ? shares : undefined
  };
}

// 计算平均成本（需要从用户历史订单中获取）
async function calculateAvgPrice(
  playerId: [string, string],
  marketId: number,
  direction: 'UP' | 'DOWN'
): Promise<number> {
  // TODO: 需要新的 API 端点获取用户历史订单
  // GET /data/player/:pid1/:pid2/market/:marketId/orders
  
  // 临时实现：假设从成交记录中计算
  const trades = await fetch(`/data/market/${marketId}/trades`).then(r => r.json());
  
  const userTrades = trades.data.filter((t: any) => 
    (t.buyOrderId.startsWith(playerId[0]) || t.sellOrderId.startsWith(playerId[0])) &&
    t.direction === (direction === 'UP' ? 1 : 0)
  );
  
  if (userTrades.length === 0) return 5000; // 默认 50%
  
  const totalCost = userTrades.reduce((sum: number, t: any) => 
    sum + parseInt(t.price) * parseInt(t.amount) / 1e6, 0
  );
  const totalShares = userTrades.reduce((sum: number, t: any) => 
    sum + parseInt(t.amount) / 1e6, 0
  );
  
  return totalShares > 0 ? (totalCost / totalShares) * 10000 : 5000;
}
```

---

## 4. 钱包页 (Wallet)

### 页面路径
- `/wallet`

### 数据源

```typescript
// 用户持仓
GET /data/player/:pid1/:pid2/positions

// 财务活动
GET /data/player/:pid1/:pid2/financial-activity?limit=100

// 充值记录
GET /data/player/:pid1/:pid2/deposits?limit=50

// 提现记录
GET /data/player/:pid1/:pid2/withdrawals?limit=50

// Claim 记录
GET /data/player/:pid1/:pid2/claims?limit=50
```

### 前端组件数据映射

#### WalletBalance 组件

```typescript
interface WalletBalanceProps {
  available: number;                     // 可用 USDC
  locked: number;                        // 锁定 USDC
  total: number;                         // 总计
}

function transformToWalletBalance(positions: any[]): WalletBalanceProps {
  const usdcPosition = positions.find(p => p.tokenIdx === '0');
  
  const available = parseInt(usdcPosition?.balance || '0') / 1e6;
  const locked = parseInt(usdcPosition?.lockBalance || '0') / 1e6;
  
  return {
    available,
    locked,
    total: available + locked
  };
}
```

#### TransactionHistory 组件

```typescript
interface TransactionEntry {
  type: 'Deposit' | 'Withdraw' | 'Trade' | 'Claim';
  amount: number;
  asset: 'USDC' | 'UP' | 'DOWN';
  marketId?: number;
  marketTitle?: string;
  timestamp: Date;
  status: 'Completed' | 'Pending' | 'Failed';
  txHash?: string;
}

function transformToTransactions(activities: any[]): TransactionEntry[] {
  return activities.map(activity => {
    switch (activity.type) {
      case 'deposit':
        return {
          type: 'Deposit',
          amount: parseInt(activity.amount) / 1e6,
          asset: 'USDC',
          timestamp: new Date(activity.timestamp),
          status: 'Completed'
        };
      
      case 'withdrawal':
        return {
          type: 'Withdraw',
          amount: parseInt(activity.amount) / 1e6,
          asset: 'USDC',
          timestamp: new Date(activity.timestamp),
          status: 'Completed'
        };
      
      case 'claim':
        return {
          type: 'Claim',
          amount: parseInt(activity.totalClaimed) / 1e6,
          asset: activity.winningOutcome === 1 ? 'UP' : 'DOWN',
          marketId: parseInt(activity.marketId),
          timestamp: new Date(activity.timestamp),
          status: 'Completed'
        };
      
      default:
        return null;
    }
  }).filter(Boolean) as TransactionEntry[];
}
```

---

## 5. 管理员面板 (Admin)

### 页面路径
- `/admin`

### 数据源

```typescript
// 所有市场
GET /data/markets

// 全局状态
GET /data/state

// 市场订单
GET /data/market/:marketId/orders

// 市场成交
GET /data/market/:marketId/trades
```

### 前端组件数据映射

#### AdminMarketTable 组件

```typescript
interface AdminMarketRow {
  marketId: number;
  assetId: number;
  status: MarketStatus;
  startTick: number;
  endTick: number;
  oracleStartPrice: number;
  oracleEndPrice: number | null;
  winningOutcome: 'UP' | 'DOWN' | 'TIE' | null;
  createdAt: Date;
  actions: ('close' | 'resolve' | 'refund')[];
}

function transformToAdminMarket(market: any): AdminMarketRow {
  return {
    marketId: parseInt(market.marketId),
    assetId: parseInt(market.assetId),
    status: market.status,
    startTick: parseInt(market.startTick),
    endTick: parseInt(market.endTick),
    oracleStartPrice: parseInt(market.oracleStartPrice) / 100,
    oracleEndPrice: market.oracleEndPrice !== '0' 
      ? parseInt(market.oracleEndPrice) / 100 
      : null,
    winningOutcome: getOutcomeLabel(market.winningOutcome),
    createdAt: new Date(),  // TODO: 需要市场创建时间
    actions: getAvailableActions(market)
  };
}

function getAvailableActions(market: any): ('close' | 'resolve' | 'refund')[] {
  const actions: ('close' | 'resolve' | 'refund')[] = [];
  
  if (market.status === 1) {  // Active
    actions.push('close');
  }
  
  if (market.status === 3) {  // Closed
    actions.push('resolve', 'refund');
  }
  
  return actions;
}
```

#### CreateMarketForm 组件

```typescript
interface CreateMarketFormData {
  assetId: number;                       // 1=BTC, 2=ETH
  windowMinutes: 1 | 3 | 5;              // 市场窗口
  startTime: Date;                       // 启动时间
  oracleStartPrice: number;              // 起始价格
}

// 转换为命令参数
function transformToCreateMarketCommand(
  formData: CreateMarketFormData,
  currentTick: number
): {
  assetId: bigint;
  startTick: bigint;
  endTick: bigint;
  oracleStartTime: bigint;
  oracleStartPrice: bigint;
} {
  const startTimestamp = Math.floor(formData.startTime.getTime() / 1000);
  const startTick = BigInt(Math.ceil((startTimestamp - deploymentTime) / 5));
  const windowTicks = formData.windowMinutes === 1 ? 12n : 
                      formData.windowMinutes === 3 ? 36n : 60n;
  
  return {
    assetId: BigInt(formData.assetId),
    startTick,
    endTick: startTick + windowTicks,
    oracleStartTime: BigInt(startTimestamp),
    oracleStartPrice: BigInt(Math.floor(formData.oracleStartPrice * 100))
  };
}
```

---

## 6. 通用组件数据需求

### CountdownTimer 组件

```typescript
interface CountdownTimerProps {
  targetTick: number;
  currentTick: number;
  tickSeconds?: number;                  // 默认 5
  format?: 'full' | 'compact' | 'minimal';
  onExpire?: () => void;
}

// 数据来源
// - targetTick: 从 market.endTick
// - currentTick: 从 globalState.counter
// - 实时更新: 每 5 秒从 WebSocket 获取新的 counter
```

### StatusBadge 组件

```typescript
interface StatusBadgeProps {
  status: MarketStatus;
  size?: 'sm' | 'md' | 'lg';
}

// 数据来源: market.status
// 0=Pending, 1=Active, 2=Resolved, 3=Closed
```

### PriceFlash 组件

```typescript
interface PriceFlashProps {
  currentPrice: number;
  previousPrice: number;
  direction: 'up' | 'down' | 'neutral';
}

// 数据来源: Oracle WebSocket 实时价格
// 比较前后两次价格，触发闪烁动画
```

---

## 数据更新策略总结

### 1. 初始加载

```typescript
async function loadInitialData() {
  // 并行加载
  const [markets, globalState, positions] = await Promise.all([
    fetchMarkets(),
    fetchGlobalState(),
    user ? fetchUserPositions(user.playerId) : null
  ]);
  
  setMarkets(markets);
  setGlobalState(globalState);
  setPositions(positions);
}
```

### 2. 定时轮询

```typescript
// 全局状态（每 5 秒）
useEffect(() => {
  const interval = setInterval(async () => {
    const state = await fetchGlobalState();
    setGlobalState(state);
  }, 5000);
  
  return () => clearInterval(interval);
}, []);

// 市场列表（每 5 秒）
useEffect(() => {
  const interval = setInterval(async () => {
    const markets = await fetchMarkets();
    setMarkets(markets);
  }, 5000);
  
  return () => clearInterval(interval);
}, []);
```

### 3. WebSocket 实时更新

```typescript
// 市场事件
eventService.on(EVENT_INDEXED_OBJECT, (data) => {
  const market = decodeMarketEvent(data);
  updateMarket(market);
});

// 订单事件
eventService.on(EVENT_ORDER, (data) => {
  const order = decodeOrderEvent(data);
  updateOrderBook(order);
});

// 成交事件
eventService.on(EVENT_TRADE, (data) => {
  const trade = decodeTradeEvent(data);
  addTradeToHistory(trade);
});

// 持仓事件
eventService.on(EVENT_POSITION, (data) => {
  const position = decodePositionEvent(data);
  if (isSelfPosition(position.pid)) {
    updateUserPosition(position);
  }
});
```

### 4. Oracle 价格更新

```typescript
// Binance WebSocket
oracleService.subscribe('BTC', (price) => {
  setCurrentPrice(price);
  updateAllMarketCards(price);
  updateChart({ time: Date.now(), price });
});
```

---

## 缺失的 API 端点（需要后端补充）

### 1. 用户历史订单

```typescript
// 获取用户在特定市场的所有订单
GET /data/player/:pid1/:pid2/market/:marketId/orders

// 用途：计算平均成本、显示订单历史
```

### 2. 市场参与者统计

```typescript
// 获取市场的唯一参与者数量
GET /data/market/:marketId/traders

// 响应
{
  "success": true,
  "data": {
    "count": 42,
    "uniquePlayers": [
      { "pid1": "12345", "pid2": "67890" },
      // ...
    ]
  }
}
```

### 3. 用户 P&L 历史

```typescript
// 获取用户的盈亏历史（按市场）
GET /data/player/:pid1/:pid2/pnl-history

// 响应
{
  "success": true,
  "data": [
    {
      "marketId": "1",
      "direction": "UP",
      "totalCost": "50000000",
      "totalClaimed": "60000000",
      "pnl": "10000000",
      "pnlPercent": 20
    }
  ]
}
```

### 4. 全局统计

```typescript
// 获取平台统计数据
GET /data/stats

// 响应
{
  "success": true,
  "data": {
    "totalVolume": "1000000000000",
    "totalMarkets": 100,
    "activeMarkets": 5,
    "totalPlayers": 500,
    "totalTrades": 10000
  }
}
```

---

## 总结

本文档详细说明了：

1. ✅ 每个页面/组件所需的 API 数据
2. ✅ API 响应到前端组件的数据转换逻辑
3. ✅ 实时更新策略（轮询 + WebSocket）
4. ✅ 数据计算公式（价格、费用、P&L等）
5. ✅ 缺失的 API 端点建议

使用本文档可以：
- 快速理解每个页面需要调用哪些 API
- 知道如何将 API 数据转换为组件 props
- 了解实时更新的最佳实践
- 识别后端需要补充的接口

下一步：根据本文档实现前端数据服务层和组件接口。

