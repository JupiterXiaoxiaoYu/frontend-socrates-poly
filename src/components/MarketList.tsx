// Enhanced Market List component with paired market support
// Shows markets individually and as pairs, with filtering and real-time updates

import { useState, useEffect, useMemo } from 'react';
import { Market, MarketStatus, OutcomeType } from '@/types/market';
import { apiService } from '@/services/api';
import { webSocketService } from '@/services/websocket';
import MarketCard from './MarketCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowUpDown,
  Filter,
  Grid,
  List,
  RefreshCw,
  Search,
  SortAsc,
  SortDesc,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketListProps {
  onMarketSelect: (market: Market, pairedMarket?: Market) => void;
  showPairedMarkets?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list' | 'pairs';
type SortBy = 'timeRemaining' | 'volume' | 'traders' | 'price' | 'status';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'pending' | 'active' | 'closed' | 'resolved';
type FilterAsset = 'all' | '1' | '2' | '3'; // BTC, ETH, SOL
type FilterDuration = 'all' | '1' | '3' | '5'; // minutes

const MarketList: React.FC<MarketListProps> = ({
  onMarketSelect,
  showPairedMarkets = true,
  className
}) => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('pairs');
  const [sortBy, setSortBy] = useState<SortBy>('timeRemaining');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active');
  const [filterAsset, setFilterAsset] = useState<FilterAsset>('all');
  const [filterDuration, setFilterDuration] = useState<FilterDuration>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Load initial data
  useEffect(() => {
    loadMarkets();

    // Set up WebSocket subscriptions
    const unsubscribeMarkets = webSocketService.onAllMarkets((update) => {
      setMarkets(prev => prev.map(market =>
        market.marketId === update.marketId
          ? { ...market, ...update }
          : market
      ));
    });

    const unsubscribePrices = webSocketService.onPriceUpdate((priceUpdate) => {
      setMarkets(prev => prev.map(market =>
        market.assetId === priceUpdate.assetId
          ? { ...market, currentPrice: priceUpdate.price }
          : market
      ));
    });

    return () => {
      unsubscribeMarkets();
      unsubscribePrices();
    };
  }, []);

  const loadMarkets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMarkets();
      setMarkets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load markets');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMarkets();
    setRefreshing(false);
  };

  // Filter and sort markets
  const filteredMarkets = useMemo(() => {
    let filtered = [...markets];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(market =>
        market.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${market.assetId === 1 ? 'BTC' : market.assetId === 2 ? 'ETH' : 'SOL'} ${market.outcomeType === OutcomeType.UP ? 'UP' : 'DOWN'}`
          .toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      const statusMap = {
        'pending': MarketStatus.PENDING,
        'active': MarketStatus.ACTIVE,
        'closed': MarketStatus.CLOSED,
        'resolved': MarketStatus.RESOLVED,
      };
      filtered = filtered.filter(market => market.status === statusMap[filterStatus as keyof typeof statusMap]);
    }

    // Apply asset filter
    if (filterAsset !== 'all') {
      filtered = filtered.filter(market => market.assetId === parseInt(filterAsset));
    }

    // Apply duration filter
    if (filterDuration !== 'all') {
      filtered = filtered.filter(market => market.windowMinutes === parseInt(filterDuration));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'timeRemaining':
          aValue = a.timeRemaining || 0;
          bValue = b.timeRemaining || 0;
          break;
        case 'volume':
          aValue = a.volume || 0;
          bValue = b.volume || 0;
          break;
        case 'traders':
          aValue = a.traders || 0;
          bValue = b.traders || 0;
          break;
        case 'price':
          aValue = a.currentPrice || 0;
          bValue = b.currentPrice || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.marketId;
          bValue = b.marketId;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [markets, searchTerm, filterStatus, filterAsset, filterDuration, sortBy, sortOrder]);

  // Group markets into pairs
  const marketPairs = useMemo(() => {
    const pairs: Array<{ up: Market; down: Market }> = [];
    const processed = new Set<number>();

    filteredMarkets.forEach(market => {
      if (processed.has(market.marketId)) return;

      if (market.pairedMarketId) {
        const pairedMarket = filteredMarkets.find(m => m.marketId === market.pairedMarketId);
        if (pairedMarket && !processed.has(pairedMarket.marketId)) {
          // Sort by outcome type
          if (market.outcomeType === OutcomeType.DOWN && pairedMarket.outcomeType === OutcomeType.UP) {
            pairs.push({ up: pairedMarket, down: market });
          } else {
            pairs.push({ up: market, down: pairedMarket });
          }
          processed.add(market.marketId);
          processed.add(pairedMarket.marketId);
        }
      } else {
        // Unpaired market
        if (market.outcomeType === OutcomeType.UP) {
          pairs.push({ up: market, down: null as any });
        } else {
          pairs.push({ up: null as any, down: market });
        }
        processed.add(market.marketId);
      }
    });

    return pairs;
  }, [filteredMarkets]);

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
      case MarketStatus.ACTIVE: return 'bg-green-500';
      case MarketStatus.PENDING: return 'bg-yellow-500';
      case MarketStatus.CLOSED: return 'bg-orange-500';
      case MarketStatus.RESOLVED: return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading markets...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-red-500 mb-2">Error loading markets</div>
            <div className="text-sm text-muted-foreground mb-4">{error}</div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Prediction Markets
              <Badge variant="secondary">{filteredMarkets.length}</Badge>
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search markets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAsset} onValueChange={(value: FilterAsset) => setFilterAsset(value)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  <SelectItem value="1">BTC</SelectItem>
                  <SelectItem value="2">ETH</SelectItem>
                  <SelectItem value="3">SOL</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDuration} onValueChange={(value: FilterDuration) => setFilterDuration(value)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Times</SelectItem>
                  <SelectItem value="1">1 min</SelectItem>
                  <SelectItem value="3">3 min</SelectItem>
                  <SelectItem value="5">5 min</SelectItem>
                </SelectContent>
              </Select>

              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-') as [SortBy, SortOrder];
                setSortBy(field);
                setSortOrder(order);
              }}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timeRemaining-asc">
                    <Clock className="inline h-3 w-3 mr-1" />
                    Time ↑
                  </SelectItem>
                  <SelectItem value="timeRemaining-desc">
                    <Clock className="inline h-3 w-3 mr-1" />
                    Time ↓
                  </SelectItem>
                  <SelectItem value="volume-desc">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    Volume ↓
                  </SelectItem>
                  <SelectItem value="traders-desc">
                    Users ↓
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* View mode tabs */}
      {showPairedMarkets && (
        <Tabs value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="pairs" className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Market Pairs
              </TabsTrigger>
              <TabsTrigger value="grid" className="flex items-center gap-2">
                <Grid className="h-4 w-4" />
                Grid View
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
            </TabsList>

            <div className="text-sm text-muted-foreground">
              {filteredMarkets.length} markets found
            </div>
          </div>

          {/* Market pairs view */}
          <TabsContent value="pairs" className="space-y-4 mt-4">
            {marketPairs.map((pair, index) => (
              <Card key={`pair-${pair.up?.marketId || pair.down.marketId}-${index}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getAssetName(pair.up?.assetId || pair.down.assetId)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {pair.up?.windowMinutes || pair.down.windowMinutes}min window
                      </Badge>
                      {pair.up && (
                        <div className={cn("w-2 h-2 rounded-full", getStatusColor(pair.up.status))} />
                      )}
                    </div>
                    {pair.up?.status === MarketStatus.ACTIVE && (
                      <div className="text-xs text-muted-foreground">
                        {Math.round((pair.up.progress || 0) * 100)}% complete
                      </div>
                    )}
                  </div>

                  <div className={cn(
                    "grid gap-4",
                    pair.up && pair.down ? "md:grid-cols-2" : "md:grid-cols-1"
                  )}>
                    {pair.up && (
                      <MarketCard
                        market={pair.up}
                        pairedMarket={pair.down}
                        onClick={() => onMarketSelect(pair.up, pair.down)}
                        showPairedMarket={false}
                      />
                    )}
                    {pair.down && (
                      <MarketCard
                        market={pair.down}
                        pairedMarket={pair.up}
                        onClick={() => onMarketSelect(pair.down, pair.up)}
                        showPairedMarket={false}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Grid view */}
          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {filteredMarkets.map((market) => {
                const pairedMarket = market.pairedMarketId
                  ? markets.find(m => m.marketId === market.pairedMarketId)
                  : undefined;

                return (
                  <MarketCard
                    key={market.marketId}
                    market={market}
                    pairedMarket={pairedMarket}
                    onClick={() => onMarketSelect(market, pairedMarket)}
                  />
                );
              })}
            </div>
          </TabsContent>

          {/* List view */}
          <TabsContent value="list">
            <div className="space-y-2 mt-4">
              {filteredMarkets.map((market) => {
                const pairedMarket = market.pairedMarketId
                  ? markets.find(m => m.marketId === market.pairedMarketId)
                  : undefined;

                return (
                  <Card key={market.marketId} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onMarketSelect(market, pairedMarket)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">
                              {market.title || `${getAssetName(market.assetId)} ${market.outcomeType === OutcomeType.UP ? 'UP' : 'DOWN'}`}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {market.windowMinutes}min
                            </Badge>
                            {pairedMarket && (
                              <Badge variant="secondary" className="text-xs">
                                Paired
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {market.traders || 0} traders • {formatCurrency(market.volume || 0)} volume
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(market.currentPrice || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {Math.round((market.yesChance || 0) * 100)}% YES
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Simple grid view when paired markets are disabled */}
      {!showPairedMarkets && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMarkets.map((market) => {
            const pairedMarket = market.pairedMarketId
              ? markets.find(m => m.marketId === market.pairedMarketId)
              : undefined;

            return (
              <MarketCard
                key={market.marketId}
                market={market}
                pairedMarket={pairedMarket}
                onClick={() => onMarketSelect(market, pairedMarket)}
                showPairedMarket={showPairedMarkets}
              />
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {filteredMarkets.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">
              {searchTerm || filterStatus !== 'all' || filterAsset !== 'all' || filterDuration !== 'all'
                ? 'No markets match your current filters.'
                : 'No markets available at the moment.'}
            </div>
            {(searchTerm || filterStatus !== 'all' || filterAsset !== 'all' || filterDuration !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterAsset('all');
                  setFilterDuration('all');
                }}
                className="mt-2"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper function for currency formatting
function formatCurrency(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export default MarketList;