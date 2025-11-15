// Market Context - 市场数据管理和轮询
// 参考: reference/frontend-prediction/src/contexts/MarketContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { bnToHexLe } from "delphinus-curves/src/altjubjub";
import { LeHexBN, ZKWasmAppRpc } from "zkwasm-minirollup-rpc";
import { useWallet } from "./WalletContext";
import { useToast } from "../hooks/use-toast";
import { ExchangePlayer, ExchangeAPI, GATEWAY_BASE_URL, ZKWASM_RPC_URL } from "../services/api";
import type { Market, Order, Trade, Position, GlobalState, PlaceOrderParams, PlayerId } from "../types/api";

// ==================== Context 类型定义 ====================

// 订单簿数据类型
export interface OrderBookData {
  marketId: string;
  direction: "YES" | "NO";
  bids: Array<{ price: string; quantity: string }>;
  asks: Array<{ price: string; quantity: string }>;
  timestamp: number;
}

interface MarketContextType {
  // 数据
  markets: Market[];
  currentMarket: Market | null;
  orders: Order[]; // 当前市场的订单
  userAllOrders: Order[]; // 用户所有订单（用于 Portfolio）
  trades: Trade[]; // 当前市场的成交
  userAllTrades: Trade[]; // 用户所有成交（用于 Portfolio）
  positions: Position[];
  globalState: GlobalState | null;
  playerId: PlayerId | null;
  marketPrices: Map<string, number>; // 每个市场的最新价格
  orderBooks: Map<string, OrderBookData>; // 订单簿数据 key: "marketId-YES" or "marketId-NO"

  // 状态
  isLoading: boolean;
  isPlayerInstalled: boolean;

  // API 实例
  playerClient: ExchangePlayer | null;
  apiClient: ExchangeAPI;

  // 方法
  setCurrentMarketId: (marketId: string | null) => void;
  refreshData: () => Promise<void>;
  installPlayer: () => Promise<void>;
  // Optional market query setter (no-op default)
  setMarketQuery?: (q: { intervalMinutes: number | null; slotLabel: string | null }) => void;
  getOrderBook: (marketId: string, direction: "YES" | "NO") => Promise<OrderBookData>;

  // 交易操作
  placeOrder: (params: PlaceOrderParams) => Promise<void>;
  cancelOrder: (orderId: bigint) => Promise<void>;
  claim: (marketId: bigint) => Promise<void>;
  deposit: (amount: bigint) => Promise<void>;
  withdraw: (amount: bigint) => Promise<void>;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error("useMarket must be used within a MarketProvider");
  }
  return context;
};

// ==================== Provider 组件 ====================

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Wallet state
  const { l2Account, deposit: walletDeposit } = useWallet();
  const { toast } = useToast();

  // Data state
  const [markets, setMarkets] = useState<Market[]>([]);
  const [currentMarketId, setCurrentMarketId] = useState<string | null>(null);
  const [currentMarket, setCurrentMarket] = useState<Market | null>(null);
  const [orders, setOrders] = useState<Order[]>([]); // 当前市场的订单
  const [userAllOrders, setUserAllOrders] = useState<Order[]>([]); // 用户所有订单
  const [trades, setTrades] = useState<Trade[]>([]); // 当前市场的成交
  const [userAllTrades, setUserAllTrades] = useState<Trade[]>([]); // 用户所有成交
  const [positions, setPositions] = useState<Position[]>([]);
  const [globalState, setGlobalState] = useState<GlobalState | null>(null);
  const [playerId, setPlayerId] = useState<PlayerId | null>(null);
  const [marketPrices, setMarketPrices] = useState<Map<string, number>>(new Map()); // 每个市场的最新成交价格
  const [orderBooks, setOrderBooks] = useState<Map<string, OrderBookData>>(new Map()); // 订单簿数据

  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayerInstalled, setIsPlayerInstalled] = useState(false);
  const [apiInitializing, setApiInitializing] = useState(false);
  const [_marketQuery, setMarketQuery] = useState<{ intervalMinutes: number | null; slotLabel: string | null }>({
    intervalMinutes: null,
    slotLabel: null,
  });

  // API clients
  const [playerClient, setPlayerClient] = useState<ExchangePlayer | null>(null);
  const apiClient = new ExchangeAPI(GATEWAY_BASE_URL);

  // ==================== 初始化 API ====================

  useEffect(() => {
    if (l2Account?.getPrivateKey && !playerClient && !apiInitializing) {
      initializeAPI();
    }
  }, [l2Account, playerClient, apiInitializing]);

  const initializeAPI = () => {
    if (!l2Account?.getPrivateKey()) {
      return;
    }

    if (apiInitializing || playerClient) {
      return;
    }

    setApiInitializing(true);

    try {
      const rpc = new ZKWasmAppRpc(ZKWASM_RPC_URL);
      const client = new ExchangePlayer(l2Account.getPrivateKey(), rpc);
      setPlayerClient(client);
    } catch (error) {
      toast({
        title: "Initialization Failed",
        description: "Failed to initialize API client",
        variant: "destructive",
      });
    } finally {
      setApiInitializing(false);
    }
  };

  // ==================== 钱包断开时重置状态 ====================
  // 注意：不依赖 l1Account，因为 SDK 可能不提供这个字段

  useEffect(() => {
    // 只在 l2Account 断开时重置用户相关状态
    if (!l2Account && playerClient) {
      setPlayerClient(null);
      setPlayerId(null);
      setIsPlayerInstalled(false);
      setApiInitializing(false);
      setPositions([]);
    }
  }, [l2Account, playerClient]);

  // ==================== 自动安装玩家 ====================

  useEffect(() => {
    if (l2Account && !isPlayerInstalled && playerClient) {
      autoInstallPlayer();
    }
  }, [l2Account, isPlayerInstalled, playerClient]);

  const autoInstallPlayer = async () => {
    if (!l2Account || !playerClient) return;

    setIsLoading(true);
    try {
      const response = await playerClient.register();

      // 生成 Player ID
      const generatedPlayerId = generatePlayerIdFromL2();
      if (generatedPlayerId) {
        setPlayerId(generatedPlayerId);
      }

      setIsPlayerInstalled(true);

      if (response === null) {
        toast({
          title: "Player Connected",
          description: "Successfully connected to existing player account!",
        });
      } else {
        toast({
          title: "Player Installed",
          description: "Successfully created new player account!",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to auto-connect player",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePlayerIdFromL2 = (): PlayerId | null => {
    try {
      if (!l2Account?.pubkey) return null;

      const pubkey = l2Account.pubkey;
      const leHexBN = new LeHexBN(bnToHexLe(pubkey));
      const pkeyArray = leHexBN.toU64Array();
      const playerId: PlayerId = [pkeyArray[1].toString(), pkeyArray[2].toString()];

      return playerId;
    } catch (error) {
      return null;
    }
  };

  // ==================== 手动安装玩家 ====================

  const installPlayer = useCallback(async () => {
    if (!playerClient) {
      throw new Error("API not ready");
    }

    setIsLoading(true);
    try {
      const response = await playerClient.register();

      const generatedPlayerId = generatePlayerIdFromL2();
      if (generatedPlayerId) {
        setPlayerId(generatedPlayerId);
      } else {
        throw new Error("Failed to generate player ID");
      }

      setIsPlayerInstalled(true);

      toast({
        title: response === null ? "Player Connected" : "Player Installed",
        description:
          response === null ? "Successfully connected to existing player!" : "Successfully created new player!",
      });
    } catch (error) {
      toast({
        title: "Installation Failed",
        description: "Failed to install player",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [playerClient, l2Account, toast]);

  // ==================== 直接根据 L2 公钥推导并设置 Player ID（无需等待安装） ====================
  useEffect(() => {
    if (l2Account?.pubkey) {
      const generated = generatePlayerIdFromL2();
      if (generated && (playerId?.[0] !== generated[0] || playerId?.[1] !== generated[1])) {
        setPlayerId(generated);
      }
    } else {
      if (playerId !== null) {
        setPlayerId(null);
      }
    }
    // 仅依赖 pubkey 变化触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l2Account?.pubkey]);

  // ==================== 智能轮询：整分钟前后 4 秒内 1.5 秒轮询 ====================

  useEffect(() => {
    // 立即加载市场列表
    loadInitialData();

    let currentInterval: NodeJS.Timeout | null = null;

    const checkAndSchedulePolling = () => {
      const now = new Date();
      const seconds = now.getSeconds();

      // 判断是否在整分钟前后 4 秒内 (56-59秒 或 0-3秒)
      const isNearMinuteBoundary = seconds >= 56 || seconds <= 3;

      if (isNearMinuteBoundary) {
        // 在关键时间段内，启动 1.5 秒轮询（只刷新市场列表）
        if (!currentInterval) {
          console.log('🔄 启动快速轮询 (1.5s) - 只刷新市场列表');
          currentInterval = setInterval(() => {
            refreshMarketList();
          }, 1500);
        }
      } else {
        // 不在关键时间段，停止轮询
        if (currentInterval) {
          console.log('⏸️  停止轮询');
          clearInterval(currentInterval);
          currentInterval = null;
        }
      }
    };

    // 每秒检查一次是否需要启动/停止轮询
    const checkInterval = setInterval(checkAndSchedulePolling, 1000);
    
    // 立即检查一次
    checkAndSchedulePolling();

    return () => {
      clearInterval(checkInterval);
      if (currentInterval) {
        clearInterval(currentInterval);
      }
    };
  }, [currentMarketId]);

  // ==================== 其他数据 5 秒轮询 ====================
  
  useEffect(() => {
    // 轮询当前市场的订单、交易、订单簿等数据
    if (!currentMarketId) return;

    const interval = setInterval(() => {
      // 只刷新当前市场的详细数据，不刷新市场列表
      refreshCurrentMarketData();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentMarketId]);

  // 单独轮询用户数据（需要登录）
  useEffect(() => {
    if (!playerId) return;

    const interval = setInterval(() => {
      loadUserData();
    }, 5000);

    return () => clearInterval(interval);
  }, [playerId]);

  // 当 trades 变化时，立即更新当前市场的最新成交价格
  useEffect(() => {
    if (!currentMarketId || !trades || trades.length === 0) return;

    const latestTrade = trades[0];
    const latestPrice = parseInt(latestTrade.price) / 100; // BPS to percent

    setMarketPrices((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentMarketId, latestPrice);
      return newMap;
    });
  }, [trades, currentMarketId]);

  // ==================== 数据加载 ====================

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await refreshData();
    } catch (error) {
      // Error handled in refreshData
    } finally {
      setIsLoading(false);
    }
  };

  // 单独刷新市场列表（用于智能轮询）
  const refreshMarketList = useCallback(async () => {
    try {
      const marketsData = await apiClient.getMarkets();
      setMarkets(marketsData);
    } catch (error) {
      console.error("Failed to refresh market list:", error);
    }
  }, [apiClient]);

  // 刷新当前市场的详细数据（订单、交易、订单簿）
  const refreshCurrentMarketData = useCallback(async () => {
    if (!currentMarketId) return;

    try {
      const [marketData, tradesData] = await Promise.all([
        apiClient.getMarket(currentMarketId),
        apiClient.getTrades(currentMarketId),
      ]);

      setCurrentMarket(marketData);
      setTrades(tradesData);

      // 如果用户已登录，获取该市场的用户订单
      if (playerId) {
        const userId = `${playerId[0]}:${playerId[1]}`;
        try {
          const [yesOrders, noOrders] = await Promise.all([
            apiClient.getUserOrders(userId, { symbol: `${currentMarketId}-YES`, status: "OPEN" }),
            apiClient.getUserOrders(userId, { symbol: `${currentMarketId}-NO`, status: "OPEN" }),
          ]);
          setOrders([...yesOrders, ...noOrders]);
        } catch (error) {
          console.error("Failed to load market orders:", error);
        }
      }

      // 获取订单簿
      try {
        const orderBookData = await apiClient.getOrderBookDepth(currentMarketId, 20);
        setOrderBooks((prev) => {
          const newMap = new Map(prev);
          newMap.set(`${currentMarketId}-YES`, {
            marketId: currentMarketId,
            direction: "YES",
            bids: orderBookData.yes.bids,
            asks: orderBookData.yes.asks,
            timestamp: orderBookData.yes.timestamp,
          });
          newMap.set(`${currentMarketId}-NO`, {
            marketId: currentMarketId,
            direction: "NO",
            bids: orderBookData.no.bids,
            asks: orderBookData.no.asks,
            timestamp: orderBookData.no.timestamp,
          });
          return newMap;
        });
      } catch (error) {
        console.error("Failed to load order book:", error);
      }
    } catch (error) {
      console.error("Failed to refresh current market data:", error);
    }
  }, [currentMarketId, playerId, apiClient]);

  const refreshData = useCallback(async () => {
    try {
      // 1. 获取所有市场（公开数据，不需要登录）
      const marketsData = await apiClient.getMarkets();
      setMarkets(marketsData);

      // 2. 批量获取活跃市场的最新成交价格（只获取未 Resolved 的市场）
      const activeMarkets = marketsData.filter((m) => m.status === 0 || m.status === 1 || m.status === 3);
      const priceMap = new Map<string, number>();

      await Promise.all(
        activeMarkets.map(async (market) => {
          try {
            const marketTrades = await apiClient.getTrades(market.marketId);
            if (marketTrades.length > 0) {
              const latestPrice = parseInt(marketTrades[0].price) / 100; // BPS to percent
              priceMap.set(market.marketId, latestPrice);
            }
          } catch (error) {
            // Silently skip failed market
          }
        })
      );

      setMarketPrices(priceMap);

      // 3. 获取全局状态
      try {
        const stateData = await apiClient.getGlobalState();
        setGlobalState(stateData);
      } catch (error) {
        // Silently skip global state
      }

      // 4. 如果有当前市场，获取订单和成交（只获取当前市场的）
      if (currentMarketId) {
        const [marketData, tradesData] = await Promise.all([
          apiClient.getMarket(currentMarketId),
          apiClient.getTrades(currentMarketId),
        ]);

        setCurrentMarket(marketData);
        setTrades(tradesData);

        // 如果用户已登录，获取该市场的用户订单
        if (playerId) {
          const userId = `${playerId[0]}:${playerId[1]}`;
          try {
            // 获取当前市场的用户订单（YES 和 NO）
            const [yesOrders, noOrders] = await Promise.all([
              apiClient.getUserOrders(userId, { symbol: `${currentMarketId}-YES`, status: "OPEN" }),
              apiClient.getUserOrders(userId, { symbol: `${currentMarketId}-NO`, status: "OPEN" }),
            ]);
            setOrders([...yesOrders, ...noOrders]);
          } catch (error) {
            console.error("Failed to load market orders:", error);
            setOrders([]);
          }
        } else {
          setOrders([]);
        }

        // 5. 获取当前市场的订单簿（一次请求返回 YES 和 NO）
        try {
          const orderBookData = await apiClient.getOrderBookDepth(currentMarketId, 20);

          setOrderBooks((prev) => {
            const newMap = new Map(prev);
            newMap.set(`${currentMarketId}-YES`, {
              marketId: currentMarketId,
              direction: "YES",
              bids: orderBookData.yes.bids,
              asks: orderBookData.yes.asks,
              timestamp: orderBookData.yes.timestamp,
            });
            newMap.set(`${currentMarketId}-NO`, {
              marketId: currentMarketId,
              direction: "NO",
              bids: orderBookData.no.bids,
              asks: orderBookData.no.asks,
              timestamp: orderBookData.no.timestamp,
            });
            return newMap;
          });
        } catch (error) {
          // Silently skip order book errors
          console.error("Failed to load order books:", error);
        }
      } else {
        // 如果没有选中市场，清空订单和成交
        setOrders([]);
        setTrades([]);
      }
    } catch (error) {
      // 只在初次加载失败时显示错误
      if (!markets.length) {
        toast({
          title: "Connection Error",
          description: "Failed to load markets. Please check if backend is running.",
          variant: "destructive",
        });
      }
    }
  }, [currentMarketId, toast]);

  // 加载用户数据（需要登录）
  const loadUserData = useCallback(async () => {
    if (!playerId) return;

    const userId = `${playerId[0]}:${playerId[1]}`;

    try {
      // 加载用户持仓、订单和成交记录
      const [positionsData, userOrdersData, userTradesData] = await Promise.all([
        apiClient.getUserPositions(userId),
        apiClient.getUserOrders(userId, { limit: 100 }),
        apiClient.getUserTrades(userId, { limit: 200 }),
      ]);

      // 转换持仓数据为前端格式
      const convertedPositions = positionsData.map((pos: any) => ({
        pid1: playerId[0],
        pid2: playerId[1],
        tokenIdx: "0", // USDC
        balance: pos.yes_shares || "0",
        lockBalance: "0",
        marketId: pos.market_id,
        yesShares: pos.yes_shares || "0",
        noShares: pos.no_shares || "0",
        yesFrozen: pos.yes_frozen || "0",
        noFrozen: pos.no_frozen || "0",
      }));

      setPositions(convertedPositions as Position[]);
      setUserAllOrders(userOrdersData);
      setUserAllTrades(userTradesData);
    } catch (error) {
      console.error("Failed to load user data:", error);
      // Silently skip user data errors
    }
  }, [playerId, apiClient]);

  // ==================== 交易操作 ====================

  const placeOrder = useCallback(
    async (params: PlaceOrderParams) => {
      // Require playerId (pid1:pid2) for gateway user_id
      if (!playerId) {
        throw new Error("Missing player ID. Please connect L2 to continue.");
      }
      const userId = `${playerId[0]}:${playerId[1]}`;

      setIsLoading(true);
      try {
        const side: "BUY" | "SELL" =
          params.orderType === "limit_buy" || params.orderType === "market_buy" ? "BUY" : "SELL";
        const type: "LIMIT" | "MARKET" = params.orderType.startsWith("limit") ? "LIMIT" : "MARKET";
        const direction: "YES" | "NO" = params.direction === "UP" ? "YES" : "NO";

        // Convert price from BPS (0-10000) to decimal (0-1)
        // Example: 5000 BPS -> "0.5"
        const priceStr = type === "LIMIT" ? (Number(params.price) / 10000).toFixed(4).replace(/\.?0+$/, "") : undefined;

        // Convert amount from 2-decimal precision (100 = 1.0) to decimal string
        // Example: 1000n (10.00 shares) -> "10"
        const amountBig = params.amount;
        const intPart = amountBig / 100n;
        const fracPart = amountBig % 100n;
        let amountStr = `${intPart.toString()}.${fracPart.toString().padStart(2, "0")}`;
        amountStr = amountStr.replace(/\.?0+$/, "");

        await apiClient.createMarketOrder(
          {
            marketId: params.marketId.toString(),
            side,
            direction,
            type,
            price: priceStr,
            amount: amountStr,
          },
          String(userId)
        );

        toast({
          title: "Order Placed",
          description: `Successfully placed ${params.direction} order`,
        });

        await Promise.all([refreshData(), playerId ? loadUserData() : Promise.resolve()]);
      } catch (error) {
        toast({
          title: "Order Failed",
          description: error instanceof Error ? error.message : "Failed to place order",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, refreshData, loadUserData, playerId, toast]
  );

  const cancelOrder = useCallback(
    async (orderId: bigint) => {
      if (!playerClient) {
        throw new Error("API not ready");
      }

      setIsLoading(true);
      try {
        await playerClient.cancelOrder(orderId);

        // 乐观更新：立即从本地状态中移除订单
        const orderIdStr = orderId.toString();
        setOrders((prev) => prev.filter((o) => o.orderId !== orderIdStr));
        setUserAllOrders((prev) => prev.filter((o) => o.orderId !== orderIdStr));

        toast({
          title: "Order Cancelled",
          description: "Successfully cancelled order",
        });

        // 后台刷新数据确保同步
        setTimeout(() => {
          Promise.all([refreshData(), playerId ? loadUserData() : Promise.resolve()]).catch(() => {});
        }, 1000);
      } catch (error) {
        toast({
          title: "Cancel Failed",
          description: "Failed to cancel order",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [playerClient, refreshData, loadUserData, playerId, toast]
  );

  const claim = useCallback(
    async (marketId: bigint) => {
      if (!playerClient) {
        throw new Error("API not ready");
      }

      setIsLoading(true);
      try {
        await playerClient.claim(marketId);

        toast({
          title: "Claim Successful",
          description: "Successfully claimed winnings!",
        });

        await refreshData();
      } catch (error) {
        toast({
          title: "Claim Failed",
          description: "Failed to claim winnings",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [playerClient, refreshData, toast]
  );

  // ==================== 订单簿查询 ====================

  const getOrderBook = useCallback(
    async (marketId: string, direction: "YES" | "NO"): Promise<OrderBookData> => {
      try {
        const depth = await apiClient.getOrderBookDepth(marketId, 20);
        const subMarket = direction === "YES" ? depth.yes : depth.no;
        
        const orderBookData: OrderBookData = {
          marketId,
          direction,
          bids: subMarket.bids,
          asks: subMarket.asks,
          timestamp: subMarket.timestamp,
        };

        // 缓存到 state（同时缓存两个子市场）
        setOrderBooks((prev) => {
          const newMap = new Map(prev);
          newMap.set(`${marketId}-YES`, {
            marketId,
            direction: "YES",
            bids: depth.yes.bids,
            asks: depth.yes.asks,
            timestamp: depth.yes.timestamp,
          });
          newMap.set(`${marketId}-NO`, {
            marketId,
            direction: "NO",
            bids: depth.no.bids,
            asks: depth.no.asks,
            timestamp: depth.no.timestamp,
          });
          return newMap;
        });

        return orderBookData;
      } catch (error) {
        console.error("Failed to fetch order book:", error);
        // 返回空订单簿
        return {
          marketId,
          direction,
          bids: [],
          asks: [],
          timestamp: Date.now(),
        };
      }
    },
    [apiClient]
  );

  // ==================== Deposit ====================

  const deposit = useCallback(
    async (amount: bigint) => {
      if (!walletDeposit || !playerId) {
        throw new Error("Please connect wallet first");
      }

      setIsLoading(true);
      try {
        // Use SDK's deposit method
        // Convert amount from bigint (precision format) to number
        const amountInEther = Number(amount) / 100;

        await walletDeposit({
          tokenIndex: 0, // USDC token index
          amount: amountInEther,
        });

        toast({
          title: "Deposit Successful",
          description: `Successfully deposited ${amountInEther} USDC`,
        });

        // Refresh data
        await Promise.all([refreshData(), loadUserData()]);
      } catch (error) {
        toast({
          title: "Deposit Failed",
          description: error instanceof Error ? error.message : "Failed to deposit",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [walletDeposit, playerId, refreshData, loadUserData, toast]
  );

  // ==================== Withdraw ====================

  const withdraw = useCallback(
    async (amount: bigint) => {
      if (!playerClient) {
        throw new Error("API not ready");
      }

      setIsLoading(true);
      try {
        await playerClient.withdraw(amount);

        toast({
          title: "Withdraw Successful",
          description: `Successfully withdrew ${Number(amount) / 100} USDC`,
        });

        // Refresh data
        await Promise.all([refreshData(), loadUserData()]);
      } catch (error) {
        toast({
          title: "Withdraw Failed",
          description: error instanceof Error ? error.message : "Failed to withdraw",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [playerClient, refreshData, loadUserData, toast]
  );

  // ==================== Context Value ====================

  const value: MarketContextType = {
    markets,
    currentMarket,
    orders,
    userAllOrders,
    trades,
    userAllTrades,
    positions,
    globalState,
    orderBooks,
    playerId,
    marketPrices,
    isLoading,
    isPlayerInstalled,
    playerClient,
    apiClient,
    setCurrentMarketId,
    refreshData,
    installPlayer,
    setMarketQuery,
    getOrderBook,
    placeOrder,
    cancelOrder,
    claim,
    deposit,
    withdraw,
  };

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
};
