import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useMarket } from "../contexts";
import { fromUSDCPrecision, parseTokenIdx, formatCurrency } from "../lib/calculations";
import { useMemo, useState } from "react";
import { useToast } from "../hooks/use-toast";

interface Position {
  side: "yes" | "no";
  shares: number;
  avg: string;
  now: string;
  cost: string;
  estValue: string;
  unrealizedPnL: string;
  pnlPercent: string;
}

const PositionTabs = () => {
  const { t } = useTranslation('market');
  const { positions, orders, currentMarket, cancelOrder, playerId, trades, marketPrices } = useMarket();
  const { toast } = useToast();

  // 转换持仓数据 - 只显示当前市场的持仓

  // 转换订单数据 - 只显示用户自己的订单
  const displayOrders = useMemo(() => {
    if (!currentMarket || !playerId) return [];

    return orders
      .filter(
        (o) =>
          o.status === 0 && // 只显示活跃订单
          o.pid1 === playerId[0] &&
          o.pid2 === playerId[1] // 只显示自己的订单
      )
      .map((o) => {
        const shares = fromUSDCPrecision(o.totalAmount);
        const filled = fromUSDCPrecision(o.filledAmount);
        // 后端使用 BPS：0-10000，除以 100 得到百分比
        const pricePercent = parseInt(o.price) / 100;
        const priceDecimal = pricePercent / 100; // 转为 0-1 小数
        const action = o.orderType === 0 || o.orderType === 2 ? "Buy" : "Sell";

        return {
          orderId: o.orderId,
          side: o.direction === 1 ? "yes" : ("no" as "yes" | "no"),
          type: o.orderType === 0 ? "Limit" : o.orderType === 1 ? "Limit" : "Market",
          action,
          price: `${pricePercent.toFixed(2)}%`, // 显示为百分比，例如 "50.00%"
          shares,
          filled: `${filled.toFixed(0)}/${shares.toFixed(0)}`,
          total: formatCurrency(shares * priceDecimal),
        };
      });
  }, [orders, currentMarket?.marketId, playerId]); // 订单、市场或玩家变化时更新

  // 转换交易历史 - 只显示用户参与的成交
  const userTrades = useMemo(() => {
    if (!playerId) return [];

    // 获取用户的所有订单ID
    const userOrderIds = new Set(displayOrders.map((o) => o.orderId));

    // 同时检查已成交和已取消的订单
    const allUserOrders = orders.filter((o) => o.pid1 === playerId[0] && o.pid2 === playerId[1]);
    allUserOrders.forEach((o) => userOrderIds.add(o.orderId));

    // 过滤用户参与的成交
    return trades
      .filter((t) => userOrderIds.has(t.buyOrderId) || userOrderIds.has(t.sellOrderId))
      .slice(0, 20)
      .map((t) => {
        // 判断用户是买方还是卖方
        const isBuyer = userOrderIds.has(t.buyOrderId);

        // trade.direction 表示成交发生在哪个子市场（YES 或 NO）
        // 买方获得该方向的份额，卖方获得相反方向的份额
        const tradeDirection = t.direction === 1 ? "YES" : "NO";

        let userAction: string;
        let userDirection: string;

        // 交易发生在哪个市场就显示哪个方向
        // 不管用户是买方还是卖方，都显示成交市场的方向
        userAction = isBuyer ? "Buy" : "Sell";
        userDirection = tradeDirection; // 显示交易发生的市场方向

        const priceDecimal = parseInt(t.price) / 10000; // BPS to decimal
        const shares = fromUSDCPrecision(t.amount);
        const tradeCost = shares * priceDecimal;

        return {
          tradeId: t.tradeId,
          price: (parseInt(t.price) / 100).toFixed(2) + "%",
          amount: shares.toFixed(2),
          cost: formatCurrency(tradeCost),
          side: `${userAction} ${userDirection}`,
          action: userAction,
          direction: userDirection,
          time: new Date(t.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        };
      });
  }, [trades, playerId, orders, displayOrders]);

  // 从 userTrades 计算份额、成本和平均价格
  const positionCostMap = useMemo(() => {
    const costMap = new Map<string, { avgPrice: number; totalCost: number; totalShares: number }>();

    if (!playerId || userTrades.length === 0) return costMap;

    // 按方向聚合所有交易（买入和卖出）
    const upBuys: any[] = [];
    const upSells: any[] = [];
    const downBuys: any[] = [];
    const downSells: any[] = [];

    userTrades.forEach((trade) => {
      if (trade.direction === "YES") {
        if (trade.action === "Buy") {
          upBuys.push(trade);
        } else {
          upSells.push(trade);
        }
      } else {
        if (trade.action === "Buy") {
          downBuys.push(trade);
        } else {
          downSells.push(trade);
        }
      }
    });

    // 计算 YES 的数据
    const upBuyShares = upBuys.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const upSellShares = upSells.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const upNetShares = upBuyShares - upSellShares;

    if (upBuyShares > 0) {
      const upBuyCost = upBuys.reduce((sum, t) => {
        const price = parseFloat(t.price) / 100;
        const shares = parseFloat(t.amount);
        return sum + shares * price;
      }, 0);

      costMap.set("YES", {
        avgPrice: upBuyCost / upBuyShares,
        totalCost: upBuyCost,
        totalShares: upNetShares,
      });
    } else if (upSellShares > 0) {
      // 只有卖出
      costMap.set("YES", {
        avgPrice: 0,
        totalCost: 0,
        totalShares: -upSellShares,
      });
    }

    // 计算 NO 的数据
    // Buy NO → 获得 NO 份额
    // Sell YES → 获得 NO 份额
    const downBuyShares = downBuys.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const downFromSellUp = upSells.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const downSellShares = downSells.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const downNetShares = downBuyShares + downFromSellUp - downSellShares;

    if (downBuys.length > 0) {
      const downBuyCost = downBuys.reduce((sum, t) => {
        const priceStr = t.price.replace("%", "");
        const pricePercent = parseFloat(priceStr);
        const price = pricePercent / 100;
        const shares = parseFloat(t.amount);
        return sum + shares * price;
      }, 0);

      costMap.set("NO", {
        avgPrice: downBuyCost / downBuyShares,
        totalCost: downBuyCost,
        totalShares: downNetShares,
      });
    } else if (downFromSellUp > 0) {
      // 通过 Sell YES 获得 NO 份额
      // Sell YES @ 48% → 成本是互补价格 (1 - 0.48) = 0.52
      const downCostFromSellUp = upSells.reduce((sum, t) => {
        const priceStr = t.price.replace("%", "");
        const sellPrice = parseFloat(priceStr) / 100;
        const costPrice = 1 - sellPrice;
        const shares = parseFloat(t.amount);
        return sum + shares * costPrice;
      }, 0);

      costMap.set("NO", {
        avgPrice: downCostFromSellUp / downFromSellUp,
        totalCost: downCostFromSellUp,
        totalShares: downFromSellUp,
      });
    } else if (downSellShares > 0) {
      // 只有 Sell NO
      costMap.set("NO", {
        avgPrice: 0,
        totalCost: 0,
        totalShares: -downSellShares,
      });
    }

    return costMap;
  }, [userTrades, playerId]);

  const displayPositions = useMemo(() => {
    if (!currentMarket) return [];

    const currentMarketId = parseInt(currentMarket.marketId);

    return positions
      .filter((p) => {
        if (p.tokenIdx === "0") return false; // 排除 USDC
        const tokenInfo = parseTokenIdx(parseInt(p.tokenIdx));
        const match = tokenInfo && tokenInfo.marketId === currentMarketId;
        return match; // 只显示当前市场
      })
      .map((p) => {
        const tokenInfo = parseTokenIdx(parseInt(p.tokenIdx));
        if (!tokenInfo) return null;

        // 优先使用交易历史计算的份额，否则使用 API 的 balance
        const costInfo = positionCostMap.get(tokenInfo.direction);

        const shares = costInfo?.totalShares || fromUSDCPrecision(p.balance);
        const avgPrice = costInfo?.avgPrice || null;
        const cost = costInfo?.totalCost || 0;

        // 当前价格逻辑
        let currentPrice = 0.5; // 默认

        if (currentMarket.status === 2) {
          // 市场已 Resolved
          const isWinner =
            (currentMarket.winningOutcome === 1 && tokenInfo.direction === "YES") ||
            (currentMarket.winningOutcome === 0 && tokenInfo.direction === "NO");
          currentPrice = isWinner ? 1.0 : 0.0; // 赢家 $1，输家 $0
        } else {
          // 市场活跃，使用最新成交价
          const latestPrice = marketPrices.get(currentMarket.marketId);
          currentPrice = latestPrice ? latestPrice / 100 : 0.5;
        }

        const estValue = shares * currentPrice;
        const unrealizedPnL = estValue - cost;
        const unrealizedPnLPercent = cost > 0 ? (unrealizedPnL / cost) * 100 : 0;

        return {
          side: (tokenInfo.direction === "YES" ? "yes" : "no") as "yes" | "no",
          shares,
          avg: avgPrice ? formatCurrency(avgPrice) : "-",
          now: formatCurrency(currentPrice),
          cost: cost > 0 ? formatCurrency(cost) : "-",
          estValue: formatCurrency(estValue),
          unrealizedPnL:
            cost > 0
              ? `${unrealizedPnL >= 0 ? "+" : ""}${formatCurrency(Math.abs(unrealizedPnL))} (${
                  unrealizedPnLPercent >= 0 ? "+" : ""
                }${unrealizedPnLPercent.toFixed(1)}%)`
              : "-",
          pnlPercent: `${unrealizedPnLPercent >= 0 ? "+" : ""}${unrealizedPnLPercent.toFixed(1)}%`,
        };
      })
      .filter(Boolean) as Position[];
  }, [positions.length, currentMarket?.marketId, positionCostMap, marketPrices]);

  // 处理取消订单
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      await cancelOrder(BigInt(orderId));
      toast({
        title: t('orderCancelled'),
        description: t('orderCancelledDesc'),
      });
    } catch (error) {
      toast({
        title: t('cancelFailed'),
        description: error instanceof Error ? error.message : t('cancelFailedDesc'),
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
            {t('position')}({displayPositions.length})
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
          >
            {t('openOrders')}({displayOrders.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
          >
            {t('history')}
          </TabsTrigger>
          <TabsTrigger
            value="claimed"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
          >
            Claimed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="p-4 m-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-medium">{t('side')}</th>
                  <th className="text-right pb-2 font-medium">{t('shares')}</th>
                  <th className="text-right pb-2 font-medium">{t('avg')}</th>
                  <th className="text-right pb-2 font-medium">{t('now')}</th>
                  <th className="text-right pb-2 font-medium">{t('cost')}</th>
                  <th className="text-right pb-2 font-medium">{t('estValue')}</th>
                  <th className="text-right pb-2 font-medium">{t('pnl')}</th>
                </tr>
              </thead>
              <tbody>
                {displayPositions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <img 
                          src="/favicon.png" 
                          alt="No positions" 
                          className="w-16 h-16 opacity-30"
                        />
                        <p className="text-muted-foreground text-sm">{t('noPositionsInMarket')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayPositions.map((position, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            position.side === "yes" ? "bg-success text-white" : "bg-danger text-white"
                          }`}
                        >
                          {position.side === "yes" ? "YES" : "NO"}
                        </span>
                      </td>
                      <td className="text-right py-3 font-semibold">{position.shares.toFixed(2)}</td>
                      <td className="text-right py-3">{position.avg}</td>
                      <td className="text-right py-3">{position.now}</td>
                      <td className="text-right py-3">{position.cost}</td>
                      <td className="text-right py-3">{position.estValue}</td>
                      <td
                        className={`text-right py-3 font-medium ${
                          position.unrealizedPnL.startsWith("+")
                            ? "text-success"
                            : position.unrealizedPnL.startsWith("-")
                            ? "text-danger"
                            : "text-muted-foreground"
                        }`}
                      >
                        {position.unrealizedPnL}
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
                  <th className="text-left pb-2 font-medium">{t('side')}</th>
                  <th className="text-right pb-2 font-medium">{t('price')}</th>
                  <th className="text-right pb-2 font-medium">{t('shares')}</th>
                  <th className="text-right pb-2 font-medium">{t('filled')}</th>
                  <th className="text-right pb-2 font-medium">{t('totalCost')}</th>
                  <th className="text-right pb-2 font-medium">{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {displayOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <img 
                          src="/favicon.png" 
                          alt="No orders" 
                          className="w-16 h-16 opacity-30"
                        />
                        <p className="text-muted-foreground text-sm">{t('noOpenOrders')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayOrders.map((order, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={order.action === "Buy" ? "default" : "secondary"}>{order.action}</Badge>
                          <Badge
                            className={
                              order.side === "yes"
                                ? "bg-success text-success-foreground border-transparent"
                                : "bg-danger text-danger-foreground border-transparent"
                            }
                          >
                            {order.side === "yes" ? "YES" : "NO"}
                          </Badge>
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
                          {cancellingOrderId === order.orderId ? t('cancelling') : t('cancel')}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="history" className="p-4 m-0">
          {userTrades.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <img 
                src="/favicon.png" 
                alt="No history" 
                className="w-16 h-16 opacity-30"
              />
              <p className="text-muted-foreground text-sm">{t('noTradingHistory')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left pb-2 font-medium">{t('side')}</th>
                    <th className="text-right pb-2 font-medium">{t('price')}</th>
                    <th className="text-right pb-2 font-medium">{t('amount')}</th>
                    <th className="text-right pb-2 font-medium">{t('cost')}</th>
                    <th className="text-right pb-2 font-medium">{t('timeAgo')}</th>
                  </tr>
                </thead>
                <tbody>
                  {userTrades.map((trade) => (
                    <tr key={trade.tradeId} className="border-b border-border">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={trade.action === "Buy" ? "default" : "secondary"}>{trade.action}</Badge>
                          <Badge
                            className={
                              trade.direction === "YES"
                                ? "bg-success text-success-foreground border-transparent"
                                : "bg-danger text-danger-foreground border-transparent"
                            }
                          >
                            {trade.direction}
                          </Badge>
                        </div>
                      </td>
                      <td className="text-right py-3">{trade.price}</td>
                      <td className="text-right py-3">{trade.amount}</td>
                      <td className="text-right py-3 font-semibold">{trade.cost}</td>
                      <td className="text-right py-3 text-muted-foreground text-xs">{trade.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="claimed" className="p-4 m-0">
          <div className="flex flex-col items-center gap-3 py-12">
            <img 
              src="/favicon.png" 
              alt="No claimed" 
              className="w-16 h-16 opacity-30"
            />
            <p className="text-muted-foreground text-sm">
              No claimed positions yet
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PositionTabs;
