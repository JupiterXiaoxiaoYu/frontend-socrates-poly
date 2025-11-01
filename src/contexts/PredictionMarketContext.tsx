import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWallet } from './WalletContext';
import { createPredictionMarketAPI, createRESTAPI, PredictionMarketAPI } from '../services/api';
import { toast } from 'sonner';
import { bnToHexLe } from 'delphinus-curves/src/altjubjub';
import { LeHexBN } from 'zkwasm-minirollup-rpc';

// Type definitions
interface MarketData {
    id: string;
    question: string;
    outcome1: string;
    outcome2: string;
    endTime: string;
    fee: string;
    status: 'PENDING' | 'ACTIVE' | 'CLOSED' | 'RESOLVED';
    resolvedOutcome?: number;
    creator: string;
    totalVolume: string;
    orders: OrderData[];
}

interface OrderData {
    id: string;
    marketId: string;
    orderType: 'YES' | 'NO';
    outcome: number;
    amount: string;
    price: string;
    filled: string;
    status: 'OPEN' | 'FILLED' | 'CANCELLED';
    trader: string;
    timestamp: string;
}

interface PositionData {
    marketId: string;
    marketQuestion: string;
    outcome: number;
    amount: string;
    averagePrice: string;
    currentValue: string;
    pnl: string;
    status: 'OPEN' | 'CLOSED';
}

interface TradeData {
    id: string;
    marketId: string;
    makerOrderId: string;
    takerOrderId: string;
    price: string;
    amount: string;
    timestamp: string;
}

interface UserStats {
    balance: string;
    totalInvested: string;
    totalVolume: string;
    totalMarkets: string;
    openPositions: number;
    realizedPnL: string;
    unrealizedPnL: string;
    winRate: number;
}

interface TransactionHistory {
    id: string;
    type: 'CREATE_MARKET' | 'PLACE_ORDER' | 'CANCEL_ORDER' | 'CLAIM' | 'RESOLVE_MARKET';
    marketId?: string;
    amount: string;
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    timestamp: string;
    details?: string;
}

interface GlobalState {
    counter: number;
    totalMarkets: number;
    totalVolume: string;
    totalUsers: number;
}

interface TransactionState {
    status: 'IDLE' | 'PENDING' | 'SUCCESS' | 'ERROR';
    type?: 'CREATE_MARKET' | 'PLACE_ORDER' | 'CANCEL_ORDER' | 'CLAIM' | 'RESOLVE_MARKET';
    error?: string;
}

interface MarketCreationParams {
    question: string;
    outcome1: string;
    outcome2: string;
    endTimeOffset: number;
    fee: number;
}

interface OrderParams {
    marketId: string;
    orderType: 'YES' | 'NO';
    outcome: number;
    amount: string;
    price: string;
}

interface ClaimParams {
    marketId: string;
    outcome: number;
}

interface WalletInfo {
    address: string;
    isConnected: boolean;
    balance: string;
    pid: [string, string];
}

interface PredictionMarketContextType {
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
    connect: () => void;
    disconnect: () => void;
    refreshData: () => Promise<void>;
    createMarket: (params: MarketCreationParams) => Promise<any>;
    placeOrder: (params: OrderParams) => Promise<any>;
    cancelOrder: (orderId: bigint) => Promise<any>;
    claimWinnings: (params: ClaimParams) => Promise<any>;
    resolveMarket: (marketId: bigint, winningOutcome: number) => Promise<any>;
    getMarket: (marketId: string) => Promise<MarketData>;
    getMarketOrders: (marketId: string) => Promise<OrderData[]>;
    getMarketTrades: (marketId: string) => Promise<TradeData[]>;
    getUserPositions: (pid1: string, pid2: string) => Promise<PositionData[]>;
}

interface PredictionMarketProviderProps {
    children: React.ReactNode;
    config: {
        serverUrl: string;
        privkey?: string;
    };
}

// Add interface for player state from RPC query
interface PlayerStateData {
    balance: string;
    nonce: string;
}

interface GlobalPlayerState {
    data: PlayerStateData;
}

const PredictionMarketContext = createContext<PredictionMarketContextType | undefined>(undefined);

export const PredictionMarketProvider: React.FC<PredictionMarketProviderProps> = ({ children, config }) => {
    console.log('PredictionMarketProvider: Component mounted with config:', config);

    const [api, setApi] = useState<PredictionMarketAPI | null>(null);
    const [markets, setMarkets] = useState<MarketData[]>([]);
    const [userPositions, setUserPositions] = useState<PositionData[]>([]);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
    const [globalState, setGlobalState] = useState<GlobalState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transactionState, setTransactionState] = useState<TransactionState>({
        status: 'IDLE'
    });
    const [playerInstalled, setPlayerInstalled] = useState(false);
    const [apiInitializing, setApiInitializing] = useState(false);
    const [userBalance, setUserBalance] = useState<string>("0");
    const [fallbackInitialized, setFallbackInitialized] = useState(false);
    const [globalCounter, setGlobalCounter] = useState<number>(0);

    // Error code mapping function
    const getErrorMessage = (error: any): string => {
        const errorMessage = error?.message || error?.toString() || 'Unknown error';

        // Check for specific error patterns
        if (errorMessage.includes('InvalidOrderAmount')) {
            return 'Invalid order amount. Please ensure: 1) Amount is greater than 0, 2) Sufficient balance for margin requirements.';
        }
        if (errorMessage.includes('InvalidPrice')) {
            return 'Invalid price. Price must be between 0 and 10000 basis points (0-100%).';
        }
        if (errorMessage.includes('InsufficientBalance')) {
            return 'Insufficient balance. Please deposit more funds to continue.';
        }
        if (errorMessage.includes('MarketNotActive')) {
            return 'This market is not currently active for trading.';
        }
        if (errorMessage.includes('MarketResolved')) {
            return 'This market has been resolved and is no longer accepting orders.';
        }
        if (errorMessage.includes('OrderNotFound')) {
            return 'Order not found or already filled/cancelled.';
        }
        if (errorMessage.includes('CannotCancelFilledOrder')) {
            return 'Cannot cancel an order that has already been filled.';
        }
        if (errorMessage.includes('InvalidClaim')) {
            return 'Invalid claim. Please ensure the market is resolved and you have a position in the winning outcome.';
        }
        if (errorMessage.includes('AlreadyClaimed')) {
            return 'You have already claimed your winnings from this market.';
        }
        if (errorMessage.includes('PlayerNotExist')) {
            return 'Player account not found. Please try connecting your wallet again.';
        }
        if (errorMessage.includes('PlayerAlreadyExist')) {
            return 'Player account already exists.';
        }
        if (errorMessage.includes('InvalidMarketCreation')) {
            return 'Invalid market creation parameters. Please check your inputs.';
        }
        if (errorMessage.includes('MarketCreationFailed')) {
            return 'Failed to create market. Please try again later.';
        }

        // Default error message
        return errorMessage;
    };

    // Use wallet context from zkWasm SDK
    const walletData = useWallet();
    const { l1Account, l2Account, playerId, setPlayerId, isConnected, connectL1 } = walletData;

    console.log('PredictionMarketProvider: Wallet state:', {
        hasL1Account: !!l1Account,
        hasL2Account: !!l2Account,
        playerId,
        isConnected
    });

    // Auto-connect L1 when RainbowKit connection is established
    useEffect(() => {
        if (isConnected && !l1Account) {
            console.log('PredictionMarketContext: Auto-connecting L1 account...');
            connectL1();
        }
    }, [isConnected, l1Account, connectL1]);

    // Initialize API when L2 account is available OR use fallback for public data
    useEffect(() => {
        console.log('PredictionMarketContext: API initialization check:', {
            hasL2Account: !!l2Account,
            hasPrivateKey: !!(l2Account && l2Account.getPrivateKey),
            hasApi: !!api,
            apiInitializing,
            fallbackInitialized
        });

        if (l2Account && l2Account.getPrivateKey && !apiInitializing) {
            // If wallet is connected, always reinitialize API with user's private key
            if (fallbackInitialized || !api) {
                console.log('PredictionMarketContext: Reinitializing API with wallet private key...');
                setFallbackInitialized(false);
                setApi(null);
                setPlayerInstalled(false);
                initializeAPI();
            }
        } else if (!l2Account && !apiInitializing) {
            // If no wallet is connected, ensure we have fallback API
            if (!fallbackInitialized || !api) {
                console.log('PredictionMarketContext: Initializing/reinitializing API with fallback...');
                setFallbackInitialized(true);
                setApi(null);
                setPlayerInstalled(false);
                initializeAPIWithFallback();
            }
        }
    }, [l2Account, api, apiInitializing, fallbackInitialized]);

    // Reset user-specific state when wallet is disconnected
    useEffect(() => {
        if (!l1Account && !l2Account && fallbackInitialized) {
            console.log('PredictionMarketContext: Wallet disconnected, resetting user data and switching back to fallback mode');
            setUserPositions([]);
            setUserStats(null);
            setTransactionHistory([]);
            setLoading(false);
            setError(null);
        }
    }, [l1Account, l2Account, fallbackInitialized]);

    // Auto-install player when L2 is connected and API is ready
    useEffect(() => {
        if (l2Account && !playerInstalled && api) {
            const autoInstall = async () => {
                if (!api || playerInstalled) return;

                try {
                    console.log("Auto-installing player...");
                    const result = await api.installPlayer();
                    console.log("Player installation completed:", result);
                    setPlayerInstalled(true);

                    // Generate player ID from L2 account
                    const generatePlayerIdFromL2 = (): [string, string] | null => {
                        try {
                            if (l2Account.pubkey) {
                                const pubkey = l2Account.pubkey;
                                const leHexBN = new LeHexBN(bnToHexLe(pubkey));
                                const pkeyArray = leHexBN.toU64Array();
                                const playerId: [string, string] = [pkeyArray[1].toString(), pkeyArray[2].toString()];
                                console.log("Generated player ID from L2 account:", playerId);
                                return playerId;
                            }
                            return null;
                        } catch (error) {
                            console.error("Failed to generate player ID from L2:", error);
                            return null;
                        }
                    };

                    const generatedPlayerId = generatePlayerIdFromL2();
                    if (generatedPlayerId) {
                        setPlayerId(generatedPlayerId);
                        console.log("Player ID set from L2 account:", generatedPlayerId);
                    }
                } catch (err) {
                    // Handle PlayerAlreadyExist as success case
                    if (err instanceof Error && (err.message.includes("PlayerAlreadyExist") || err.message.includes("PlayerAlreadyExists"))) {
                        console.log("Player already installed, continuing...");
                        setPlayerInstalled(true);

                        // Still need to generate player ID even if player already exists
                        const generatePlayerIdFromL2 = (): [string, string] | null => {
                            try {
                                if (l2Account.pubkey) {
                                    const pubkey = l2Account.pubkey;
                                    const leHexBN = new LeHexBN(bnToHexLe(pubkey));
                                    const pkeyArray = leHexBN.toU64Array();
                                    const playerId: [string, string] = [pkeyArray[1].toString(), pkeyArray[2].toString()];
                                    console.log("Generated player ID from L2 account:", playerId);
                                    return playerId;
                                }
                                return null;
                            } catch (error) {
                                console.error("Failed to generate player ID from L2:", error);
                                return null;
                            }
                        };

                        const generatedPlayerId = generatePlayerIdFromL2();
                        if (generatedPlayerId) {
                            setPlayerId(generatedPlayerId);
                            console.log("Player ID set from L2 account:", generatedPlayerId);
                        }
                        return;
                    }
                    console.error("Auto-install failed:", err);
                }
            };

            autoInstall();
        }
    }, [l2Account, playerInstalled, api]);

    // Set up polling when API is ready and either player is installed OR using fallback
    useEffect(() => {
        console.log('PredictionMarketContext: Polling setup check:', {
            hasApi: !!api,
            playerInstalled,
            isConnected
        });

        if (api && playerInstalled) {
            console.log("PredictionMarketContext: API ready and player installed, starting data polling...");

            // Load initial data
            loadInitialData();

            // Set up polling interval (every 5 seconds)
            const pollInterval = setInterval(() => {
                console.log('PredictionMarketContext: 5-second auto refresh triggered');
                refreshData(false);
            }, 5000);

            return () => {
                console.log('PredictionMarketContext: Cleaning up polling interval');
                clearInterval(pollInterval);
            };
        } else {
            console.log('PredictionMarketContext: Not starting polling - requirements not met');
        }
    }, [api, playerInstalled]);

    // Initialize API connection
    const initializeAPI = useCallback(() => {
        if (apiInitializing) return;

        setApiInitializing(true);
        setError(null);

        try {
            if (!l2Account || !l2Account.getPrivateKey) {
                throw new Error('L2 account not available. Please connect wallet and login to L2 first.');
            }

            console.log('PredictionMarketContext: Initializing API with config:', {
                serverUrl: config.serverUrl,
                hasPrivateKey: !!l2Account.getPrivateKey()
            });

            const apiInstance = createPredictionMarketAPI({
                serverUrl: config.serverUrl,
                privkey: l2Account.getPrivateKey()
            });

            setApi(apiInstance);
            console.log("PredictionMarketContext: API initialized successfully with serverUrl:", config.serverUrl);
        } catch (err) {
            console.error('Failed to initialize API:', err);
            setError(err instanceof Error ? err.message : 'Failed to initialize API');
        } finally {
            setApiInitializing(false);
        }
    }, [config, l2Account, apiInitializing]);

    // Initialize API with fallback private key for public data access
    const initializeAPIWithFallback = useCallback(() => {
        if (apiInitializing) return;

        setApiInitializing(true);
        setError(null);

        try {
            console.log('PredictionMarketContext: Initializing API with fallback private key for public data access');

            // Use a fallback private key for public data access
            const fallbackPrivkey = "000000";

            const apiInstance = createPredictionMarketAPI({
                serverUrl: config.serverUrl,
                privkey: fallbackPrivkey
            });

            setApi(apiInstance);
            setPlayerInstalled(true); // Set as installed to enable data polling
            console.log("PredictionMarketContext: API initialized successfully with fallback private key");
        } catch (err) {
            console.error('Failed to initialize API with fallback:', err);
            setError(err instanceof Error ? err.message : 'Failed to initialize API');
        } finally {
            setApiInitializing(false);
        }
    }, [config, apiInitializing]);

    // Load initial data
    const loadInitialData = useCallback(async () => {
        if (!api) return;

        setLoading(true);
        try {
            await refreshData(true); // true = initial load
        } catch (error) {
            console.error('Failed to load initial data:', error);
        } finally {
            setLoading(false);
        }
    }, [api]);

    // Refresh all data
    const refreshData = useCallback(async (isInitialLoad = false) => {
        if (!api) {
            console.log('PredictionMarketContext: Cannot refresh data - api not available');
            return;
        }

        try {
            if (!isInitialLoad) {
                setError(null);
            }

            console.log('PredictionMarketContext: Starting data refresh...');

            let currentBalance = "0.00";

            // Query user balance and global state using RPC if L2 account is available
            if (l2Account && l2Account.getPrivateKey) {
                try {
                    console.log('PredictionMarketContext: Querying user balance and global state via RPC...');
                    const rpcResponse: any = await api.rpc.queryState(l2Account.getPrivateKey());
                    console.log('PredictionMarketContext: RPC response:', rpcResponse);

                    if (rpcResponse && rpcResponse.success && rpcResponse.data) {
                        const parsedData = JSON.parse(rpcResponse.data);
                        console.log('PredictionMarketContext: Parsed RPC data:', parsedData);

                        if (parsedData.player && parsedData.player.data && parsedData.player.data.balance) {
                            const balanceRaw = BigInt(parsedData.player.data.balance);
                            const balancePoints = Number(balanceRaw).toFixed(0);
                            currentBalance = balancePoints;
                            setUserBalance(balancePoints);
                            console.log('PredictionMarketContext: User balance:', balancePoints, 'points');
                        } else {
                            setUserBalance("0.00");
                        }

                        // Extract global counter
                        if (parsedData.state && parsedData.state.counter) {
                            const counter = parsedData.state.counter;
                            setGlobalCounter(counter);
                            console.log('PredictionMarketContext: Global counter:', counter);
                        }
                    } else {
                        setUserBalance("0.00");
                    }
                } catch (balanceError) {
                    console.warn('PredictionMarketContext: Failed to query balance via RPC:', balanceError);
                    setUserBalance("0.00");
                }
            } else {
                // For fallback mode, try to get global counter from RPC with fallback key
                try {
                    console.log('PredictionMarketContext: Querying global state via RPC with fallback key...');
                    const fallbackPrivkey = "000000";
                    const rpcResponse: any = await api.rpc.queryState(fallbackPrivkey);
                    console.log('PredictionMarketContext: Fallback RPC response:', rpcResponse);

                    if (rpcResponse && rpcResponse.success && rpcResponse.data) {
                        const parsedData = JSON.parse(rpcResponse.data);

                        if (parsedData.state && parsedData.state.counter) {
                            const counter = parsedData.state.counter;
                            setGlobalCounter(counter);
                            console.log('PredictionMarketContext: Global counter from fallback:', counter);
                        }
                    }
                } catch (fallbackError) {
                    console.warn('PredictionMarketContext: Failed to query global state via fallback RPC:', fallbackError);
                }
                setUserBalance("0.00");
            }

            // Fetch all markets
            console.log('PredictionMarketContext: Calling api.getAllMarkets()...');
            const allMarkets = await api.getAllMarkets();
            console.log('PredictionMarketContext: Received markets:', allMarkets);

            // Update market status based on global counter
            const marketsWithUpdatedStatus = allMarkets.map(market => {
                let status: MarketData['status'];
                const endTime = parseInt(market.endTime);

                if (market.resolvedOutcome && market.resolvedOutcome > 0) {
                    status = 'RESOLVED';
                } else if (globalCounter >= endTime) {
                    status = 'CLOSED';
                } else if (market.status === 'PENDING') {
                    status = 'PENDING';
                } else {
                    status = 'ACTIVE';
                }

                return {
                    ...market,
                    status
                };
            });

            setMarkets(marketsWithUpdatedStatus);

            // Fetch global state
            try {
                const globalStateData = await api.getGlobalState();
                if (globalStateData) {
                    setGlobalState(globalStateData);
                    if (globalStateData.counter !== globalCounter) {
                        setGlobalCounter(globalStateData.counter);
                    }
                }
            } catch (globalStateError) {
                console.warn('PredictionMarketContext: Failed to fetch global state:', globalStateError);
            }

            // Only fetch user data if player is fully connected
            if (playerId && isConnected && l2Account) {
                console.log('PredictionMarketContext: Fetching user data for playerId:', playerId);
                const [pid1, pid2] = playerId;

                try {
                    const [positions, stats, history] = await Promise.all([
                        api.getUserPositions(pid1, pid2),
                        api.getUserStats(pid1, pid2),
                        api.getUserTransactionHistory(pid1, pid2)
                    ]);

                    setUserPositions(positions);

                    // Update stats with real balance from RPC
                    if (stats) {
                        const updatedStats = {
                            ...stats,
                            balance: currentBalance
                        };
                        setUserStats(updatedStats);
                    } else {
                        // Create stats with balance if none exist
                        setUserStats({
                            balance: currentBalance,
                            totalInvested: "0",
                            totalVolume: "0",
                            totalMarkets: "0",
                            openPositions: 0,
                            realizedPnL: "0",
                            unrealizedPnL: "0",
                            winRate: 0
                        });
                    }

                    setTransactionHistory(history);
                    console.log('PredictionMarketContext: User data refresh completed successfully');
                } catch (userDataError) {
                    console.warn('PredictionMarketContext: Failed to fetch user data (user may not have any data yet):', userDataError);
                    // Set empty defaults for user data but keep the balance
                    setUserPositions([]);
                    setUserStats({
                        balance: currentBalance,
                        totalInvested: "0",
                        totalVolume: "0",
                        totalMarkets: "0",
                        openPositions: 0,
                        realizedPnL: "0",
                        unrealizedPnL: "0",
                        winRate: 0
                    });
                    setTransactionHistory([]);
                }
            } else {
                console.log('PredictionMarketContext: Skipping user data fetch - user not fully connected');
                setUserPositions([]);
                if (currentBalance !== "0.00") {
                    setUserStats({
                        balance: currentBalance,
                        totalInvested: "0",
                        totalVolume: "0",
                        totalMarkets: "0",
                        openPositions: 0,
                        realizedPnL: "0",
                        unrealizedPnL: "0",
                        winRate: 0
                    });
                } else {
                    setUserStats(null);
                }
                setTransactionHistory([]);
            }

            console.log('PredictionMarketContext: Data refresh completed successfully');
        } catch (err) {
            console.error('PredictionMarketContext: Failed to refresh data:', err);
            if (isInitialLoad) {
                setError(err instanceof Error ? err.message : 'Failed to refresh data');
            }
        }
    }, [api, playerId, isConnected, l2Account, globalCounter]);

    // Market operations
    const createMarket = useCallback(async (params: MarketCreationParams) => {
        if (!api) {
            throw new Error('API not available');
        }
        if (!isConnected || fallbackInitialized) {
            throw new Error('Wallet not connected or using fallback mode');
        }

        try {
            setTransactionState({ status: 'PENDING', type: 'CREATE_MARKET' });

            const result = await api.createMarket(
                params.question,
                params.outcome1,
                params.outcome2,
                params.endTimeOffset,
                params.fee
            );

            setTransactionState({ status: 'SUCCESS', type: 'CREATE_MARKET' });

            // Refresh data after successful market creation
            await refreshData();

            return result;
        } catch (error) {
            const friendlyErrorMessage = getErrorMessage(error);
            setTransactionState({ status: 'ERROR', type: 'CREATE_MARKET', error: friendlyErrorMessage });
            throw new Error(friendlyErrorMessage);
        }
    }, [api, isConnected, fallbackInitialized, refreshData]);

    const placeOrder = useCallback(async (params: OrderParams) => {
        if (!api) {
            throw new Error('API not available');
        }
        if (!isConnected || fallbackInitialized) {
            throw new Error('Wallet not connected or using fallback mode');
        }

        try {
            setTransactionState({ status: 'PENDING', type: 'PLACE_ORDER' });

            const orderTypeValue = params.orderType === 'YES' ? 1n : 2n;
            const outcome = BigInt(params.outcome);
            const amount = BigInt(params.amount);
            const price = BigInt(params.price);

            const result = await api.placeOrder(
                params.marketId,
                orderTypeValue,
                outcome,
                amount,
                price
            );

            setTransactionState({ status: 'SUCCESS', type: 'PLACE_ORDER' });

            // Refresh data after successful order placement
            await refreshData();

            return result;
        } catch (error) {
            const friendlyErrorMessage = getErrorMessage(error);
            setTransactionState({ status: 'ERROR', type: 'PLACE_ORDER', error: friendlyErrorMessage });
            throw new Error(friendlyErrorMessage);
        }
    }, [api, isConnected, fallbackInitialized, refreshData]);

    const cancelOrder = useCallback(async (orderId: bigint) => {
        if (!api) {
            throw new Error('API not available');
        }
        if (!isConnected || fallbackInitialized) {
            throw new Error('Wallet not connected or using fallback mode');
        }

        try {
            setTransactionState({ status: 'PENDING', type: 'CANCEL_ORDER' });

            const result = await api.cancelOrder(orderId);

            setTransactionState({ status: 'SUCCESS', type: 'CANCEL_ORDER' });

            // Refresh data after successful order cancellation
            await refreshData();

            return result;
        } catch (error) {
            const friendlyErrorMessage = getErrorMessage(error);
            setTransactionState({ status: 'ERROR', type: 'CANCEL_ORDER', error: friendlyErrorMessage });
            throw new Error(friendlyErrorMessage);
        }
    }, [api, isConnected, fallbackInitialized, refreshData]);

    const claimWinnings = useCallback(async (params: ClaimParams) => {
        if (!api) {
            throw new Error('API not available');
        }
        if (!isConnected || fallbackInitialized) {
            throw new Error('Wallet not connected or using fallback mode');
        }

        try {
            setTransactionState({ status: 'PENDING', type: 'CLAIM' });

            const outcome = BigInt(params.outcome);
            const result = await api.claim(params.marketId, outcome);

            setTransactionState({ status: 'SUCCESS', type: 'CLAIM' });

            // Refresh data after successful claim
            await refreshData();

            return result;
        } catch (error) {
            const friendlyErrorMessage = getErrorMessage(error);
            setTransactionState({ status: 'ERROR', type: 'CLAIM', error: friendlyErrorMessage });
            throw new Error(friendlyErrorMessage);
        }
    }, [api, isConnected, fallbackInitialized, refreshData]);

    const resolveMarket = useCallback(async (marketId: bigint, winningOutcome: number) => {
        if (!api) {
            throw new Error('API not available');
        }
        if (!isConnected || fallbackInitialized) {
            throw new Error('Wallet not connected or using fallback mode');
        }

        try {
            setTransactionState({ status: 'PENDING', type: 'RESOLVE_MARKET' });

            const outcome = BigInt(winningOutcome);
            const result = await api.resolveMarket(marketId, outcome);

            setTransactionState({ status: 'SUCCESS', type: 'RESOLVE_MARKET' });

            // Refresh data after successful market resolution
            await refreshData();

            return result;
        } catch (error) {
            const friendlyErrorMessage = getErrorMessage(error);
            setTransactionState({ status: 'ERROR', type: 'RESOLVE_MARKET', error: friendlyErrorMessage });
            throw new Error(friendlyErrorMessage);
        }
    }, [api, isConnected, fallbackInitialized, refreshData]);

    // Data fetching methods
    const getMarket = useCallback(async (marketId: string): Promise<MarketData> => {
        if (!api) {
            throw new Error('API not available');
        }
        return await api.getMarket(marketId);
    }, [api]);

    const getMarketOrders = useCallback(async (marketId: string): Promise<OrderData[]> => {
        if (!api) {
            throw new Error('API not available');
        }
        return await api.getMarketOrders(marketId);
    }, [api]);

    const getMarketTrades = useCallback(async (marketId: string): Promise<TradeData[]> => {
        if (!api) {
            throw new Error('API not available');
        }
        return await api.getMarketTrades(marketId);
    }, [api]);

    const getUserPositions = useCallback(async (pid1: string, pid2: string): Promise<PositionData[]> => {
        if (!api) {
            throw new Error('API not available');
        }
        return await api.getUserPositions(pid1, pid2);
    }, [api]);

    // Disconnect and cleanup
    const disconnect = useCallback(() => {
        setApi(null);
        setMarkets([]);
        setUserPositions([]);
        setUserStats(null);
        setTransactionHistory([]);
        setGlobalState(null);
        setError(null);
        setPlayerInstalled(false);
    }, []);

    const value: PredictionMarketContextType = {
        api,
        isConnected: isConnected && !!l2Account && !!api && !fallbackInitialized,
        walletInfo: l1Account ? {
            address: l1Account.address,
            isConnected: !!l1Account,
            balance: "0", // Would need to fetch actual balance
            pid: playerId || ["", ""]
        } : null,
        markets,
        userPositions,
        userStats,
        transactionHistory,
        globalState,
        loading,
        error,
        transactionState,
        connect: initializeAPI,
        disconnect,
        refreshData: () => Promise.resolve(refreshData(true)),
        createMarket,
        placeOrder,
        cancelOrder,
        claimWinnings,
        resolveMarket,
        getMarket,
        getMarketOrders,
        getMarketTrades,
        getUserPositions
    };

    return (
        <PredictionMarketContext.Provider value={value}>
            {children}
        </PredictionMarketContext.Provider>
    );
};

// Hook to use prediction market context
export const usePredictionMarket = (): PredictionMarketContextType => {
    const context = useContext(PredictionMarketContext);
    if (context === undefined) {
        throw new Error('usePredictionMarket must be used within a PredictionMarketProvider');
    }
    return context;
};

// Specific hooks for different functionality
export const useMarkets = () => {
    const { markets, loading, error, getMarket, getMarketOrders, getMarketTrades } = usePredictionMarket();
    return { markets, loading, error, getMarket, getMarketOrders, getMarketTrades };
};

export const useUserPortfolio = () => {
    const { userPositions, userStats, transactionHistory, loading, refreshData, getUserPositions } = usePredictionMarket();
    return {
        positions: userPositions,
        stats: userStats,
        transactionHistory,
        loading,
        refetch: refreshData,
        getUserPositions
    };
};

export const useMarketOperations = () => {
    const { createMarket, placeOrder, cancelOrder, claimWinnings, resolveMarket, transactionState } = usePredictionMarket();
    return {
        createMarket,
        placeOrder,
        cancelOrder,
        claimWinnings,
        resolveMarket,
        transactionState
    };
};

// Named export for PredictionMarketContext
export { PredictionMarketContext };

export default PredictionMarketContext;