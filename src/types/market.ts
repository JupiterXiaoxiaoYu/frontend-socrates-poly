// Type definitions aligned with Rust backend

export enum MarketStatus {
  PENDING = 0,
  ACTIVE = 1,
  RESOLVED = 2,
  CLOSED = 3,
}

export enum OutcomeType {
  DOWN = 0,
  UP = 1,
}

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

export enum Outcome {
  DOWN = 0,
  UP = 1,
  TIE = 2,
  UNRESOLVED = 255,
}

export interface Market {
  marketId: number;
  assetId: number;
  status: MarketStatus;
  outcomeType: OutcomeType;
  startTick: number;
  endTick: number;
  oracleStartTime: number;
  oracleStartPrice: number;
  oracleEndTime: number;
  oracleEndPrice: number;
  winningOutcome: Outcome;
  
  // Derived/UI fields
  title?: string;
  currentPrice?: number;
  yesChance?: number;
  noChance?: number;
  volume?: number;
  traders?: number;
  liquidity?: number;
  timeRemaining?: number; // 剩余时间（毫秒）
}

export interface Order {
  id: number;
  pid: [number, number];
  marketId: number;
  orderType: OrderType;
  status: OrderStatus;
  price: number; // BPS (0-10000)
  totalAmount: number;
  filledAmount: number;
  lockedAmount: number;
  createTick: number;
}

export interface Trade {
  id: number;
  marketId: number;
  buyOrderId: number;
  sellOrderId: number;
  price: number; // BPS
  amount: number;
  tick: number;
}

export interface Position {
  pid: [number, number];
  tokenIdx: number; // 0=USDC, others=market shares
  balance: number;
  lockBalance: number;
  
  // Derived/UI fields
  marketId?: number;
  side?: 'yes' | 'no';
  avgPrice?: number;
  currentPrice?: number;
  unrealizedPnL?: number;
  unrealizedPnLPercent?: number;
}

export interface GlobalState {
  counter: number; // Current tick
  nextMarketId: number;
  nextOrderId: number;
  nextTradeId: number;
  totalPlayers: number;
  totalFunds: number; // Protocol fee pool
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number; // Cumulative
  myOrders?: number;
}

export interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  midPrice: number;
}

export interface OraclePrice {
  asset: string;
  price: number;
  timestamp: number;
  source: string;
}

export interface UserState {
  publicKey: string;
  balance: number;
  lockedBalance: number;
  positions: Position[];
  isConnected: boolean;
  isFeeExempt: boolean;
}

export type MarketFilter = {
  duration: '1min' | '3min' | '5min' | 'all';
  status: 'all' | 'pending' | 'active' | 'closed' | 'resolved';
  asset: 'BTC' | 'ETH' | 'SOL' | 'all';
};
