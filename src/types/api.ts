// API 数据类型定义
// 基于后端 socrates-prediction-mkt 的数据结构

// ==================== 市场相关 ====================

export enum MarketStatus {
  Pending = 0,   // 等待启动
  Active = 1,    // 交易中
  Resolved = 2,  // 已解析
  Closed = 3,    // 已关闭（等待解析）
}

export enum MarketOutcome {
  Down = 0,  // 看跌胜出
  Up = 1,    // 看涨胜出
  Tie = 2,   // 平局
}

export enum MarketDirection {
  Down = 0,  // 看跌市场
  Up = 1,    // 看涨市场
}

export interface SubMarket {
  orders: string[];        // 订单ID列表
  volume: string;          // 成交量
  lastOrderId: string;     // 最后一个订单ID
}

export interface Market {
  marketId: string;
  assetId: string;              // 1=BTC, 2=ETH
  status: MarketStatus;
  startTick: string;
  endTick: string;
  windowTicks: string;
  windowMinutes: number;        // 1/3/5 分钟
  oracleStartTime: string;      // Unix timestamp (秒)
  oracleStartPrice: string;     // 价格 × 100
  oracleEndTime: string;
  oracleEndPrice: string;
  winningOutcome: MarketOutcome;
  upMarket: SubMarket;
  downMarket: SubMarket;
  isClosed: boolean;
  isResolved: boolean;
}

// ==================== 订单相关 ====================

export enum OrderType {
  LIMIT_BUY = 0,
  LIMIT_SELL = 1,
  MARKET_BUY = 2,
  MARKET_SELL = 3,
}

export enum OrderStatus {
  ACTIVE = 0,
  FILLED = 1,
  CANCELLED = 2,
}

export interface Order {
  orderId: string;
  pid1: string;
  pid2: string;
  marketId: string;
  direction: MarketDirection;    // 0=DOWN, 1=UP
  orderType: OrderType;
  status: OrderStatus;
  price: string;                 // BPS (0-10000)
  totalAmount: string;           // 份额总数（精度 1e6）
  filledAmount: string;          // 已成交
  lockedAmount: string;          // 锁定 USDC
  createTick: string;
  updatedAt: string;
}

// ==================== 成交相关 ====================

export interface Trade {
  tradeId: string;
  marketId: string;
  direction: MarketDirection;
  buyOrderId: string;
  sellOrderId: string;
  price: string;                 // BPS
  amount: string;                // 份额数量
  tick: string;
  createdAt: string;
}

// ==================== 持仓相关 ====================

export interface Position {
  pid1: string;
  pid2: string;
  tokenIdx: string;              // 0=USDC, 其他=市场份额
  balance: string;               // 可用余额（精度 1e6）
  lockBalance: string;           // 锁定余额
}

// ==================== 财务事件 ====================

export interface DepositEvent {
  pid: [string, string];
  amount: string;
  nonce: string;
  callerPid: [string, string];
  timestamp: string;
}

export interface WithdrawEvent {
  pid: [string, string];
  amount: string;
  nonce: string;
  timestamp: string;
}

export interface ClaimEvent {
  pid: [string, string];
  marketId: string;
  totalClaimed: string;
  winningOutcome: MarketOutcome;
  assetId: string;
  windowMinutes: string;
  timestamp: string;
}

export interface FinancialActivity {
  type: 'deposit' | 'withdrawal' | 'claim';
  pid: [string, string];
  amount: string;
  marketId?: string;
  timestamp: string;
  // Deposit 特有
  callerPid?: [string, string];
  nonce?: string;
  // Claim 特有
  totalClaimed?: string;
  winningOutcome?: MarketOutcome;
  assetId?: string;
  windowMinutes?: string;
}

// ==================== 全局状态 ====================

export interface GlobalState {
  counter: string;               // 当前 tick 计数器
  totalFunds: string;            // 累计协议费
  totalPlayers: string;
  nextMarketId: string;
  nextOrderId: string;
  nextTradeId: string;
}

// ==================== API 响应 ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== 命令类型 ====================

export type OrderTypeCommand = 'limit_buy' | 'limit_sell' | 'market_buy' | 'market_sell';
export type DirectionCommand = 'UP' | 'DOWN';

export interface PlaceOrderParams {
  marketId: bigint;
  direction: DirectionCommand;
  orderType: OrderTypeCommand;
  price: bigint;                 // BPS (0-10000)
  amount: bigint;                // 份额数量（精度 1e6）
}

export interface CreateMarketParams {
  assetId: bigint;
  startTick: bigint;
  endTick: bigint;
  oracleStartTime: bigint;
  oracleStartPrice: bigint;
}

// ==================== 玩家 ID ====================

export type PlayerId = [string, string];

