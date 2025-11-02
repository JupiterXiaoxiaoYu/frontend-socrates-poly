// Admin Panel for Market Management
// Provides tools for creating, managing, and resolving prediction markets

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Settings,
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Users,
  DollarSign,
  BarChart3,
  Shield,
  Timer,
  Calendar,
  Activity,
  Power
} from 'lucide-react';
import { cn, formatCurrency, formatTime } from '@/lib/utils';
import { Market, MarketStatus, OutcomeType, GlobalState } from '@/types/market';
import { apiService } from '@/services/api';

interface AdminPanelProps {
  onMarketAction?: (action: string, data: any) => Promise<void>;
  className?: string;
}

interface MarketCreationParams {
  assetId: number;
  duration: number; // in minutes
  oracleStartTime: number;
  oracleStartPrice: number;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  onMarketAction,
  className
}) => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [globalState, setGlobalState] = useState<GlobalState | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTickDialog, setShowTickDialog] = useState(false);
  const [selectedMarkets, setSelectedMarkets] = useState<number[]>([]);
  const [creationParams, setCreationParams] = useState<MarketCreationParams>({
    assetId: 1,
    duration: 5,
    oracleStartTime: Math.floor(Date.now() / 1000),
    oracleStartPrice: 0
  });
  const [tickCount, setTickCount] = useState(1);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [marketsData, stateData] = await Promise.all([
        apiService.getMarkets(),
        apiService.getGlobalState()
      ]);
      setMarkets(marketsData);
      setGlobalState(stateData);
    } catch (error) {
      // Silently handle error
    }
  };

  const handleCreateMarketPair = async () => {
    if (!onMarketAction) return;

    setLoading(true);
    try {
      await onMarketAction('createMarketPair', creationParams);
      setShowCreateDialog(false);
      await loadData();
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  };

  const handleTick = async () => {
    if (!onMarketAction) return;

    setLoading(true);
    try {
      for (let i = 0; i < tickCount; i++) {
        await onMarketAction('tick', {});
      }
      setShowTickDialog(false);
      await loadData();
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (!onMarketAction || selectedMarkets.length === 0) return;

    setLoading(true);
    try {
      await Promise.all(
        selectedMarkets.map(marketId =>
          onMarketAction(action, { marketId })
        )
      );
      setSelectedMarkets([]);
      await loadData();
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: MarketStatus): string => {
    switch (status) {
      case MarketStatus.ACTIVE: return 'bg-green-100 text-green-800 border-green-200';
      case MarketStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case MarketStatus.CLOSED: return 'bg-orange-100 text-orange-800 border-orange-200';
      case MarketStatus.RESOLVED: return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: MarketStatus): React.ReactNode => {
    switch (status) {
      case MarketStatus.ACTIVE: return <Play className="h-4 w-4" />;
      case MarketStatus.PENDING: return <Clock className="h-4 w-4" />;
      case MarketStatus.CLOSED: return <Pause className="h-4 w-4" />;
      case MarketStatus.RESOLVED: return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: MarketStatus): string => {
    switch (status) {
      case MarketStatus.ACTIVE: return 'Active';
      case MarketStatus.PENDING: return 'Pending';
      case MarketStatus.CLOSED: return 'Closed';
      case MarketStatus.RESOLVED: return 'Resolved';
      default: return 'Unknown';
    }
  };

  const getAssetName = (assetId: number): string => {
    switch (assetId) {
      case 1: return 'BTC';
      case 2: return 'ETH';
      case 3: return 'SOL';
      default: return `Asset ${assetId}`;
    }
  };

  const toggleMarketSelection = (marketId: number) => {
    setSelectedMarkets(prev =>
      prev.includes(marketId)
        ? prev.filter(id => id !== marketId)
        : [...prev, marketId]
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Global State Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Global State
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{globalState?.counter || 0}</div>
              <div className="text-sm text-muted-foreground">Current Tick</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{globalState?.totalPlayers || 0}</div>
              <div className="text-sm text-muted-foreground">Total Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(globalState?.totalFunds || 0, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Protocol Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {markets.filter(m => m.status === MarketStatus.ACTIVE).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Markets</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Admin Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              Create Market Pair
            </Button>

            <Button
              onClick={() => setShowTickDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Timer className="h-4 w-4" />
              Advance Time
            </Button>

            <Button
              onClick={() => handleBulkAction('closeMarkets')}
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading || selectedMarkets.length === 0}
            >
              <Pause className="h-4 w-4" />
              Close Selected
            </Button>

            <Button
              onClick={() => handleBulkAction('resolveMarkets')}
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading || selectedMarkets.length === 0}
            >
              <CheckCircle className="h-4 w-4" />
              Resolve Selected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Market Management */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active Markets</TabsTrigger>
          <TabsTrigger value="pending">Pending Resolution</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Market Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Market Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Markets</span>
                    <span className="font-semibold">{markets.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <Badge className="bg-green-100 text-green-800">
                      {markets.filter(m => m.status === MarketStatus.ACTIVE).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {markets.filter(m => m.status === MarketStatus.PENDING).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Closed</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {markets.filter(m => m.status === MarketStatus.CLOSED).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Resolved</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {markets.filter(m => m.status === MarketStatus.RESOLVED).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {markets.slice(0, 5).map((market) => (
                    <div key={market.marketId} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", {
                          'bg-green-500': market.status === MarketStatus.ACTIVE,
                          'bg-yellow-500': market.status === MarketStatus.PENDING,
                          'bg-orange-500': market.status === MarketStatus.CLOSED,
                          'bg-blue-500': market.status === MarketStatus.RESOLVED,
                        })} />
                        <span className="text-sm">
                          {getAssetName(market.assetId)} {market.outcomeType === OutcomeType.UP ? 'UP' : 'DOWN'}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getStatusText(market.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Active Markets</h3>
              <div className="text-sm text-muted-foreground">
                {markets.filter(m => m.status === MarketStatus.ACTIVE).length} markets
              </div>
            </div>
            {markets
              .filter(m => m.status === MarketStatus.ACTIVE)
              .map((market) => (
                <Card key={market.marketId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedMarkets.includes(market.marketId)}
                          onChange={() => toggleMarketSelection(market.marketId)}
                          className="rounded"
                        />
                        <div>
                          <div className="font-medium">
                            {getAssetName(market.assetId)} {market.outcomeType === OutcomeType.UP ? 'UP' : 'DOWN'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {market.windowMinutes}min window • ID: {market.marketId}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(market.status)}>
                          {getStatusIcon(market.status)}
                          {getStatusText(market.status)}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(market.currentPrice || 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((market.progress || 0) * 100)}% complete
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pending Resolution</h3>
              <div className="text-sm text-muted-foreground">
                {markets.filter(m => m.status === MarketStatus.CLOSED).length} markets
              </div>
            </div>
            {markets
              .filter(m => m.status === MarketStatus.CLOSED)
              .map((market) => (
                <Card key={market.marketId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedMarkets.includes(market.marketId)}
                          onChange={() => toggleMarketSelection(market.marketId)}
                          className="rounded"
                        />
                        <div>
                          <div className="font-medium">
                            {getAssetName(market.assetId)} {market.outcomeType === OutcomeType.UP ? 'UP' : 'DOWN'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {market.windowMinutes}min window • ID: {market.marketId}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(market.status)}>
                          {getStatusIcon(market.status)}
                          {getStatusText(market.status)}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => onMarketAction?.('resolveMarket', { marketId: market.marketId })}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Resolved Markets</h3>
              <div className="text-sm text-muted-foreground">
                {markets.filter(m => m.status === MarketStatus.RESOLVED).length} markets
              </div>
            </div>
            {markets
              .filter(m => m.status === MarketStatus.RESOLVED)
              .map((market) => (
                <Card key={market.marketId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">
                            {getAssetName(market.assetId)} {market.outcomeType === OutcomeType.UP ? 'UP' : 'DOWN'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {market.windowMinutes}min window • ID: {market.marketId}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(market.status)}>
                          {getStatusIcon(market.status)}
                          {getStatusText(market.status)}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Winning: {market.winningOutcome === Outcome.UP ? 'UP' :
                                    market.winningOutcome === Outcome.DOWN ? 'DOWN' : 'TIE'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            End: {formatCurrency(market.oracleEndPrice || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Market Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Market Pair</DialogTitle>
            <DialogDescription>
              Create a paired UP/DOWN market for prediction trading.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="asset">Asset</Label>
              <Select
                value={creationParams.assetId.toString()}
                onValueChange={(value) => setCreationParams(prev => ({
                  ...prev,
                  assetId: parseInt(value)
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="2">Ethereum (ETH)</SelectItem>
                  <SelectItem value="3">Solana (SOL)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select
                value={creationParams.duration.toString()}
                onValueChange={(value) => setCreationParams(prev => ({
                  ...prev,
                  duration: parseInt(value)
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 minute</SelectItem>
                  <SelectItem value="3">3 minutes</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                type="datetime-local"
                value={new Date(creationParams.oracleStartTime * 1000).toISOString().slice(0, 16)}
                onChange={(e) => setCreationParams(prev => ({
                  ...prev,
                  oracleStartTime: Math.floor(new Date(e.target.value).getTime() / 1000)
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startPrice">Start Price (USD)</Label>
              <Input
                type="number"
                value={creationParams.oracleStartPrice}
                onChange={(e) => setCreationParams(prev => ({
                  ...prev,
                  oracleStartPrice: parseFloat(e.target.value) || 0
                }))}
                placeholder="Current market price"
                step="0.01"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMarketPair}
              disabled={loading || creationParams.oracleStartPrice <= 0}
            >
              {loading ? 'Creating...' : 'Create Market Pair'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tick Dialog */}
      <Dialog open={showTickDialog} onOpenChange={setShowTickDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Advance Time</DialogTitle>
            <DialogDescription>
              Move the global counter forward to simulate time progression.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tickCount">Number of Ticks</Label>
              <Input
                type="number"
                value={tickCount}
                onChange={(e) => setTickCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="100"
              />
              <div className="text-sm text-muted-foreground">
                Each tick represents 5 seconds of real time.
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="text-sm">
                <div>Current tick: {globalState?.counter || 0}</div>
                <div>New tick: {(globalState?.counter || 0) + tickCount}</div>
                <div>Time advanced: {tickCount * 5} seconds</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTickDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTick}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Advance ${tickCount} Ticks`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;