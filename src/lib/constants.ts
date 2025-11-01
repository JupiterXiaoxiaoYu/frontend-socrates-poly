// Constants from Rust backend config

export const PRICE_PRECISION = 10000; // BPS base
export const AMOUNT_PRECISION = 1000000;
export const PROTOCOL_FEE_BPS = 200; // 2%
export const TICK_SECONDS = 5;
export const SUPPORTED_WINDOWS = [12, 36, 60]; // ticks = 1, 3, 5 minutes
export const GRACE_PERIOD_TICKS = 12; // 1 minute

// Token indices
export const TOKEN_USDC = 0;
export const TOKEN_SHARE_YES = (marketId: number) => marketId * 2 + 1;
export const TOKEN_SHARE_NO = (marketId: number) => marketId * 2 + 2;

// Error messages
export const ERROR_MESSAGES: Record<number, string> = {
  1: "Insufficient balance",
  2: "Market not found",
  3: "Market not active",
  4: "Order not found",
  5: "Invalid price",
  6: "Invalid amount",
  7: "Order not active",
  8: "Market already resolved",
  9: "Unauthorized access",
  10: "Invalid parameters",
};

// Time constants
export const HEARTBEAT_TIMEOUT = 10000; // 10 seconds
export const PRICE_UPDATE_INTERVAL = 1000; // 1 second
export const RECONNECT_DELAY = 2000; // 2 seconds
export const MAX_RECONNECT_ATTEMPTS = 5;

// UI constants
export const ORDERS_PER_PAGE = 20;
export const TRADES_PER_PAGE = 50;
export const MAX_CHART_DATA_POINTS = 300;
