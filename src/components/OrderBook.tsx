import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMarket } from "../contexts";
import { fromUSDCPrecision } from "../lib/calculations";

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface OrderBookProps {
  marketId: number;
}

const OrderBook = ({ marketId }: OrderBookProps) => {
  const { orders } = useMarket();

  // 从真实订单构建订单簿
  const { bids, asks } = useMemo(() => {
    const activeOrders = orders.filter(o => o.status === 0);
    
    // 买单（按价格降序）
    const buyOrders = activeOrders
      .filter(o => o.orderType === 0 || o.orderType === 2)
      .sort((a, b) => parseInt(b.price) - parseInt(a.price));
    
    // 卖单（按价格升序）
    const sellOrders = activeOrders
      .filter(o => o.orderType === 1 || o.orderType === 3)
      .sort((a, b) => parseInt(a.price) - parseInt(b.price));

    // 聚合相同价格的订单
    const aggregateOrders = (orderList: any[]): OrderBookEntry[] => {
      const priceMap = new Map<number, number>();
      
      orderList.forEach(order => {
        const price = parseInt(order.price) / 100; // BPS to percent
        const remaining = fromUSDCPrecision(order.totalAmount) - fromUSDCPrecision(order.filledAmount);
        
        priceMap.set(price, (priceMap.get(price) || 0) + remaining);
      });

      let cumulative = 0;
      return Array.from(priceMap.entries()).map(([price, amount]) => {
        cumulative += amount;
        return { price, amount, total: cumulative };
      });
    };

    return {
      bids: aggregateOrders(buyOrders).slice(0, 10),
      asks: aggregateOrders(sellOrders).slice(0, 10),
    };
  }, [orders]);

  const maxTotal = Math.max(...bids.map((b) => b.total), ...asks.map((a) => a.total));

  const renderOrder = (order: OrderBookEntry, isAsk: boolean) => {
    const percentage = (order.total / maxTotal) * 100;

    return (
      <div
        key={`${order.price}-${order.amount}`}
        className="relative grid grid-cols-3 gap-2 py-1 px-2 text-sm font-mono hover:bg-muted/50 transition-colors"
      >
        <div
          className={cn("absolute inset-0 opacity-20", isAsk ? "bg-danger" : "bg-success")}
          style={{ width: `${percentage}%` }}
        />
        <div className={cn("relative", isAsk ? "text-danger" : "text-success")}>{order.price.toFixed(1)}%</div>
        <div className="relative text-right">{order.amount.toLocaleString()}</div>
        <div className="relative text-right text-muted-foreground">{order.total.toLocaleString()}</div>
      </div>
    );
  };

  return (
    <Card className="p-4 border border-border bg-card">
      <div className="space-y-3">
        {/* Headers */}
        <div className="grid grid-cols-3 gap-2 px-2 pb-2 text-xs font-semibold text-muted-foreground border-b border-border">
          <div>Price</div>
          <div className="text-right">Amount</div>
          <div className="text-right">Total</div>
        </div>

        {/* Asks (Sell orders) */}
        <div className="space-y-0.5">
          {asks
            .slice()
            .reverse()
            .map((order) => renderOrder(order, true))}
        </div>

        {/* Spread */}
        <div className="py-2 px-2 bg-muted rounded-lg text-center">
          <div className="text-xs text-muted-foreground mb-1">Spread</div>
          <div className="text-base font-bold text-foreground">{(asks[0]?.price - bids[0]?.price).toFixed(1)}%</div>
        </div>

        {/* Bids (Buy orders) */}
        <div className="space-y-0.5">{bids.map((order) => renderOrder(order, false))}</div>
      </div>
    </Card>
  );
};

export default OrderBook;
