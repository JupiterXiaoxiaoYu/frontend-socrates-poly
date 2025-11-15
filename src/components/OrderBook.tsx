import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useMarket } from "../contexts";

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface OrderBookProps {
  marketId: string | number;
  direction?: "UP" | "DOWN" | "YES" | "NO";
}

// 生成假数据用于测试
const generateMockOrders = (isAsk: boolean, basePrice: number = 50): OrderBookEntry[] => {
  const orders: OrderBookEntry[] = [];
  let cumulative = 0;
  
  for (let i = 0; i < 10; i++) {
    const priceOffset = isAsk ? i * 0.5 : -i * 0.5;
    const price = basePrice + priceOffset;
    const amount = Math.random() * 1000 + 100;
    cumulative += amount;
    
    orders.push({
      price,
      amount,
      total: cumulative,
    });
  }
  
  return orders;
};

const OrderBook = ({ marketId, direction = "UP" }: OrderBookProps) => {
  const { t } = useTranslation("market");
  const { orderBooks } = useMarket();

  // 从订单簿数据构建显示数据
  const { bids, asks } = useMemo(() => {
    // 转换 direction 为 YES/NO 格式
    const yesNoDirection = direction === "UP" || direction === "YES" ? "YES" : "NO";

    // 获取订单簿数据
    const orderBookKey = `${marketId}-${yesNoDirection}`;
    const orderBook = orderBooks.get(orderBookKey);

    // 如果没有真实数据，使用假数据
    if (!orderBook || (!orderBook.bids.length && !orderBook.asks.length)) {
      return {
        bids: generateMockOrders(false, 50),
        asks: generateMockOrders(true, 50),
      };
    }

    // 转换为 OrderBookEntry 格式并计算累计量
    const convertToEntries = (orders: Array<{ price: string; quantity: string }>): OrderBookEntry[] => {
      let cumulative = 0;
      return orders.map((order) => {
        const price = parseFloat(order.price) * 100;
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
    1
  );

  const renderOrder = (order: OrderBookEntry, isAsk: boolean) => {
    const percentage = (order.total / maxTotal) * 100;

    return (
      <div
        key={`${order.price}-${order.amount}`}
        className="relative grid grid-cols-3 gap-2 py-1.5 px-3 text-sm font-mono hover:bg-muted/50 transition-colors overflow-hidden"
      >
        {/* Buy orders (Bids): bar 从右往左 */}
        {/* Sell orders (Asks): bar 从左往右 */}
        <div
          className={cn("absolute top-0 bottom-0 opacity-20", isAsk ? "bg-danger" : "bg-success")}
          style={
            isAsk
              ? { width: `${percentage}%`, left: 0 }  // Asks: 从左边开始
              : { width: `${percentage}%`, right: 0 } // Bids: 从右边开始
          }
        />
        <div className={cn("relative z-10", isAsk ? "text-danger" : "text-success")}>
          {order.price.toFixed(1)}%
        </div>
        <div className="relative z-10 text-right">
          {order.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </div>
        <div className="relative z-10 text-right text-muted-foreground">
          {order.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* 左右布局 */}
      <div className="grid grid-cols-2 gap-4 p-4 h-full">
        {/* 左侧：Bids (Buy orders) */}
        <div className="flex flex-col border-r border-border pr-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-success mb-2">Buy Orders (Bids)</h3>
            <div className="grid grid-cols-3 gap-2 px-3 pb-2 text-xs font-semibold text-muted-foreground border-b border-border">
              <div>{t('price')}</div>
              <div className="text-right">{t('amount')}</div>
              <div className="text-right">{t('total')}</div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            {bids.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No buy orders
              </div>
            ) : (
              <div className="space-y-0.5">
                {bids.map((bid) => renderOrder(bid, false))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：Asks (Sell orders) */}
        <div className="flex flex-col pl-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-danger mb-2">Sell Orders (Asks)</h3>
            <div className="grid grid-cols-3 gap-2 px-3 pb-2 text-xs font-semibold text-muted-foreground border-b border-border">
              <div>{t('price')}</div>
              <div className="text-right">{t('amount')}</div>
              <div className="text-right">{t('total')}</div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            {asks.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No sell orders
              </div>
            ) : (
              <div className="space-y-0.5">
                {asks.map((ask) => renderOrder(ask, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
