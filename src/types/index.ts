// Type exports for prediction market integration
export type {
    MarketData,
    OrderData,
    TradeData,
    PositionData,
    UserStats,
    TransactionHistory,
    GlobalState,
    MarketCreationParams,
    OrderParams,
    ClaimParams,
    MarketStatusInfo,
    OrderBook,
    PriceInfo,
    TransactionState,
    WalletInfo,
    PredictionMarketContextType,
    PredictionMarketAPI,
    OrderType,
    MarketStatus,
    TransactionType,
    TransactionStatus,
    PredictionMarketError,
    MarketValidationError,
    OrderValidationResult
} from './prediction-market';

// Export market types
export type {
    Market,
    Order,
    Trade,
    Position,
    OrderBookData,
    OraclePrice,
    PlayerState,
    ExchangeState
} from './market';

export enum MarketStatus {
  Pending = 0,
  Active = 1,
  Resolved = 2,
  Closed = 3,
}

export enum Outcome {
  Down = 0,
  Up = 1,
  Tie = 2,
}

export enum OrderType {
  LimitBuy = 0,
  LimitSell = 1,
  MarketBuy = 2,
  MarketSell = 3,
}

export enum OrderStatus {
  Active = 0,
  Filled = 1,
  Cancelled = 2,
  PartiallyFilled = 3,
}