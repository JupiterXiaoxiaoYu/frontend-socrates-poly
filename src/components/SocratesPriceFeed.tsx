/**
 * Socrates Oracle Price Feed Component
 *
 * 专门用于显示Socrates Chain Oracle API的价格数据
 * 支持实时WebSocket连接和价格变化显示
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Wifi,
  WifiOff,
  AlertCircle,
  RefreshCw,
  Clock,
  Database,
  Info
} from 'lucide-react';
import { useOraclePrice } from '@/hooks/useOraclePrice';

interface SocratesPriceFeedProps {
  symbol?: string;
  enableWebSocket?: boolean;
  className?: string;
  showDetails?: boolean;
  showHistory?: boolean;
  showExchangeStatus?: boolean;
}

export const SocratesPriceFeed: React.FC<SocratesPriceFeedProps> = ({
  symbol = 'BTC/USD',
  enableWebSocket = true,
  className = '',
  showDetails = true,
  showHistory = false,
  showExchangeStatus = false
}) => {
  const {
    currentPrice,
    priceHistory,
    loading,
    error,
    connected,
    exchangeStatus,
    refresh,
    connect,
    disconnect,
    lastUpdate,
    updateCount
  } = useOraclePrice({
    symbol,
    enableWebSocket,
    autoConnect: true
  });

  const formatChangePercent = (percent: number): string => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const formatTimestamp = (timestamp: string | number): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  const getConnectionIcon = () => {
    if (loading) return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    if (error) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (connected) return <Wifi className="h-4 w-4 text-green-500" />;
    return <WifiOff className="h-4 w-4 text-gray-500" />;
  };

  const getConnectionBadge = () => {
    if (loading) return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Loading</Badge>;
    if (error) return <Badge variant="destructive">Error</Badge>;
    if (connected) return <Badge variant="default" className="bg-green-100 text-green-800">Live</Badge>;
    return <Badge variant="secondary">Offline</Badge>;
  };

  const getTrendIcon = () => {
    if (!currentPrice?.priceChange) return null;

    switch (currentPrice.priceChange.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!currentPrice?.priceChange) return 'text-gray-600';

    switch (currentPrice.priceChange.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading && !currentPrice) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle className="text-lg">{symbol} Price</CardTitle>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Price Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle className="text-lg">{symbol}</CardTitle>
              {getConnectionBadge()}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Updates: {updateCount}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {lastUpdate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last update: {formatTimestamp(lastUpdate.getTime())}
            </div>
          )}
        </CardHeader>

        {error && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="text-sm text-red-800">
                {error}
              </div>
            </div>
          </CardContent>
        )}

        {currentPrice && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Current Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold">
                    {currentPrice.formattedPrice}
                  </span>
                  {getTrendIcon()}
                </div>

                {currentPrice.priceChange && (
                  <div className={`text-right ${getTrendColor()}`}>
                    <div className="text-lg font-semibold">
                      {formatChangePercent(currentPrice.priceChange.changePercent)}
                    </div>
                    <div className="text-sm">
                      {currentPrice.priceChange.change >= 0 ? '+' : ''}
                      ${Math.abs(currentPrice.priceChange.change).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Details */}
              {showDetails && (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Sources:</span>
                      <span className="font-medium">
                        {currentPrice.sources.join(', ') || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Data Age:</span>
                      <span className="font-medium">{currentPrice.data_age_seconds}s</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timestamp:</span>
                      <span className="font-medium">{formatTimestamp(currentPrice.unix_time)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connection:</span>
                      <div className="flex items-center gap-1">
                        {getConnectionIcon()}
                        <span className="font-medium">{connected ? 'WebSocket' : 'Polling'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Prices */}
              {showDetails && Object.keys(currentPrice.individual_prices).length > 1 && (
                <div className="pt-3 border-t">
                  <div className="text-sm font-medium mb-2">Exchange Prices:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(currentPrice.individual_prices).map(([exchange, price]) => (
                      <div key={exchange} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="text-muted-foreground">{exchange}:</span>
                        <span className="font-medium">${parseFloat(price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Exchange Status */}
      {showExchangeStatus && exchangeStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Exchange Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exchangeStatus.map((exchange, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      exchange.connected ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{exchange.name}</span>
                  </div>
                  <div className="text-right text-sm">
                    <div>${parseFloat(exchange.last_price).toLocaleString()}</div>
                    <div className="text-muted-foreground">
                      {exchange.update_count} updates | {exchange.error_count} errors
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent History */}
      {showHistory && priceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Price History (60 seconds)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {priceHistory.slice(0, 10).map((price, index) => (
                <div key={index} className="flex justify-between items-center p-2 border-b text-sm">
                  <span className="text-muted-foreground">
                    {formatTimestamp(price.unix_time)}
                  </span>
                  <span className="font-medium">${parseFloat(price.price).toLocaleString()}</span>
                  <div className="flex items-center gap-1">
                    <Database className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{price.sources[0]}</span>
                  </div>
                </div>
              ))}
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
                Real-time price data from Socrates Chain Oracle API.
                Prices are aggregated from multiple exchanges with weighted averaging.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  <span>WebSocket: {connected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Auto-refresh: Active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SocratesPriceFeed;