// Comprehensive Trading Dashboard with Charts and Analytics
// Displays market data, price charts, order book, and trading statistics

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  DollarSign,
  Users,
  Clock,
  ArrowUpDown,
  Zap,
  Volume2,
  Eye,
  EyeOff,
  RefreshCw,
  Maximize2,
  Download
} from 'lucide-react';
import { cn, formatCurrency, formatPercent, formatCompactNumber } from '@/lib/utils';
import { Market, Trade, Order, OrderBookData, MarketStatus } from '@/types/market';
import { apiService } from '@/services/api';
import { webSocketService } from '@/services/websocket';
import PriceChart from './PriceChart';
import OrderBook from './OrderBook';
import RecentTrades from './RecentTrades';

interface TradingDashboardProps {
  market: Market;
  pairedMarket?: Market;
  className?: string;
}

interface MarketStats {
  volume24h: number;
  trades24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  openInterest: number;
  liquidity: number;
}

const TradingDashboard: React.FC<TradingDashboardProps> = ({
  market,
  pairedMarket,
  className
}) => {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [priceHistory, setPriceHistory] = useState<Array<{ timestamp: number; price: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    loadMarketData();
    setupSubscriptions();

    return () => {
      // Cleanup subscriptions
    };
  }, [market.marketId]);

  const loadMarketData = async () => {
    setLoading(true);
    try {
      const [orderBookData, tradesData] = await Promise.all([
        apiService.getOrderBook(market.marketId),
        apiService.getTrades(market.marketId, 50)
      ]);

      setOrderBook(orderBookData);
      setRecentTrades(tradesData);

      // Generate mock price history
      const history = generateMockPriceHistory();
      setPriceHistory(history);

      // Calculate market stats
      const marketStats = calculateMarketStats(tradesData);
      setStats(marketStats);
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  };

  const setupSubscriptions = () => {
    // Subscribe to order book updates
    const unsubscribeOrderBook = webSocketService.onOrderBookUpdate(market.marketId, (update) => {
      setOrderBook(update);
    });

    // Subscribe to trade updates
    const unsubscribeTrades = webSocketService.onTradeUpdate(market.marketId, (update) => {
      setRecentTrades(prev => [update, ...prev.slice(0, 49)]);
      setStats(prev => prev ? calculateUpdatedStats(prev, update) : null);
    });

    // Subscribe to price updates
    const unsubscribePrices = webSocketService.onPriceUpdate((updates) => {
      const assetUpdate = Array.isArray(updates)
        ? updates.find(u => u.assetId === market.assetId)
        : updates.assetId === market.assetId ? updates : null;

      if (assetUpdate) {
        setPriceHistory(prev => {
          const newPoint = { timestamp: Date.now(), price: assetUpdate.price };
          return [...prev.slice(-99), newPoint];
        });
      }
    });

    return () => {
      unsubscribeOrderBook();
      unsubscribeTrades();
      unsubscribePrices();
    };
  };

  const generateMockPriceHistory = () => {
    const history = [];
    const basePrice = market.currentPrice || 0.5;
    const now = Date.now();

    for (let i = 100; i >= 0; i--) {
      const timestamp = now - (i * 60000); // 1 minute intervals
      const randomChange = (Math.random() - 0.5) * 0.02;
      const price = basePrice + randomChange;
      history.push({ timestamp, price: Math.max(0.01, Math.min(0.99, price)) });
    }

    return history;
  };

  const calculateMarketStats = (trades: Trade[]): MarketStats => {
    const volume24h = trades.reduce((sum, trade) => sum + (trade.price * trade.amount), 0);
    const trades24h = trades.length;

    // Mock calculations for demo
    const priceChange24h = (Math.random() - 0.5) * 0.1;
    const priceChangePercent24h = (priceChange24h / (market.currentPrice || 0.5)) * 100;
    const currentPrice = market.currentPrice || 0.5;
    const high24h = currentPrice * (1 + Math.random() * 0.05);
    const low24h = currentPrice * (1 - Math.random() * 0.05);

    return {
      volume24h,
      trades24h,
      priceChange24h,
      priceChangePercent24h,
      high24h,
      low24h,
      openInterest: Math.random() * 100000,
      liquidity: Math.random() * 50000
    };
  };

  const calculateUpdatedStats = (prevStats: MarketStats, newTrade: Trade): MarketStats => {
    return {
      ...prevStats,
      volume24h: prevStats.volume24h + (newTrade.price * newTrade.amount),
      trades24h: prevStats.trades24h + 1
    };
  };

  const handleRefresh = async () => {
    await loadMarketData();
  };

  const handleExportData = () => {
    const data = {
      market,
      orderBook,
      recentTrades,
      stats,
      priceHistory,
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-${market.marketId}-data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAssetName = (assetId: number): string => {
    switch (assetId) {
      case 1: return 'BTC';
      case 2: return 'ETH';
      case 3: return 'SOL';
      default: return `Asset ${assetId}`;
    }
  };

  const getStatusColor = (status: MarketStatus): string => {
    switch (status) {
      case MarketStatus.ACTIVE: return 'text-green-600';
      case MarketStatus.PENDING: return 'text-yellow-600';
      case MarketStatus.CLOSED: return 'text-orange-600';
      case MarketStatus.RESOLVED: return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading && !orderBook) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading market data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Market Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">
                  {getAssetName(market.assetId)} {market.outcomeType === 1 ? 'UP' : 'DOWN'}
                </h2>
                <Badge variant="outline">{market.windowMinutes}min window</Badge>
                {pairedMarket && (
                  <Badge variant="secondary">Paired</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  Market ID: {market.marketId}
                </span>
                <span className={cn("flex items-center gap-1", getStatusColor(market.status))}>
                  {market.status === MarketStatus.ACTIVE ? <Zap className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  {market.status === MarketStatus.ACTIVE ? 'Active' :
                   market.status === MarketStatus.PENDING ? 'Pending' :
                   market.status === MarketStatus.CLOSED ? 'Closed' : 'Resolved'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullscreen(!showFullscreen)}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                {showFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {stats && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(market.currentPrice || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Current Price</div>
                <div className={cn(
                  "text-xs flex items-center gap-1 mt-1",
                  stats.priceChangePercent24h > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {stats.priceChangePercent24h > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {formatPercent(stats.priceChangePercent24h / 100, 2)}
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.volume24h, 0)}
                </div>
                <div className="text-sm text-muted-foreground">24h Volume</div>
              </div>

              <div>
                <div className="text-2xl font-bold">{stats.trades24h}</div>
                <div className="text-sm text-muted-foreground">24h Trades</div>
              </div>

              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.high24h)}
                </div>
                <div className="text-sm text-muted-foreground">24h High</div>
              </div>

              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.low24h)}
                </div>
                <div className="text-sm text-muted-foreground">24h Low</div>
              </div>

              <div>
                <div className="text-2xl font-bold">
                  {formatCompactNumber(stats.liquidity, 1)}
                </div>
                <div className="text-sm text-muted-foreground">Liquidity</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Trading Interface */}
      <div className={cn(
        "grid gap-4",
        showFullscreen
          ? "grid-cols-1 lg:grid-cols-3"
          : "grid-cols-1 lg:grid-cols-2"
      )}>
        {/* Left Column - Price Chart */}
        <div className={cn(
          showFullscreen ? "lg:col-span-2" : "",
          "space-y-4"
        )}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Price Chart</CardTitle>
                <div className="flex gap-2">
                  {['1m', '5m', '15m', '1h', '4h', '1d'].map((timeframe) => (
                    <Button
                      key={timeframe}
                      variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTimeframe(timeframe)}
                    >
                      {timeframe}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <PriceChart
                data={priceHistory}
                height={showFullscreen ? 400 : 300}
                showVolume={true}
                market={market}
              />
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTrades trades={recentTrades} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Book */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Order Book
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderBook data={orderBook} />
            </CardContent>
          </Card>

          {/* Market Depth */}
          {orderBook && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Depth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Bid Liquidity</span>
                      <span>{formatCompactNumber(
                        orderBook.bids.reduce((sum, bid) => sum + bid.total, 0),
                        1
                      )}</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Ask Liquidity</span>
                      <span>{formatCompactNumber(
                        orderBook.asks.reduce((sum, ask) => sum + ask.total, 0),
                        1
                      )}</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Spread</span>
                      <span className="font-semibold">
                        {formatCurrency(orderBook.spread)} ({formatPercent(orderBook.spread / orderBook.midPrice, 2)})
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paired Market Info */}
          {pairedMarket && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5" />
                  Paired Market
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {getAssetName(pairedMarket.assetId)} {pairedMarket.outcomeType === 1 ? 'UP' : 'DOWN'}
                    </span>
                    <Badge variant="outline">ID: {pairedMarket.marketId}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="font-medium">
                      {formatCurrency(pairedMarket.currentPrice || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="secondary">
                      {pairedMarket.status === MarketStatus.ACTIVE ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Market Progress (for active markets) */}
      {market.status === MarketStatus.ACTIVE && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Market Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Time Remaining</span>
                <span>{Math.round((market.progress || 0) * 100)}% Complete</span>
              </div>
              <Progress value={(market.progress || 0) * 100} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {market.timeRemaining ? `${Math.floor(market.timeRemaining / 60000)}m ${Math.floor((market.timeRemaining % 60000) / 1000)}s remaining` : 'Ending soon'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TradingDashboard;