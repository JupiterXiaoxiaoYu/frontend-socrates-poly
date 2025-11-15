import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMarket } from "../contexts";

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface OrderBookProps {
  marketId: string | number;
  direction?: "UP" | "DOWN" | "YES" | "NO"; // 支持多种格式
}

const OrderBook = ({ marketId, direction = "UP" }: OrderBookProps) => {
  const { t } = useTranslation('market');
  const { orderBooks } = useMarket();

  // 从订单簿数据构建显示数据
  const { bids, asks } = useMemo(() => {
    // 转换 direction 为 YES/NO 格式
    const yesNoDirection = direction === "UP" || direction === "YES" ? "YES" : "NO";
    
    // 获取订单簿数据
    const orderBookKey = `${marketId}-${yesNoDirection}`;
    const orderBook = orderBooks.get(orderBookKey);

    if (!orderBook || (!orderBook.bids.length && !orderBook.asks.length)) {
      return { bids: [], asks: [] };
    }

    // 转换为 OrderBookEntry 格式并计算累计量
    const convertToEntries = (orders: Array<{ price: string; quantity: string }>): OrderBookEntry[] => {
      let cumulative = 0;
      return orders.map((order) => {
        const price = parseFloat(order.price) * 100; // 转为百分比 (0.5 -> 50)
        const amount = parseFloat(order.quantity);
        cumulative += amount;
        return { price, amount, total: cumulative };
      });
    };

    return {
      bids: convertToEntries(orderBook.bids).slice(0, 10),
      asks: convertToEntries(orderBook.asks).slice(0, 10),
    };
  }, [orderBooks, marketId, direction]);

  const maxTotal = Math.max(
    ...bids.map((b) => b.total),
    ...asks.map((a) => a.total),
    1 // 避免除以0
  );

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
        <div className="relative text-right">
          {order.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="relative text-right text-muted-foreground">{order.total.toLocaleString()}</div>
      </div>
    );
  };

  // 空状态检查
  const isEmpty = bids.length === 0 && asks.length === 0;

  return (
    <Card className="p-4 border border-border bg-card">
      <div className="space-y-3">
        {/* Headers */}
        <div className="grid grid-cols-3 gap-2 px-2 pb-2 text-xs font-semibold text-muted-foreground border-b border-border">
          <div>{t('price')}</div>
          <div className="text-right">{t('amount')}</div>
          <div className="text-right">{t('total')}</div>
        </div>

        {isEmpty ? (
          /* 空状态 */
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">No orders in the book</p>
            <p className="text-xs mt-1">Be the first to place an order!</p>
          </div>
        ) : (
          <>
            {/* Asks (Sell orders) */}
            <div className="space-y-0.5">
              {asks.length > 0 ? (
                asks
                  .slice()
                  .reverse()
                  .map((order) => renderOrder(order, true))
              ) : (
                <div className="py-2 text-center text-xs text-muted-foreground">No sell orders</div>
              )}
            </div>

            {/* Spread */}
            {asks.length > 0 && bids.length > 0 && (
              <div className="py-2 px-2 bg-muted rounded-lg text-center">
                <div className="text-xs text-muted-foreground mb-1">{t('spread')}</div>
                <div className="text-base font-bold text-foreground">
                  {(asks[0]?.price - bids[0]?.price).toFixed(1)}%
                </div>
              </div>
            )}

            {/* Bids (Buy orders) */}
            <div className="space-y-0.5">
              {bids.length > 0 ? (
                bids.map((order) => renderOrder(order, false))
              ) : (
                <div className="py-2 text-center text-xs text-muted-foreground">No buy orders</div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default OrderBook;
