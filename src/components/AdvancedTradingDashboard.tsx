/**
 * Advanced Trading Dashboard with TradingView Integration
 *
 * 完整的交易仪表板，集成实时价格、图表、订单簿、交易历史等
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Settings,
  Maximize2,
  Volume2,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

// 导入自定义组件
import { SocratesPriceFeed } from './SocratesPriceFeed';
import { TradingViewChart } from './TradingViewChart';
import { useOraclePrice } from '@/hooks/useOraclePrice';

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  type: 'bid' | 'ask';
}

interface TradeEntry {
  time: string;
  price: number;
  amount: number;
  type: 'buy' | 'sell';
}

interface AdvancedTradingDashboardProps {
  symbol?: string;
  enableWebSocket?: boolean;
  className?: string;
}

export const AdvancedTradingDashboard: React.FC<AdvancedTradingDashboardProps> = ({
  symbol = 'BTC/USD',
  enableWebSocket = true,
  className = ''
}) => {
  const [chartHeight, setChartHeight] = useState(500);
  const [showVolume, setShowVolume] = useState(true);
  const [showTechnicalIndicators, setShowTechnicalIndicators] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1');

  const {
    currentPrice,
    priceHistory,
    loading,
    error,
    connected,
    exchangeStatus,
    refresh,
    updateCount
  } = useOraclePrice({
    symbol,
    enableWebSocket,
    autoConnect: true
  });

  // 模拟订单簿数据
  const mockOrderBook: OrderBookEntry[] = React.useMemo(() => {
    const basePrice = currentPrice ? parseFloat(currentPrice.price) : 45000;
    const orderBook: OrderBookEntry[] = [];

    // 生成买单 (Bids)
    for (let i = 0; i < 10; i++) {
      const price = basePrice - (i + 1) * 10;
      const amount = Math.random() * 10 + 0.1;
      orderBook.push({
        price,
        amount,
        total: price * amount,
        type: 'bid'
      });
    }

    // 生成卖单 (Asks)
    for (let i = 0; i < 10; i++) {
      const price = basePrice + (i + 1) * 10;
      const amount = Math.random() * 10 + 0.1;
      orderBook.push({
        price,
        amount,
        total: price * amount,
        type: 'ask'
      });
    }

    return orderBook.sort((a, b) => b.price - a.price);
  }, [currentPrice]);

  // 模拟交易历史
  const mockTradeHistory: TradeEntry[] = React.useMemo(() => {
    const trades: TradeEntry[] = [];
    const basePrice = currentPrice ? parseFloat(currentPrice.price) : 45000;

    for (let i = 0; i < 20; i++) {
      const price = basePrice + (Math.random() - 0.5) * 100;
      const amount = Math.random() * 5 + 0.1;
      const time = new Date(Date.now() - i * 30000).toLocaleTimeString();

      trades.push({
        time,
        price,
        amount,
        type: Math.random() > 0.5 ? 'buy' : 'sell'
      });
    }

    return trades;
  }, [currentPrice]);

  // 格式化数字
  const formatNumber = (num: number, decimals: number = 2): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // 计算统计数据
  const stats = React.useMemo(() => {
    const bids = mockOrderBook.filter(o => o.type === 'bid');
    const asks = mockOrderBook.filter(o => o.type === 'ask');

    const totalBidVolume = bids.reduce((sum, bid) => sum + bid.amount, 0);
    const totalAskVolume = asks.reduce((sum, ask) => sum + ask.amount, 0);
    const spread = asks.length > 0 && bids.length > 0 ? asks[asks.length - 1].price - bids[0].price : 0;
    const weightedAvgPrice = mockOrderBook.reduce((sum, order) => sum + order.price * order.amount, 0) /
                              mockOrderBook.reduce((sum, order) => sum + order.amount, 0);

    return {
      totalBidVolume,
      totalAskVolume,
      spread,
      spreadPercent: (spread / weightedAvgPrice) * 100,
      weightedAvgPrice,
      totalOrders: mockOrderBook.length
    };
  }, [mockOrderBook]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setChartHeight(isFullscreen ? 500 : window.innerHeight - 200);
  };

  return (
    <div className={`space-y-4 ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{symbol} Trading Dashboard</h1>
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? 'Live' : 'Offline'}
          </Badge>
          {currentPrice && (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{currentPrice.formattedPrice}</span>
              {currentPrice.priceChange?.direction === 'up' && (
                <TrendingUp className="h-5 w-5 text-green-600" />
              )}
              {currentPrice.priceChange?.direction === 'down' && (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            Updates: {updateCount} | Last: {new Date().toLocaleTimeString()}
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4 mr-2" />
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="chart-height">Chart Height:</Label>
              <Select value={chartHeight.toString()} onValueChange={(value) => setChartHeight(Number(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">400px</SelectItem>
                  <SelectItem value="500">500px</SelectItem>
                  <SelectItem value="600">600px</SelectItem>
                  <SelectItem value="800">800px</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="show-volume">Volume:</Label>
              <Switch id="show-volume" checked={showVolume} onCheckedChange={setShowVolume} />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="technical-indicators">Indicators:</Label>
              <Switch id="technical-indicators" checked={showTechnicalIndicators} onCheckedChange={setShowTechnicalIndicators} />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="auto-refresh">Auto Refresh:</Label>
              <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="timeframe">Timeframe:</Label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1m</SelectItem>
                  <SelectItem value="5">5m</SelectItem>
                  <SelectItem value="15">15m</SelectItem>
                  <SelectItem value="60">1H</SelectItem>
                  <SelectItem value="1D">1D</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <TradingViewChart
            symbol={symbol}
            enableWebSocket={enableWebSocket}
            height={chartHeight}
            showVolume={showVolume}
            showTechnicalIndicators={showTechnicalIndicators}
            autoUpdate={autoRefresh}
          />

          {/* Trading History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mockTradeHistory.map((trade, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border-b">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm text-muted-foreground">{trade.time}</span>
                      <span className="font-medium">{formatCurrency(trade.price)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{formatNumber(trade.amount, 4)}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {formatCurrency(trade.price * trade.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-4">
          {/* Price Feed */}
          <SocratesPriceFeed
            symbol={symbol}
            enableWebSocket={enableWebSocket}
            showDetails={true}
            showExchangeStatus={true}
          />

          {/* Order Book */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Order Book
                </div>
                <div className="text-sm text-muted-foreground">
                  Spread: {formatCurrency(stats.spread)} ({stats.spreadPercent.toFixed(4)}%)
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Asks */}
                <div>
                  <div className="text-sm font-medium text-red-600 mb-2">Sells (Asks)</div>
                  <div className="space-y-1">
                    {mockOrderBook
                      .filter(o => o.type === 'ask')
                      .slice()
                      .reverse()
                      .slice(0, 8)
                      .map((order, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-red-600">{formatCurrency(order.price)}</span>
                          <span>{formatNumber(order.amount, 4)}</span>
                          <span>{formatCurrency(order.total)}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Spread */}
                <div className="border-y py-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Spread</span>
                    <span>{formatCurrency(stats.spread)}</span>
                  </div>
                </div>

                {/* Bids */}
                <div>
                  <div className="text-sm font-medium text-green-600 mb-2">Buys (Bids)</div>
                  <div className="space-y-1">
                    {mockOrderBook
                      .filter(o => o.type === 'bid')
                      .slice(0, 8)
                      .map((order, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-green-600">{formatCurrency(order.price)}</span>
                          <span>{formatNumber(order.amount, 4)}</span>
                          <span>{formatCurrency(order.total)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Market Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bid Volume:</span>
                  <span className="font-medium">{formatNumber(stats.totalBidVolume, 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ask Volume:</span>
                  <span className="font-medium">{formatNumber(stats.totalAskVolume, 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Orders:</span>
                  <span className="font-medium">{stats.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Weighted Avg:</span>
                  <span className="font-medium">{formatCurrency(stats.weightedAvgPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Data Sources:</span>
                  <span className="font-medium">{currentPrice?.sources.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      {!isFullscreen && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Status: {connected ? 'Connected' : 'Disconnected'}</span>
                <span>WebSocket: {enableWebSocket ? 'Enabled' : 'Disabled'}</span>
                <span>Auto Refresh: {autoRefresh ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>API: Socrates Oracle</span>
                <span>Symbol: {symbol}</span>
                <span>Updates: {updateCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedTradingDashboard;