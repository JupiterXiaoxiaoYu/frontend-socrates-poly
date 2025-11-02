// Market Context - 市场数据管理和轮询
// 参考: reference/frontend-prediction/src/contexts/MarketContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { bnToHexLe } from 'delphinus-curves/src/altjubjub';
import { LeHexBN, ZKWasmAppRpc } from 'zkwasm-minirollup-rpc';
import { useWallet } from './WalletContext';
import { useToast } from '../hooks/use-toast';
import {
  ExchangePlayer,
  ExchangeAPI,
  API_BASE_URL,
} from '../services/api';
import type {
  Market,
  Order,
  Trade,
  Position,
  GlobalState,
  PlaceOrderParams,
  PlayerId,
} from '../types/api';

// ==================== Context 类型定义 ====================

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
    throw new Error('useMarket must be used within a MarketProvider');
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
  
  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayerInstalled, setIsPlayerInstalled] = useState(false);
  const [apiInitializing, setApiInitializing] = useState(false);
  
  // API clients
  const [playerClient, setPlayerClient] = useState<ExchangePlayer | null>(null);
  const apiClient = new ExchangeAPI(API_BASE_URL);

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
      const rpc = new ZKWasmAppRpc(API_BASE_URL);
      const client = new ExchangePlayer(l2Account.getPrivateKey(), rpc);
      setPlayerClient(client);
    } catch (error) {
      toast({
        title: 'Initialization Failed',
        description: 'Failed to initialize API client',
        variant: 'destructive',
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
          title: 'Player Connected',
          description: 'Successfully connected to existing player account!',
        });
      } else {
        toast({
          title: 'Player Installed',
          description: 'Successfully created new player account!',
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to auto-connect player',
        variant: 'destructive',
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
      throw new Error('API not ready');
    }

    setIsLoading(true);
    try {
      const response = await playerClient.register();

      const generatedPlayerId = generatePlayerIdFromL2();
      if (generatedPlayerId) {
        setPlayerId(generatedPlayerId);
      } else {
        throw new Error('Failed to generate player ID');
      }

      setIsPlayerInstalled(true);

      toast({
        title: response === null ? 'Player Connected' : 'Player Installed',
        description: response === null 
          ? 'Successfully connected to existing player!'
          : 'Successfully created new player!',
      });
    } catch (error) {
      toast({
        title: 'Installation Failed',
        description: 'Failed to install player',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [playerClient, l2Account, toast]);

  // ==================== 定时轮询 ====================

  useEffect(() => {
    // 立即加载市场列表（不需要登录）
    loadInitialData();

    // 设置定时轮询（每 5 秒）
    const interval = setInterval(() => {
      refreshData();
    }, 5000);

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
    
    setMarketPrices(prev => {
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

  const refreshData = useCallback(async () => {
    try {
      // 1. 获取所有市场（公开数据，不需要登录）
      const marketsData = await apiClient.getMarkets();
      setMarkets(marketsData);

      // 2. 批量获取活跃市场的最新成交价格（只获取未 Resolved 的市场）
      const activeMarkets = marketsData.filter(m => m.status === 0 || m.status === 1 || m.status === 3);
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
        const [marketData, ordersData, tradesData] = await Promise.all([
          apiClient.getMarket(currentMarketId),
          apiClient.getOrders(currentMarketId), // 获取当前市场的所有订单
          apiClient.getTrades(currentMarketId),
        ]);
        
        setCurrentMarket(marketData);
        setOrders(ordersData); // 只包含当前市场的订单
        setTrades(tradesData);
      } else {
        // 如果没有选中市场，清空订单和成交
        setOrders([]);
        setTrades([]);
      }
    } catch (error) {
      // 只在初次加载失败时显示错误
      if (!markets.length) {
        toast({
          title: 'Connection Error',
          description: 'Failed to load markets. Please check if backend is running.',
          variant: 'destructive',
        });
      }
    }
  }, [currentMarketId, toast]);

  // 加载用户数据（需要登录）
  const loadUserData = useCallback(async () => {
    if (!playerId) return;

    try {
      // 加载用户持仓、所有订单和所有成交（用于 Portfolio 页面）
      const [positionsData, userOrdersData, userTradesData] = await Promise.all([
        apiClient.getPositions(playerId),
        apiClient.getPlayerOrders(playerId, { limit: 100 }),
        apiClient.getPlayerTrades(playerId, 200) // 获取用户的所有成交
      ]);
      
      setPositions(positionsData);
      setUserAllOrders(userOrdersData);
      setUserAllTrades(userTradesData);
    } catch (error) {
      // Silently skip user data errors
    }
  }, [playerId]);

  // ==================== 交易操作 ====================

  const placeOrder = useCallback(async (params: PlaceOrderParams) => {
    if (!playerClient) {
      throw new Error('API not ready');
    }

    setIsLoading(true);
    try {
      await playerClient.placeOrder(params);
      
      toast({
        title: 'Order Placed',
        description: `Successfully placed ${params.direction} order`,
      });

      // 立即刷新数据
      await Promise.all([
        refreshData(),
        playerId ? loadUserData() : Promise.resolve() // 同时刷新用户所有订单
      ]);
    } catch (error) {
      toast({
        title: 'Order Failed',
        description: 'Failed to place order',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [playerClient, refreshData, loadUserData, playerId, toast]);

  const cancelOrder = useCallback(async (orderId: bigint) => {
    if (!playerClient) {
      throw new Error('API not ready');
    }

    setIsLoading(true);
    try {
      await playerClient.cancelOrder(orderId);
      
      // 乐观更新：立即从本地状态中移除订单
      const orderIdStr = orderId.toString();
      setOrders(prev => prev.filter(o => o.orderId !== orderIdStr));
      setUserAllOrders(prev => prev.filter(o => o.orderId !== orderIdStr));
      
      toast({
        title: 'Order Cancelled',
        description: 'Successfully cancelled order',
      });

      // 后台刷新数据确保同步
      setTimeout(() => {
        Promise.all([
          refreshData(),
          playerId ? loadUserData() : Promise.resolve()
        ]).catch(() => {});
      }, 1000);
    } catch (error) {
      toast({
        title: 'Cancel Failed',
        description: 'Failed to cancel order',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [playerClient, refreshData, loadUserData, playerId, toast]);

  const claim = useCallback(async (marketId: bigint) => {
    if (!playerClient) {
      throw new Error('API not ready');
    }

    setIsLoading(true);
    try {
      await playerClient.claim(marketId);
      
      toast({
        title: 'Claim Successful',
        description: 'Successfully claimed winnings!',
      });

      await refreshData();
    } catch (error) {
      toast({
        title: 'Claim Failed',
        description: 'Failed to claim winnings',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [playerClient, refreshData, toast]);

  // ==================== Deposit ====================
  
  const deposit = useCallback(async (amount: bigint) => {
    if (!walletDeposit || !playerId) {
      throw new Error('Please connect wallet first');
    }

    setIsLoading(true);
    try {
      // Use SDK's deposit method
      // Convert amount from bigint (precision format) to number
      const amountInEther = Number(amount) / 100;
      
      await walletDeposit({
        tokenIndex: 0, // USDC token index
        amount: amountInEther
      });
      
      toast({
        title: 'Deposit Successful',
        description: `Successfully deposited ${amountInEther} USDC`,
      });

      // Refresh data
      await Promise.all([
        refreshData(),
        loadUserData()
      ]);
    } catch (error) {
      toast({
        title: 'Deposit Failed',
        description: error instanceof Error ? error.message : 'Failed to deposit',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletDeposit, playerId, refreshData, loadUserData, toast]);

  // ==================== Withdraw ====================
  
  const withdraw = useCallback(async (amount: bigint) => {
    if (!playerClient) {
      throw new Error('API not ready');
    }

    setIsLoading(true);
    try {
      await playerClient.withdraw(amount);
      
      toast({
        title: 'Withdraw Successful',
        description: `Successfully withdrew ${Number(amount) / 100} USDC`,
      });

      // Refresh data
      await Promise.all([
        refreshData(),
        loadUserData()
      ]);
    } catch (error) {
      toast({
        title: 'Withdraw Failed',
        description: error instanceof Error ? error.message : 'Failed to withdraw',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [playerClient, refreshData, loadUserData, toast]);

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
    playerId,
    marketPrices,
    isLoading,
    isPlayerInstalled,
    playerClient,
    apiClient,
    setCurrentMarketId,
    refreshData,
    installPlayer,
    placeOrder,
    cancelOrder,
    claim,
    deposit,
    withdraw,
  };

  return (
    <MarketContext.Provider value={value}>
      {children}
    </MarketContext.Provider>
  );
};

