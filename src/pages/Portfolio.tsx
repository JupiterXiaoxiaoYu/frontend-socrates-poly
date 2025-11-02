import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PortfolioPnLChart from "@/components/PortfolioPnLChart";
import { useMarket } from "../contexts";
import { fromUSDCPrecision, parseTokenIdx, formatCurrency, generateMarketTitle, fromPricePrecision } from "../lib/calculations";
import { MarketStatus } from "../types/api";
import { useToast } from "../hooks/use-toast";

const Portfolio = () => {
  const navigate = useNavigate();
  const { positions = [], markets = [], userAllOrders = [], cancelOrder } = useMarket();
  const { toast } = useToast();
  const [timePeriod, setTimePeriod] = useState("1D");
  const [positionFilter, setPositionFilter] = useState("All");
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // 计算 USDC 余额
  const usdcBalance = useMemo(() => {
    const usdcPosition = positions.find(p => p.tokenIdx === '0');
    return usdcPosition ? fromUSDCPrecision(usdcPosition.balance) : 0;
  }, [positions]);

  // 转换持仓数据
  const displayPositions = useMemo(() => {
    return positions
      .filter(p => p.tokenIdx !== '0') // 排除 USDC
      .map(p => {
        const tokenInfo = parseTokenIdx(parseInt(p.tokenIdx));
        if (!tokenInfo) return null;
        
        const shares = fromUSDCPrecision(p.balance);
        const marketId = tokenInfo.marketId;
        const market = markets.find(m => m.marketId === marketId.toString());
        
        // 生成市场标题
        let marketTitle = `Market #${marketId}`;
        if (market) {
          const asset = market.assetId === '1' ? 'BTC' : 'ETH';
          const targetPrice = fromPricePrecision(market.oracleStartPrice);
          marketTitle = generateMarketTitle(asset as any, targetPrice, parseInt(market.oracleStartTime), market.windowMinutes);
        }
        
        return {
          id: p.tokenIdx,
          marketId,
          market: marketTitle,
          side: tokenInfo.direction,
          shares,
          avg: 50, // TODO: 从历史计算
          now: 50,
          cost: formatCurrency(shares * 0.5),
          estValue: formatCurrency(shares * 0.5),
          unrealizedPnL: "$0.00 (0%)",
          isResolved: market?.status === MarketStatus.Resolved,
          canClaim: market?.status === MarketStatus.Resolved && 
                   ((market.winningOutcome === 1 && tokenInfo.direction === 'UP') ||
                    (market.winningOutcome === 0 && tokenInfo.direction === 'DOWN')),
        };
      })
      .filter(Boolean);
  }, [positions.length, markets.length]); // 只在数量变化时更新

  // 计算活跃订单（用户的所有订单）
  const activeOrders = useMemo(() => {
    return (userAllOrders || []).filter(o => o.status === 0);
  }, [userAllOrders?.length]); // 只在订单数量变化时更新

  // 计算可 Claim 金额
  const claimableAmount = useMemo(() => {
    return displayPositions
      .filter((p: any) => p.canClaim)
      .reduce((sum: number, p: any) => sum + p.shares, 0);
  }, [displayPositions]);

  // 处理取消订单
  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      await cancelOrder(BigInt(orderId));
      toast({
        title: 'Order Cancelled',
        description: 'Successfully cancelled order',
      });
    } catch (error) {
      console.error('Cancel order failed:', error);
      toast({
        title: 'Cancel Failed',
        description: error instanceof Error ? error.message : 'Failed to cancel order',
        variant: 'destructive',
      });
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Portfolio</h1>
        
        {/* Web3 wallet status */}
        <div className="mb-4">
          <a href="#" className="text-sm text-primary hover:underline">Web3 wallet</a>
          <span className="text-sm text-muted-foreground ml-1">in use</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left: Stats and Claim */}
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Cash (USDC)</div>
                <div className="text-3xl font-bold text-foreground">{formatCurrency(usdcBalance)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Positions</div>
                <div className="text-3xl font-bold text-foreground">{displayPositions.length}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Active Orders</div>
                <div className="text-3xl font-bold text-foreground">{activeOrders.length}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">To Claim</div>
                <div className="text-3xl font-bold text-success">{formatCurrency(claimableAmount)}</div>
              </div>
            </div>

            {/* Claim Section */}
            {claimableAmount > 0 && (
              <Card className="p-4 border border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="text-base font-medium text-foreground">
                    {formatCurrency(claimableAmount)} to Claim
                  </div>
                  <Button
                    className="bg-foreground text-background hover:bg-foreground/90"
                    onClick={() => navigate('/rewards')}
                  >
                    Claim
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Right: Chart */}
          <Card className="p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-foreground">Realized P&L</div>
              <div className="flex gap-2">
                {["1D", "1W", "1M", "All"].map((period) => (
                  <Button
                    key={period}
                    variant={timePeriod === period ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTimePeriod(period)}
                    className="h-7 px-3 text-xs"
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
            <div className="h-40">
              <PortfolioPnLChart />
            </div>
          </Card>
        </div>

        {/* Positions Table */}
        <Card className="border border-border">
          {/* Tabs */}
          <Tabs defaultValue="positions" className="w-full">
            <div className="border-b border-border">
              <div className="px-4">
                <TabsList className="bg-transparent border-0 h-auto p-0">
                  <TabsTrigger 
                    value="positions" 
                    className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
                  >
                    Positions({displayPositions.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="orders" 
                    className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
                  >
                    Open Orders({activeOrders.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
                  >
                    History
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="px-4 py-3 border-b border-border flex gap-2">
              {["All", "UP", "DOWN"].map((filter) => (
                <Button
                  key={filter}
                  variant={positionFilter === filter ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPositionFilter(filter)}
                  className="h-8 px-4"
                >
                  {filter}
                </Button>
              ))}
            </div>

            {/* Positions Tab */}
            <TabsContent value="positions" className="m-0">
              <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Market</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Shares</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Avg</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Now</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Cost</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Est.Value</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Unrealized P&L</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayPositions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No positions yet
                    </td>
                  </tr>
                ) : (
                  (displayPositions as any[]).map((position) => (
                  <tr key={position.id} className="border-b border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{position.market}</span>
                        <Badge variant="default" className="bg-success text-white text-xs">
                          {position.side}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {position.shares} ¢
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {position.avg} ¢
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {position.now} ¢
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {position.cost}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {position.estValue}
                    </td>
                    <td className="px-4 py-3 text-sm text-success">
                      {position.unrealizedPnL}
                    </td>
                    <td className="px-4 py-3">
                      <Button 
                        variant="link" 
                        className="text-primary h-auto p-0 text-sm"
                      >
                        Sell
                      </Button>
                    </td>
                </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="m-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Market</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Side</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Shares</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Filled</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Action</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No open orders
                    </td>
                  </tr>
                ) : (
                  activeOrders.map((order: any) => (
                    <tr key={order.orderId} className="border-b border-border hover:bg-muted/20">
                      <td className="px-4 py-3 text-sm">
                        Market #{Math.floor(parseInt(order.marketId))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={order.direction === 1 ? "default" : "secondary"}>
                          {order.direction === 1 ? 'UP' : 'DOWN'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {order.orderType === 0 ? 'Limit Buy' : 
                         order.orderType === 1 ? 'Limit Sell' :
                         order.orderType === 2 ? 'Market Buy' : 'Market Sell'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(parseInt(order.price) / 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {fromUSDCPrecision(order.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {fromUSDCPrecision(order.filledAmount).toFixed(0)}/{fromUSDCPrecision(order.totalAmount).toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:text-danger/70 h-8"
                          onClick={() => handleCancelOrder(order.orderId)}
                          disabled={cancellingOrderId === order.orderId}
                        >
                          {cancellingOrderId === order.orderId ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-primary h-auto p-0 text-sm"
                          onClick={() => navigate(`/market/${order.marketId}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="m-0 p-8 text-center text-muted-foreground">
          No trading history
        </TabsContent>
      </Tabs>
    </Card>
      </main>
    </div>
  );
};

export default Portfolio;
