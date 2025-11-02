import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useMarket } from "../contexts";
import { fromUSDCPrecision, parseTokenIdx, formatCurrency } from "../lib/calculations";
import { useMemo, useState, memo } from "react";
import { useToast } from "../hooks/use-toast";

interface Position {
  side: "up" | "down";
  shares: number;
  avg: string;
  now: string;
  cost: string;
  estValue: string;
  unrealizedPnL: string;
  pnlPercent: string;
}

interface OpenOrder {
  side: "up" | "down";
  type: string;
  price: string;
  shares: number;
  filled: string;
  total: string;
}

const mockPositions: Position[] = [
  {
    side: "up",
    shares: 24,
    avg: "$55",
    now: "$55",
    cost: "$100.00",
    estValue: "$100.00",
    unrealizedPnL: "+$120.00 (+41%)",
    pnlPercent: "+41%",
  },
  {
    side: "down",
    shares: 100,
    avg: "$55",
    now: "$100.00",
    cost: "$100.00",
    estValue: "$100.00",
    unrealizedPnL: "+$120.00 (+41%)",
    pnlPercent: "+41%",
  },
];

const mockOpenOrders: OpenOrder[] = [
  {
    side: "up",
    type: "Limit",
    price: "$0.65",
    shares: 100,
    filled: "0/100",
    total: "$65.00",
  },
];

const PositionTabs = () => {
  const { positions, orders, currentMarket, cancelOrder } = useMarket();
  const { toast } = useToast();

  // 转换持仓数据 - 使用稳定的依赖项避免闪烁
  const displayPositions = useMemo(() => {
    if (!currentMarket) return [];

    return positions
      .filter((p) => p.tokenIdx !== "0") // 排除 USDC
      .map((p) => {
        const tokenInfo = parseTokenIdx(parseInt(p.tokenIdx));
        if (!tokenInfo) return null;

        const shares = fromUSDCPrecision(p.balance);
        const locked = fromUSDCPrecision(p.lockBalance);

        return {
          side: tokenInfo.direction.toLowerCase() as "up" | "down",
          shares,
          avg: "$0.50", // TODO: 需要从历史计算
          now: "$0.50",
          cost: formatCurrency(shares * 0.5),
          estValue: formatCurrency(shares * 0.5),
          unrealizedPnL: "$0.00 (0%)",
          pnlPercent: "0%",
        };
      })
      .filter(Boolean) as Position[];
  }, [positions.length, currentMarket?.marketId]); // 只在持仓数量或市场ID变化时更新

  // 转换订单数据 - 使用稳定的依赖项避免闪烁
  const displayOrders = useMemo(() => {
    if (!currentMarket) return [];

    return orders
      .filter((o) => o.status === 0) // 只显示活跃订单
      .map((o) => {
        const shares = fromUSDCPrecision(o.totalAmount);
        const filled = fromUSDCPrecision(o.filledAmount);
        // 后端使用 BPS：0-10000，除以 100 得到百分比
        const pricePercent = parseInt(o.price) / 100;
        const priceDecimal = pricePercent / 100; // 转为 0-1 小数

        return {
          orderId: o.orderId,
          side: o.direction === 1 ? "up" : ("down" as "up" | "down"),
          type: o.orderType === 0 ? "Limit" : o.orderType === 1 ? "Limit" : "Market",
          price: `${pricePercent.toFixed(2)}%`, // 显示为百分比，例如 "50.00%"
          shares,
          filled: `${filled.toFixed(0)}/${shares.toFixed(0)}`,
          total: formatCurrency(shares * priceDecimal),
        };
      });
  }, [orders.length, currentMarket?.marketId]); // 只在订单数量或市场ID变化时更新

  // 处理取消订单
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      await cancelOrder(BigInt(orderId));
      toast({
        title: "Order Cancelled",
        description: "Successfully cancelled order",
      });
    } catch (error) {
      console.error("Cancel order failed:", error);
      toast({
        title: "Cancel Failed",
        description: error instanceof Error ? error.message : "Failed to cancel order",
        variant: "destructive",
      });
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="border-t border-border bg-background">
      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-background h-auto p-0">
          <TabsTrigger
            value="positions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
          >
            Position({displayPositions.length})
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
          >
            Open orders({displayOrders.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
          >
            History
          </TabsTrigger>
          <TabsTrigger
            value="claim"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
          >
            Claim
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="p-4 m-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-medium">Shares</th>
                  <th className="text-right pb-2 font-medium">Avg</th>
                  <th className="text-right pb-2 font-medium">Now</th>
                  <th className="text-right pb-2 font-medium">Cost</th>
                  <th className="text-right pb-2 font-medium">Est. Value</th>
                  <th className="text-right pb-2 font-medium">Unrealized P&L</th>
                  <th className="text-right pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayPositions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                      No positions in this market
                    </td>
                  </tr>
                ) : (
                  displayPositions.map((position, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            position.side === "up" ? "bg-success text-white" : "bg-danger text-white"
                          }`}
                        >
                          {position.side === "up" ? "Up" : `${position.shares} Down`}
                        </span>
                      </td>
                      <td className="text-right py-3">{position.avg}</td>
                      <td className="text-right py-3">{position.now}</td>
                      <td className="text-right py-3">{position.cost}</td>
                      <td className="text-right py-3">{position.estValue}</td>
                      <td className="text-right py-3 text-success font-medium">{position.unrealizedPnL}</td>
                      <td className="text-right py-3">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/70 h-8">
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

        <TabsContent value="orders" className="p-4 m-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-medium">Type</th>
                  <th className="text-right pb-2 font-medium">Price</th>
                  <th className="text-right pb-2 font-medium">Shares</th>
                  <th className="text-right pb-2 font-medium">Filled</th>
                  <th className="text-right pb-2 font-medium">Total</th>
                  <th className="text-right pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                      No open orders
                    </td>
                  </tr>
                ) : (
                  displayOrders.map((order, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              order.side === "up" ? "bg-success text-white" : "bg-danger text-white"
                            }`}
                          >
                            {order.side === "up" ? "Up" : "Down"}
                          </span>
                          <span className="text-muted-foreground">{order.type}</span>
                        </div>
                      </td>
                      <td className="text-right py-3">{order.price}</td>
                      <td className="text-right py-3">{order.shares}</td>
                      <td className="text-right py-3">{order.filled}</td>
                      <td className="text-right py-3">{order.total}</td>
                      <td className="text-right py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:text-danger/70 h-8"
                          onClick={() => handleCancelOrder(order.orderId)}
                          disabled={cancellingOrderId === order.orderId}
                        >
                          {cancellingOrderId === order.orderId ? "Cancelling..." : "Cancel"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="history" className="p-8 m-0">
          <div className="text-center text-muted-foreground">
            <p>No trading history</p>
          </div>
        </TabsContent>

        <TabsContent value="claim" className="p-4 m-0">
          <div className="bg-muted/20 p-4 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Claimable Rewards</div>
              <div className="text-xl font-bold text-foreground">$20,000.53</div>
            </div>
            <button className="bg-foreground text-background hover:bg-foreground/90 px-8 py-2 rounded font-medium">
              Claim
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PositionTabs;
