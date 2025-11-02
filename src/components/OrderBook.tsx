import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface OrderBookProps {
  marketId: number;
}

const OrderBook = ({ marketId }: OrderBookProps) => {
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);

  // Generate initial order book data
  useEffect(() => {
    const generateOrders = (basePrice: number, isBid: boolean): OrderBookEntry[] => {
      const orders: OrderBookEntry[] = [];
      let totalAmount = 0;

      for (let i = 0; i < 10; i++) {
        const priceOffset = (i + 1) * 0.5;
        const price = isBid ? basePrice - priceOffset : basePrice + priceOffset;
        const amount = Math.floor(Math.random() * 5000) + 1000;
        totalAmount += amount;

        orders.push({
          price: parseFloat(price.toFixed(1)),
          amount,
          total: totalAmount,
        });
      }

      return orders;
    };

    const basePrice = 50; // 50% probability
    setBids(generateOrders(basePrice, true));
    setAsks(generateOrders(basePrice, false));

    // Update order book randomly
    const interval = setInterval(() => {
      setBids((prev) => {
        const newBids = [...prev];
        const randomIndex = Math.floor(Math.random() * newBids.length);
        const change = (Math.random() - 0.5) * 1000;
        newBids[randomIndex].amount = Math.max(100, newBids[randomIndex].amount + change);

        // Recalculate totals
        let total = 0;
        return newBids.map((order) => {
          total += order.amount;
          return { ...order, total };
        });
      });

      setAsks((prev) => {
        const newAsks = [...prev];
        const randomIndex = Math.floor(Math.random() * newAsks.length);
        const change = (Math.random() - 0.5) * 1000;
        newAsks[randomIndex].amount = Math.max(100, newAsks[randomIndex].amount + change);

        // Recalculate totals
        let total = 0;
        return newAsks.map((order) => {
          total += order.amount;
          return { ...order, total };
        });
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [marketId]);

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
