// Oracle Price Feed Component
// Displays real-time price data, price changes, and oracle connection status

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { cn, formatCurrency, formatPercent, formatTime } from '@/lib/utils';
import { apiService } from '@/services/api';
import { webSocketService } from '@/services/websocket';

interface OraclePrice {
  assetId: number;
  asset: string;
  price: number;
  timestamp: number;
  change24h?: number;
  changePercent24h?: number;
  volume24h?: number;
  source?: string;
  status?: 'connected' | 'disconnected' | 'stale';
}

interface OraclePriceFeedProps {
  supportedAssets?: number[];
  className?: string;
  showDetails?: boolean;
  onAssetSelect?: (assetId: number) => void;
}

const DEFAULT_ASSETS = [1, 2, 3]; // BTC, ETH, SOL

const OraclePriceFeed: React.FC<OraclePriceFeedProps> = ({
  supportedAssets = DEFAULT_ASSETS,
  className,
  showDetails = true,
  onAssetSelect
}) => {
  const [prices, setPrices] = useState<OraclePrice[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'stale'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<number | null>(null);

  useEffect(() => {
    loadInitialPrices();
    setupWebSocketSubscription();

    return () => {
      // Cleanup subscriptions
    };
  }, [supportedAssets]);

  const loadInitialPrices = async () => {
    setIsRefreshing(true);
    try {
      const priceData = await Promise.all(
        supportedAssets.map(async (assetId) => {
          const price = await apiService.getCurrentPrice(assetId);
          if (!price) return null;

          return {
            assetId,
            asset: price.asset,
            price: price.price,
            timestamp: price.timestamp,
            source: price.source,
            change24h: Math.random() * 1000 - 500, // Mock data
            changePercent24h: (Math.random() - 0.5) * 10, // Mock data
            volume24h: Math.random() * 1000000, // Mock data
            status: 'connected' as const
          };
        })
      );

      const validPrices = priceData.filter(Boolean) as OraclePrice[];
      setPrices(validPrices);
      setLastUpdate(Date.now());
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('disconnected');
    } finally {
      setIsRefreshing(false);
    }
  };

  const setupWebSocketSubscription = () => {
    // Subscribe to price updates
    const unsubscribe = webSocketService.onPriceUpdate((updates) => {
      if (Array.isArray(updates)) {
        updatePrices(updates);
      } else {
        updatePrices([updates]);
      }
    });

    // Monitor connection status
    const statusInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdate;

      if (timeSinceLastUpdate > 30000) { // 30 seconds
        setConnectionStatus('stale');
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  };

  const updatePrices = (updates: any[]) => {
    setPrices(prevPrices => {
      const updatedPrices = [...prevPrices];

      updates.forEach(update => {
        const index = updatedPrices.findIndex(p => p.assetId === update.assetId);
        if (index !== -1) {
          const oldPrice = updatedPrices[index].price;
          const newPrice = update.price;
          const priceChange = newPrice - oldPrice;
          const priceChangePercent = oldPrice > 0 ? (priceChange / oldPrice) * 100 : 0;

          updatedPrices[index] = {
            ...updatedPrices[index],
            price: newPrice,
            timestamp: update.timestamp || Date.now(),
            change24h: updatedPrices[index].change24h + priceChange,
            changePercent24h: updatedPrices[index].changePercent24h! + priceChangePercent,
            status: 'connected'
          };
        }
      });

      setLastUpdate(Date.now());
      setConnectionStatus('connected');
      return updatedPrices;
    });
  };

  const handleRefresh = async () => {
    await loadInitialPrices();
  };

  const handleAssetClick = (assetId: number) => {
    setSelectedAsset(assetId === selectedAsset ? null : assetId);
    onAssetSelect?.(assetId);
  };

  const getAssetIcon = (asset: string): React.ReactNode => {
    switch (asset) {
      case 'BTC': return '₿';
      case 'ETH': return 'Ξ';
      case 'SOL': return '◎';
      default: return '$';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'stale': return 'text-yellow-600';
      case 'disconnected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'stale': return <AlertCircle className="h-4 w-4" />;
      case 'disconnected': return <WifiOff className="h-4 w-4" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  const getConnectionBadge = () => {
    const status = connectionStatus;
    return (
      <Badge
        variant={status === 'connected' ? 'default' : 'destructive'}
        className={cn("flex items-center gap-1", {
          'bg-green-100 text-green-800 border-green-200': status === 'connected',
          'bg-yellow-100 text-yellow-800 border-yellow-200': status === 'stale',
          'bg-red-100 text-red-800 border-red-200': status === 'disconnected',
        })}
      >
        {getStatusIcon(status)}
        {status === 'connected' ? 'Live' : status === 'stale' ? 'Stale' : 'Offline'}
      </Badge>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle className="text-lg">Oracle Price Feed</CardTitle>
              {getConnectionBadge()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {lastUpdate > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last updated: {formatTime(lastUpdate)}
            </div>
          )}
        </CardHeader>

        {showDetails && connectionStatus === 'disconnected' && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <WifiOff className="h-4 w-4 text-red-600" />
              <div className="text-sm text-red-800">
                Unable to connect to oracle price feed. Showing cached data.
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prices.map((priceData) => (
          <Card
            key={priceData.assetId}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedAsset === priceData.assetId && "ring-2 ring-primary",
              priceData.status === 'stale' && "opacity-75"
            )}
            onClick={() => handleAssetClick(priceData.assetId)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {getAssetIcon(priceData.asset)}
                  </div>
                  <div>
                    <div className="font-semibold">{priceData.asset}</div>
                    <div className="text-xs text-muted-foreground">
                      {priceData.source || 'Oracle'}
                    </div>
                  </div>
                </div>
                <div className={cn("text-xs px-2 py-1 rounded-full", {
                  "bg-green-100 text-green-800": priceData.status === 'connected',
                  "bg-yellow-100 text-yellow-800": priceData.status === 'stale',
                  "bg-red-100 text-red-800": priceData.status === 'disconnected',
                })}>
                  {priceData.status}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formatCurrency(priceData.price)}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    priceData.changePercent24h! > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {priceData.changePercent24h! > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {formatPercent(priceData.changePercent24h! / 100, 2)}
                  </div>
                </div>

                {showDetails && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>24h Change:</span>
                      <span className={cn(
                        "font-medium",
                        priceData.change24h! > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {priceData.change24h! > 0 ? '+' : ''}{formatCurrency(priceData.change24h!)}
                      </span>
                    </div>
                    {priceData.volume24h && (
                      <div className="flex justify-between">
                        <span>24h Volume:</span>
                        <span className="font-medium">
                          {formatCurrency(priceData.volume24h, 0)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedAsset === priceData.assetId && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Update:</span>
                      <span>{formatTime(priceData.timestamp)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price ID:</span>
                      <span className="font-mono text-xs">{priceData.assetId}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Market Overview */}
      {showDetails && prices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Market Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {prices.filter(p => p.changePercent24h! > 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Gainers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {prices.filter(p => p.changePercent24h! < 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Losers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    prices.reduce((sum, p) => sum + (p.volume24h || 0), 0),
                    0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Total Volume</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatPercent(
                    prices.reduce((sum, p) => sum + (p.changePercent24h! || 0), 0) / prices.length / 100,
                    2
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Avg Change</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Oracle Info */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              Oracle Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Price data is provided by blockchain oracles and updated in real-time.
                Prices are used for market resolution when prediction markets expire.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Activity className="h-4 w-4" />
                <span>Connection Status: {connectionStatus}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Update Frequency: ~5 seconds</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OraclePriceFeed;