// TypeScript interfaces for Prediction Market data structures

export interface MarketData {
    marketId: string;
    question: string;
    description?: string;
    outcome1: string;
    outcome2: string;
    outcome1Token: string;
    outcome2Token: string;
    endTime: string;
    resolutionTime?: string;
    resolvedOutcome?: number;
    creator: string;
    fee: string;
    totalLiquidity: string;
    totalVolume: string;
    status: 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'CLOSED';
    probability1: number;
    probability2: number;
    createdTime: string;
}

export interface OrderData {
    orderId: string;
    marketId: string;
    trader: string;
    orderType: 'YES' | 'NO';
    outcome: number; // 1 or 2
    amount: string;
    price: string;
    filledAmount: string;
    remainingAmount: string;
    status: 'OPEN' | 'FILLED' | 'CANCELLED';
    createdTime: string;
    updatedTime?: string;
}

export interface TradeData {
    tradeId: string;
    marketId: string;
    maker: string;
    taker: string;
    orderType: 'YES' | 'NO';
    outcome: number;
    amount: string;
    price: string;
    timestamp: string;
    tradeType: 'MARKET' | 'LIMIT';
}

export interface PositionData {
    marketId: string;
    question: string;
    outcome1Amount: string;
    outcome2Amount: string;
    outcome1Price: string;
    outcome2Price: string;
    totalValue: string;
    pnl: string;
    pnlPercent: string;
    isResolved: boolean;
    winningOutcome?: number;
}

export interface UserStats {
    balance: string;
    totalInvested: string;
    totalVolume: string;
    totalMarkets: string;
    openPositions: number;
    realizedPnL: string;
    unrealizedPnL: string;
    winRate: number;
}

export interface TransactionHistory {
    id: string;
    type: 'PLACE_ORDER' | 'CANCEL_ORDER' | 'CLAIM' | 'DEPOSIT' | 'WITHDRAW';
    market: string;
    amount: string;
    price?: string;
    outcome?: number;
    timestamp: string;
    status: 'COMPLETED' | 'PENDING' | 'FAILED';
    txHash: string;
    marketId?: string;
}

export interface GlobalState {
    counter: number;
    totalMarkets: number;
    totalPlayers: number;
    totalVolume: string;
    activeMarkets: number;
    resolvedMarkets: number;
}

export interface MarketCreationParams {
    question: string;
    description?: string;
    outcome1: string;
    outcome2: string;
    endTimeOffset: bigint; // End time relative to current counter
    fee: bigint; // Fee percentage (e.g., 1n = 1%)
}

export interface OrderParams {
    marketId: bigint;
    orderType: 'YES' | 'NO';
    outcome: number; // 1 or 2
    amount: bigint;
    price: bigint; // Price in basis points (e.g., 5000 = 0.5)
}

export interface ClaimParams {
    marketId: bigint;
    outcome: number; // Winning outcome
}

// Market state based on global counter
export interface MarketStatusInfo {
    status: 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'CLOSED';
    probability1: number;
    probability2: number;
    timeRemaining?: number; // Seconds remaining if active
}

// Order book data
export interface OrderBook {
    marketId: string;
    yesOrders: OrderData[]; // YES orders (buy orders for outcome 1)
    noOrders: OrderData[]; // NO orders (sell orders for outcome 1 / buy orders for outcome 2)
    lastUpdated: string;
}

// Price calculation utilities
export interface PriceInfo {
    price1: number; // Probability of outcome 1 (0-1)
    price2: number; // Probability of outcome 2 (0-1)
    spread: number; // Bid-ask spread
}

// Transaction state for UI feedback
export interface TransactionState {
    status: 'IDLE' | 'PENDING' | 'SUCCESS' | 'ERROR';
    type?: 'PLACE_ORDER' | 'CANCEL_ORDER' | 'CLAIM' | 'CREATE_MARKET' | 'RESOLVE_MARKET';
    error?: string;
    txHash?: string;
}

// Wallet information interface
export interface WalletInfo {
    address: string;
    isConnected: boolean;
    balance: string;
    pid: [string, string];
}

// Prediction Market Context interface
export interface PredictionMarketContextType {
    api: PredictionMarketAPI | null;
    isConnected: boolean;
    walletInfo: WalletInfo | null;
    markets: MarketData[];
    userPositions: PositionData[];
    userStats: UserStats | null;
    transactionHistory: TransactionHistory[];
    globalState: GlobalState | null;
    loading: boolean;
    error: string | null;
    transactionState: TransactionState;

    // Actions
    connect: () => Promise<void>;
    disconnect: () => void;
    refreshData: () => Promise<void>;

    // Market operations
    createMarket: (params: MarketCreationParams) => Promise<any>;
    placeOrder: (params: OrderParams) => Promise<any>;
    cancelOrder: (orderId: bigint) => Promise<any>;
    claimWinnings: (params: ClaimParams) => Promise<any>;
    resolveMarket: (marketId: bigint, winningOutcome: number) => Promise<any>;

    // Data fetching
    getMarket: (marketId: string) => Promise<MarketData>;
    getMarketOrders: (marketId: string) => Promise<OrderData[]>;
    getMarketTrades: (marketId: string) => Promise<TradeData[]>;
    getUserPositions: (pid1: string, pid2: string) => Promise<PositionData[]>;
}

// API Class import placeholder
export interface PredictionMarketAPI {
    // Commands (matching backend)
    installPlayer(): Promise<any>;
    deposit(amount: bigint, address: string): Promise<any>;
    withdraw(amount: bigint, address: string): Promise<any>;
    placeOrder(marketId: bigint, orderType: bigint, outcome: bigint, amount: bigint, price: bigint): Promise<any>;
    cancelOrder(orderId: bigint): Promise<any>;
    claim(marketId: bigint, outcome: bigint): Promise<any>;
    createMarket(question: string, outcome1: string, outcome2: string, endTimeOffset: bigint, fee: bigint): Promise<any>;
    closeMarket(marketId: bigint): Promise<any>;
    executeTrade(marketId: bigint, makerOrderId: bigint, takerOrderId: bigint, amount: bigint): Promise<any>;
    resolveMarket(marketId: bigint, winningOutcome: bigint): Promise<any>;
    setFeeExempt(address: string, exempt: boolean): Promise<any>;

    // Data queries
    getAllMarkets(): Promise<MarketData[]>;
    getMarket(marketId: string): Promise<MarketData>;
    getMarketOrders(marketId: string): Promise<OrderData[]>;
    getMarketTrades(marketId: string): Promise<TradeData[]>;
    getTradeHistory(marketId: string): Promise<TradeData[]>;
    getUserPositions(pid1: string, pid2: string): Promise<PositionData[]>;
    getGlobalState(): Promise<GlobalState>;
    getUserStats(pid1: string, pid2: string): Promise<UserStats | null>;
    getUserTransactionHistory(pid1: string, pid2: string): Promise<TransactionHistory[]>;
}

// Utility types
export type OrderType = 'YES' | 'NO';
export type MarketStatus = 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'CLOSED';
export type TransactionType = 'PLACE_ORDER' | 'CANCEL_ORDER' | 'CLAIM' | 'DEPOSIT' | 'WITHDRAW';
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED';

// Error handling
export interface PredictionMarketError {
    code: string;
    message: string;
    details?: any;
}

// Market validation
export interface MarketValidationError {
    field: string;
    message: string;
}

// Order validation result
export interface OrderValidationResult {
    isValid: boolean;
    error?: string;
    maxAmount?: bigint;
    minPrice?: bigint;
    maxPrice?: bigint;
}