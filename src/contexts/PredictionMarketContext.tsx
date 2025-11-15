// @ts-nocheck
/* eslint-disable */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useWallet } from "./WalletContext";
import { createPredictionMarketAPI, PredictionMarketAPI } from "../services/api";
import { bnToHexLe } from "delphinus-curves/src/altjubjub";
import { LeHexBN } from "zkwasm-minirollup-rpc";

// Type definitions
interface MarketData {
  id: string;
  question: string;
  outcome1: string;
  outcome2: string;
  endTime: string;
  fee: string;
  status: "PENDING" | "ACTIVE" | "CLOSED" | "RESOLVED";
  resolvedOutcome?: number;
  creator: string;
  totalVolume: string;
  orders: OrderData[];
}

interface OrderData {
  id: string;
  marketId: string;
  orderType: "YES" | "NO";
  outcome: number;
  amount: string;
  price: string;
  filled: string;
  status: "OPEN" | "FILLED" | "CANCELLED";
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
  status: "OPEN" | "CLOSED";
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
  type: "CREATE_MARKET" | "PLACE_ORDER" | "CANCEL_ORDER" | "CLAIM" | "RESOLVE_MARKET";
  marketId?: string;
  amount: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
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
  status: "IDLE" | "PENDING" | "SUCCESS" | "ERROR";
  type?: "CREATE_MARKET" | "PLACE_ORDER" | "CANCEL_ORDER" | "CLAIM" | "RESOLVE_MARKET";
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
  orderType: "YES" | "NO";
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
  const [api, setApi] = useState<PredictionMarketAPI | null>(null);
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [userPositions, setUserPositions] = useState<PositionData[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
  const [globalState, setGlobalState] = useState<GlobalState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionState, setTransactionState] = useState<TransactionState>({
    status: "IDLE",
  });
  const [playerInstalled, setPlayerInstalled] = useState(false);
  const [apiInitializing, setApiInitializing] = useState(false);
  const [userBalance, setUserBalance] = useState<string>("0");
  const [fallbackInitialized, setFallbackInitialized] = useState(false);
  const [globalCounter, setGlobalCounter] = useState<number>(0);

  // Error code mapping function
  const getErrorMessage = (error: any): string => {
    const errorMessage = error?.message || error?.toString() || "Unknown error";

    // Check for specific error patterns
    if (errorMessage.includes("InvalidOrderAmount")) {
      return "Invalid order amount. Please ensure: 1) Amount is greater than 0, 2) Sufficient balance for margin requirements.";
    }
    if (errorMessage.includes("InvalidPrice")) {
      return "Invalid price. Price must be between 0 and 10000 basis points (0-100%).";
    }
    if (errorMessage.includes("InsufficientBalance")) {
      return "Insufficient balance. Please deposit more funds to continue.";
    }
    if (errorMessage.includes("MarketNotActive")) {
      return "This market is not currently active for trading.";
    }
    if (errorMessage.includes("MarketResolved")) {
      return "This market has been resolved and is no longer accepting orders.";
    }
    if (errorMessage.includes("OrderNotFound")) {
      return "Order not found or already filled/cancelled.";
    }
    if (errorMessage.includes("CannotCancelFilledOrder")) {
      return "Cannot cancel an order that has already been filled.";
    }
    if (errorMessage.includes("InvalidClaim")) {
      return "Invalid claim. Please ensure the market is resolved and you have a position in the winning outcome.";
    }
    if (errorMessage.includes("AlreadyClaimed")) {
      return "You have already claimed your winnings from this market.";
    }
    if (errorMessage.includes("PlayerNotExist")) {
      return "Player account not found. Please try connecting your wallet again.";
    }
    if (errorMessage.includes("PlayerAlreadyExist")) {
      return "Player account already exists.";
    }
    if (errorMessage.includes("InvalidMarketCreation")) {
      return "Invalid market creation parameters. Please check your inputs.";
    }
    if (errorMessage.includes("MarketCreationFailed")) {
      return "Failed to create market. Please try again later.";
    }

    // Default error message
    return errorMessage;
  };

  // Use wallet context from zkWasm SDK
  const walletData = useWallet();
  const { l1Account, l2Account, playerId, setPlayerId, isConnected, connectL1 } = walletData;

  // Auto-connect L1 when RainbowKit connection is established
  useEffect(() => {
    if (isConnected && !l1Account) {
      connectL1();
    }
  }, [isConnected, l1Account, connectL1]);

  // Initialize API when L2 account is available OR use fallback for public data
  useEffect(() => {
    if (l2Account && l2Account.getPrivateKey && !apiInitializing) {
      // If wallet is connected, always reinitialize API with user's private key
      if (fallbackInitialized || !api) {
        setFallbackInitialized(false);
        setApi(null);
        setPlayerInstalled(false);
        initializeAPI();
      }
    } else if (!l2Account && !apiInitializing) {
      // If no wallet is connected, ensure we have fallback API
      if (!fallbackInitialized || !api) {
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
          const result = await api.installPlayer();
          setPlayerInstalled(true);

          // Generate player ID from L2 account
          const generatePlayerIdFromL2 = (): [string, string] | null => {
            try {
              if (l2Account.pubkey) {
                const pubkey = l2Account.pubkey;
                const leHexBN = new LeHexBN(bnToHexLe(pubkey));
                const pkeyArray = leHexBN.toU64Array();
                const playerId: [string, string] = [pkeyArray[1].toString(), pkeyArray[2].toString()];
                return playerId;
              }
              return null;
            } catch (error) {
              return null;
            }
          };

          const generatedPlayerId = generatePlayerIdFromL2();
          if (generatedPlayerId) {
            setPlayerId(generatedPlayerId);
          }
        } catch (err) {
          // Handle PlayerAlreadyExist as success case
          if (
            err instanceof Error &&
            (err.message.includes("PlayerAlreadyExist") || err.message.includes("PlayerAlreadyExists"))
          ) {
            setPlayerInstalled(true);

            // Still need to generate player ID even if player already exists
            const generatePlayerIdFromL2 = (): [string, string] | null => {
              try {
                if (l2Account.pubkey) {
                  const pubkey = l2Account.pubkey;
                  const leHexBN = new LeHexBN(bnToHexLe(pubkey));
                  const pkeyArray = leHexBN.toU64Array();
                  const playerId: [string, string] = [pkeyArray[1].toString(), pkeyArray[2].toString()];
                  return playerId;
                }
                return null;
              } catch (error) {
                return null;
              }
            };

            const generatedPlayerId = generatePlayerIdFromL2();
            if (generatedPlayerId) {
              setPlayerId(generatedPlayerId);
            }
            return;
          }
        }
      };

      autoInstall();
    }
  }, [l2Account, playerInstalled, api]);

  // Set up polling when API is ready and either player is installed OR using fallback
  useEffect(() => {
    if (api && playerInstalled) {
      // Load initial data
      loadInitialData();

      // Set up polling interval (every 5 seconds)
      const pollInterval = setInterval(() => {
        refreshData(false);
      }, 5000);

      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [api, playerInstalled]);

  // Initialize API connection
  const initializeAPI = useCallback(() => {
    if (apiInitializing) return;

    setApiInitializing(true);
    setError(null);

    try {
      if (!l2Account || !l2Account.getPrivateKey) {
        throw new Error("L2 account not available. Please connect wallet and login to L2 first.");
      }

      console.log("PredictionMarketContext: Initializing API with config:", {
        serverUrl: config.serverUrl,
        hasPrivateKey: !!l2Account.getPrivateKey(),
      });

      const apiInstance = createPredictionMarketAPI({
        serverUrl: config.serverUrl,
        privkey: l2Account.getPrivateKey(),
      });

      setApi(apiInstance);
      console.log("PredictionMarketContext: API initialized successfully with serverUrl:", config.serverUrl);
    } catch (err) {
      console.error("Failed to initialize API:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize API");
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
      console.log("PredictionMarketContext: Initializing API with fallback private key for public data access");

      // Use a fallback private key for public data access
      const fallbackPrivkey = "000000";

      const apiInstance = createPredictionMarketAPI({
        serverUrl: config.serverUrl,
        privkey: fallbackPrivkey,
      });

      setApi(apiInstance);
      setPlayerInstalled(true); // Set as installed to enable data polling
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize API");
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
      // Error handled in refreshData
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Refresh all data
  const refreshData = useCallback(async (_isInitialLoad = false) => {
    // 为完全切换至 Gateway，这里不再调用旧 Prediction API/RPC，直接返回。
    return;
  }, []);

  // Market operations
  const createMarket = useCallback(
    async (params: MarketCreationParams) => {
      if (!api) {
        throw new Error("API not available");
      }
      if (!isConnected || fallbackInitialized) {
        throw new Error("Wallet not connected or using fallback mode");
      }

      try {
        setTransactionState({ status: "PENDING", type: "CREATE_MARKET" });

        const result = await api.createMarket(
          params.question,
          params.outcome1,
          params.outcome2,
          params.endTimeOffset,
          params.fee
        );

        setTransactionState({ status: "SUCCESS", type: "CREATE_MARKET" });

        // Refresh data after successful market creation
        await refreshData();

        return result;
      } catch (error) {
        const friendlyErrorMessage = getErrorMessage(error);
        setTransactionState({ status: "ERROR", type: "CREATE_MARKET", error: friendlyErrorMessage });
        throw new Error(friendlyErrorMessage);
      }
    },
    [api, isConnected, fallbackInitialized, refreshData]
  );

  const placeOrder = useCallback(
    async (params: OrderParams) => {
      if (!api) {
        throw new Error("API not available");
      }
      if (!isConnected || fallbackInitialized) {
        throw new Error("Wallet not connected or using fallback mode");
      }

      try {
        setTransactionState({ status: "PENDING", type: "PLACE_ORDER" });

        const orderTypeValue = params.orderType === "YES" ? 1n : 2n;
        const outcome = BigInt(params.outcome);
        const amount = BigInt(params.amount);
        const price = BigInt(params.price);

        const result = await api.placeOrder(params.marketId, orderTypeValue, outcome, amount, price);

        setTransactionState({ status: "SUCCESS", type: "PLACE_ORDER" });

        // Refresh data after successful order placement
        await refreshData();

        return result;
      } catch (error) {
        const friendlyErrorMessage = getErrorMessage(error);
        setTransactionState({ status: "ERROR", type: "PLACE_ORDER", error: friendlyErrorMessage });
        throw new Error(friendlyErrorMessage);
      }
    },
    [api, isConnected, fallbackInitialized, refreshData]
  );

  const cancelOrder = useCallback(
    async (orderId: bigint) => {
      if (!api) {
        throw new Error("API not available");
      }
      if (!isConnected || fallbackInitialized) {
        throw new Error("Wallet not connected or using fallback mode");
      }

      try {
        setTransactionState({ status: "PENDING", type: "CANCEL_ORDER" });

        const result = await api.cancelOrder(orderId);

        setTransactionState({ status: "SUCCESS", type: "CANCEL_ORDER" });

        // Refresh data after successful order cancellation
        await refreshData();

        return result;
      } catch (error) {
        const friendlyErrorMessage = getErrorMessage(error);
        setTransactionState({ status: "ERROR", type: "CANCEL_ORDER", error: friendlyErrorMessage });
        throw new Error(friendlyErrorMessage);
      }
    },
    [api, isConnected, fallbackInitialized, refreshData]
  );

  const claimWinnings = useCallback(
    async (params: ClaimParams) => {
      if (!api) {
        throw new Error("API not available");
      }
      if (!isConnected || fallbackInitialized) {
        throw new Error("Wallet not connected or using fallback mode");
      }

      try {
        setTransactionState({ status: "PENDING", type: "CLAIM" });

        const outcome = BigInt(params.outcome);
        const result = await api.claim(params.marketId, outcome);

        setTransactionState({ status: "SUCCESS", type: "CLAIM" });

        // Refresh data after successful claim
        await refreshData();

        return result;
      } catch (error) {
        const friendlyErrorMessage = getErrorMessage(error);
        setTransactionState({ status: "ERROR", type: "CLAIM", error: friendlyErrorMessage });
        throw new Error(friendlyErrorMessage);
      }
    },
    [api, isConnected, fallbackInitialized, refreshData]
  );

  const resolveMarket = useCallback(
    async (marketId: bigint, winningOutcome: number) => {
      if (!api) {
        throw new Error("API not available");
      }
      if (!isConnected || fallbackInitialized) {
        throw new Error("Wallet not connected or using fallback mode");
      }

      try {
        setTransactionState({ status: "PENDING", type: "RESOLVE_MARKET" });

        const outcome = BigInt(winningOutcome);
        const result = await api.resolveMarket(marketId, outcome);

        setTransactionState({ status: "SUCCESS", type: "RESOLVE_MARKET" });

        // Refresh data after successful market resolution
        await refreshData();

        return result;
      } catch (error) {
        const friendlyErrorMessage = getErrorMessage(error);
        setTransactionState({ status: "ERROR", type: "RESOLVE_MARKET", error: friendlyErrorMessage });
        throw new Error(friendlyErrorMessage);
      }
    },
    [api, isConnected, fallbackInitialized, refreshData]
  );

  // Data fetching methods
  const getMarket = useCallback(
    async (marketId: string): Promise<MarketData> => {
      if (!api) {
        throw new Error("API not available");
      }
      return await api.getMarket(marketId);
    },
    [api]
  );

  const getMarketOrders = useCallback(
    async (marketId: string): Promise<OrderData[]> => {
      if (!api) {
        throw new Error("API not available");
      }
      return await api.getMarketOrders(marketId);
    },
    [api]
  );

  const getMarketTrades = useCallback(
    async (marketId: string): Promise<TradeData[]> => {
      if (!api) {
        throw new Error("API not available");
      }
      return await api.getMarketTrades(marketId);
    },
    [api]
  );

  const getUserPositions = useCallback(
    async (pid1: string, pid2: string): Promise<PositionData[]> => {
      if (!api) {
        throw new Error("API not available");
      }
      return await api.getUserPositions(pid1, pid2);
    },
    [api]
  );

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
    walletInfo: l1Account
      ? {
          address: l1Account.address,
          isConnected: !!l1Account,
          balance: "0", // Would need to fetch actual balance
          pid: playerId || ["", ""],
        }
      : null,
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
    getUserPositions,
  };

  return <PredictionMarketContext.Provider value={value}>{children}</PredictionMarketContext.Provider>;
};

// Hook to use prediction market context
export const usePredictionMarket = (): PredictionMarketContextType => {
  const context = useContext(PredictionMarketContext);
  if (context === undefined) {
    throw new Error("usePredictionMarket must be used within a PredictionMarketProvider");
  }
  return context;
};

// Specific hooks for different functionality
export const useMarkets = () => {
  const { markets, loading, error, getMarket, getMarketOrders, getMarketTrades } = usePredictionMarket();
  return { markets, loading, error, getMarket, getMarketOrders, getMarketTrades };
};

export const useUserPortfolio = () => {
  const { userPositions, userStats, transactionHistory, loading, refreshData, getUserPositions } =
    usePredictionMarket();
  return {
    positions: userPositions,
    stats: userStats,
    transactionHistory,
    loading,
    refetch: refreshData,
    getUserPositions,
  };
};

export const useMarketOperations = () => {
  const { createMarket, placeOrder, cancelOrder, claimWinnings, resolveMarket, transactionState } =
    usePredictionMarket();
  return {
    createMarket,
    placeOrder,
    cancelOrder,
    claimWinnings,
    resolveMarket,
    transactionState,
  };
};

// Named export for PredictionMarketContext
export { PredictionMarketContext };

export default PredictionMarketContext;
