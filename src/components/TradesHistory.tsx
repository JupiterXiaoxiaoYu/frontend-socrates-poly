import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { fromUSDCPrecision, fromPricePrecision, generateMarketTitle } from "../lib/calculations";
import { Trade, Market, Order } from "../types/api";

interface TradesHistoryProps {
  trades: Trade[];
  markets: Market[];
  orders: Order[]; // User's orders to determine buy/sell
  playerId?: [string, string] | null;
}

export default function TradesHistory({ trades, markets, orders, playerId }: TradesHistoryProps) {
  // Process and enrich trades with market information
  const enrichedTrades = useMemo(() => {
    if (!trades || !playerId) return [];

    return trades.map(trade => {
      const market = markets.find(m => m.marketId === trade.marketId);
      const tradeAmount = fromUSDCPrecision(trade.amount);
      const tradePrice = parseInt(trade.price) / 100; // BPS to percent
      const tradeCost = tradeAmount * (tradePrice / 100);

      // Determine if user was buyer or seller by checking order IDs
      const userBuyOrder = orders.find(o => o.orderId === trade.buyOrderId);
      const userSellOrder = orders.find(o => o.orderId === trade.sellOrderId);
      
      const isBuyer = !!userBuyOrder;
      const isSeller = !!userSellOrder;
      
      // Determine side (market direction) and action (buy/sell)
      const side = trade.direction === 1 ? 'UP' : 'DOWN';
      let action = 'TRADE';
      
      if (isBuyer) {
        action = 'BUY';
      } else if (isSeller) {
        action = 'SELL';
      }

      // Generate market title
      let marketTitle = `Market #${trade.marketId}`;
      if (market) {
        const asset = market.assetId === "1" ? "BTC" : "ETH";
        const targetPrice = fromPricePrecision(market.oracleStartPrice);
        marketTitle = generateMarketTitle(
          asset as any,
          targetPrice,
          parseInt(market.oracleStartTime),
          market.windowMinutes
        );
      }

      return {
        id: trade.tradeId,
        timestamp: new Date(parseInt(trade.createdAt) * 1000),
        marketId: trade.marketId,
        marketTitle,
        side,
        action,
        shares: tradeAmount,
        price: tradePrice,
        cost: tradeCost,
        isBuyer,
        isSeller,
      };
    });
  }, [trades, markets, orders, playerId]);

  if (!enrichedTrades || enrichedTrades.length === 0) {
    return (
      <Card className="p-8 text-center border border-border">
        <div className="text-muted-foreground">
          <p className="text-sm">No trade history yet</p>
          <p className="text-xs mt-2">Your completed trades will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left p-3 font-medium">Time</th>
              <th className="text-left p-3 font-medium">Market</th>
              <th className="text-left p-3 font-medium">Side</th>
              <th className="text-left p-3 font-medium">Action</th>
              <th className="text-right p-3 font-medium">Shares</th>
              <th className="text-right p-3 font-medium">Price</th>
              <th className="text-right p-3 font-medium">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {enrichedTrades.map((trade) => (
              <tr
                key={trade.id}
                className="hover:bg-muted/50 transition-colors text-sm"
              >
                <td className="p-3 text-muted-foreground">
                  {trade.timestamp.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="p-3">
                  <div className="max-w-[200px] truncate" title={trade.marketTitle}>
                    {trade.marketTitle}
                  </div>
                </td>
                <td className="p-3">
                  <Badge
                    variant={trade.side === 'UP' ? 'default' : 'secondary'}
                    className={
                      trade.side === 'UP'
                        ? 'bg-success text-white hover:bg-success/90'
                        : 'bg-destructive text-white hover:bg-destructive/90'
                    }
                  >
                    {trade.side}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge
                    variant={trade.isBuyer ? 'default' : trade.isSeller ? 'secondary' : 'outline'}
                    className={
                      trade.isBuyer
                        ? 'bg-success text-white hover:bg-success/90'
                        : trade.isSeller
                        ? 'bg-destructive text-white hover:bg-destructive/90'
                        : ''
                    }
                  >
                    {trade.action}
                  </Badge>
                </td>
                <td className="p-3 text-right font-medium">
                  {trade.shares.toFixed(2)}
                </td>
                <td className="p-3 text-right">
                  {trade.price.toFixed(1)}%
                </td>
                <td className="p-3 text-right font-medium">
                  ${trade.cost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

