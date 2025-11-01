/**
 * Oracle Price React Hook
 *
 * 提供比特币价格数据的React Hook，支持实时更新
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  oracleClient,
  OraclePriceResponse,
  OraclePriceUpdate,
  ExchangeStatus
} from '../services/oracle-api';

export interface UseOraclePriceOptions {
  symbol?: string;
  enableWebSocket?: boolean;
  updateInterval?: number; // 轮询间隔（毫秒）
  autoConnect?: boolean;
}

export interface PriceData extends OraclePriceResponse {
  formattedPrice: string;
  previousPrice?: number;
  priceChange?: {
    change: number;
    changePercent: number;
    direction: 'up' | 'down' | 'same';
  };
}

export interface UseOraclePriceReturn {
  // 价格数据
  currentPrice: PriceData | null;
  priceHistory: OraclePriceResponse[];

  // 状态
  loading: boolean;
  error: string | null;
  connected: boolean;

  // 交易所状态
  exchangeStatus: ExchangeStatus[];

  // 操作方法
  refresh: () => Promise<void>;
  connect: () => void;
  disconnect: () => void;

  // 统计信息
  lastUpdate: Date | null;
  updateCount: number;
}

export const useOraclePrice = (options: UseOraclePriceOptions = {}): UseOraclePriceReturn => {
  const {
    symbol = 'BTC/USD',
    enableWebSocket = true,
    updateInterval = 5000,
    autoConnect = true
  } = options;

  // 状态管理
  const [currentPrice, setCurrentPrice] = useState<PriceData | null>(null);
  const [priceHistory, setPriceHistory] = useState<OraclePriceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [exchangeStatus, setExchangeStatus] = useState<ExchangeStatus[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  // Refs
  const previousPriceRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hookIdRef = useRef<string>(`oracle-hook-${Date.now()}-${Math.random()}`);

  // 获取初始价格数据
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 并行获取多个数据
      const [latestPrice, history, status] = await Promise.all([
        oracleClient.getLatestPrice(symbol),
        oracleClient.getPriceHistory(symbol),
        oracleClient.getExchangeStatus()
      ]);

      // 处理最新价格
      const priceData: PriceData = {
        ...latestPrice,
        formattedPrice: oracleClient.formatPrice(latestPrice.price),
      };

      // 计算价格变化
      if (previousPriceRef.current !== null) {
        const currentPriceNum = parseFloat(latestPrice.price);
        priceData.priceChange = oracleClient.calculatePriceChange(
          currentPriceNum,
          previousPriceRef.current
        );
      }
      previousPriceRef.current = parseFloat(latestPrice.price);

      setCurrentPrice(priceData);
      setPriceHistory(history);
      setExchangeStatus(status);
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch price data';
      setError(errorMessage);
      console.error('[Oracle] Failed to fetch initial data:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // 刷新价格数据
  const refresh = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);

  // WebSocket连接管理
  const connect = useCallback(() => {
    if (enableWebSocket) {
      oracleClient.connectWebSocket(symbol);
    }
  }, [enableWebSocket, symbol]);

  const disconnect = useCallback(() => {
    oracleClient.disconnectWebSocket();
  }, []);

  // WebSocket消息处理
  const handlePriceUpdate = useCallback((data: OraclePriceUpdate) => {
    if (data.symbol !== symbol) return;

    const priceData: PriceData = {
      ...data.data,
      formattedPrice: oracleClient.formatPrice(data.data.price),
    };

    // 计算价格变化
    if (previousPriceRef.current !== null) {
      const currentPriceNum = parseFloat(data.data.price);
      priceData.priceChange = oracleClient.calculatePriceChange(
        currentPriceNum,
        previousPriceRef.current
      );
    }
    previousPriceRef.current = parseFloat(data.data.price);

    setCurrentPrice(priceData);
    setLastUpdate(new Date());
    setUpdateCount(prev => prev + 1);
    setError(null); // 清除错误状态

    console.log(`[Oracle] Price updated: ${symbol} = ${priceData.formattedPrice}`);
  }, [symbol]);

  // WebSocket状态处理
  const handleStatusChange = useCallback((status: 'connected' | 'disconnected' | 'error') => {
    setConnected(status === 'connected');

    if (status === 'error') {
      setError('WebSocket connection error');
    } else if (status === 'disconnected') {
      // 切换到轮询模式
      console.log('[Oracle] WebSocket disconnected, switching to polling mode');
    }
  }, []);

  // 初始化
  useEffect(() => {
    // 获取初始数据
    fetchInitialData();

    // 自动连接WebSocket
    if (autoConnect && enableWebSocket) {
      connect();
    }

    // 设置轮询（作为WebSocket的后备方案）
    if (updateInterval > 0) {
      pollingIntervalRef.current = setInterval(() => {
        if (!connected) { // 只在WebSocket未连接时进行轮询
          refresh();
        }
      }, updateInterval);
    }

    return () => {
      // 清理
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchInitialData, autoConnect, enableWebSocket, connect, refresh, updateInterval, connected]);

  // WebSocket订阅管理
  useEffect(() => {
    // 订阅价格更新
    oracleClient.subscribe(hookIdRef.current, handlePriceUpdate);
    oracleClient.onStatusChange(handleStatusChange);

    return () => {
      // 取消订阅
      oracleClient.unsubscribe(hookIdRef.current);
      oracleClient.offStatusChange(handleStatusChange);
    };
  }, [handlePriceUpdate, handleStatusChange]);

  // 符号变化时重新连接
  useEffect(() => {
    if (connected && enableWebSocket) {
      // 重新连接WebSocket以订阅新符号
      disconnect();
      setTimeout(() => {
        connect();
      }, 100);
    }
  }, [symbol, connected, enableWebSocket, connect, disconnect]);

  return {
    // 价格数据
    currentPrice,
    priceHistory,

    // 状态
    loading,
    error,
    connected,

    // 交易所状态
    exchangeStatus,

    // 操作方法
    refresh,
    connect,
    disconnect,

    // 统计信息
    lastUpdate,
    updateCount,
  };
};