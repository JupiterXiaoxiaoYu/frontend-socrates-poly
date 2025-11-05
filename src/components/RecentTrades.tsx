import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMarket } from "../contexts";
import { fromUSDCPrecision } from "../lib/calculations";

interface RecentTradesProps {
  marketId: number;
  direction?: 'UP' | 'DOWN';  // 内部仍使用UP/DOWN以兼容后端
}

const RecentTrades = ({ marketId, direction = 'UP' }: RecentTradesProps) => {
  const { trades } = useMarket();

  // 转换真实成交数据（按 direction 过滤）
  const displayTrades = useMemo(() => {
    const directionValue = direction === 'UP' ? 1 : 0;
    
    return trades
      .filter(t => t.direction === directionValue) // 只显示当前方向的成交
      .slice(0, 20) // 最近 20 条
      .map(t => {
        const price = (parseInt(t.price) / 100).toFixed(2); // BPS to percent
        const amount = fromUSDCPrecision(t.amount).toFixed(0);
        
        // 计算时间
        const tradeTime = new Date(t.createdAt);
        const now = new Date();
        const secondsAgo = Math.floor((now.getTime() - tradeTime.getTime()) / 1000);
        
        let timeAgo = '';
        if (secondsAgo < 60) {
          timeAgo = `${secondsAgo}s ago`;
        } else if (secondsAgo < 3600) {
          timeAgo = `${Math.floor(secondsAgo / 60)}m ago`;
        } else {
          timeAgo = `${Math.floor(secondsAgo / 3600)}h ago`;
        }

        return {
          id: t.tradeId,
          side: t.direction === 1 ? 'BUY YES' : 'BUY NO',
          price,
          amount,
          time: timeAgo,
        };
      });
  }, [trades.length, direction]); // 只在成交数量或方向变化时更新

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-border bg-muted/30">
        <h3 className="text-xs font-semibold text-foreground">Recent Trades</h3>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background border-b border-border">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Price</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody>
            {displayTrades.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-muted-foreground">
                  No recent trades
                </td>
              </tr>
            ) : (
              displayTrades.map((trade) => (
                <tr key={trade.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {trade.side.includes('YES') ? (
                        <TrendingUp className="w-3 h-3 text-success" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-danger" />
                      )}
                      <span className={`font-medium font-mono ${
                        trade.side.includes('YES') ? 'text-success' : 'text-danger'
                      }`}>
                        {trade.price}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-foreground font-mono">
                    {trade.amount}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {trade.time}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentTrades;
