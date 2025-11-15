import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMarket } from "../contexts";
import { fromUSDCPrecision } from "../lib/calculations";

interface RecentTradesProps {
  marketId: number;
  direction?: 'UP' | 'DOWN';
}

const RecentTrades = ({ direction = 'UP' }: RecentTradesProps) => {
  const { t } = useTranslation('market');
  const { trades } = useMarket();

  // 生成假数据用于测试
  const generateMockTrades = () => {
    const mockTrades = [];
    
    for (let i = 0; i < 15; i++) {
      const isBuy = Math.random() > 0.5;
      const secondsAgo = i * 45; // 每45秒一个交易
      
      mockTrades.push({
        id: `mock-${i}`,
        side: isBuy ? 'BUY YES' : 'BUY NO',
        price: (48 + Math.random() * 4).toFixed(2), // 48-52%
        amount: (Math.random() * 500 + 50).toFixed(0), // 50-550
        time: secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`,
      });
    }
    
    return mockTrades;
  };

  // 转换真实成交数据（按 direction 过滤）
  const displayTrades = useMemo(() => {
    const directionValue = direction === 'UP' ? 1 : 0;
    
    const realTrades = trades
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
    
    // 如果没有真实数据，返回假数据
    return realTrades.length > 0 ? realTrades : generateMockTrades();
  }, [trades.length, direction]); // 只在成交数量或方向变化时更新

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-border bg-muted/30">
        <h3 className="text-xs font-semibold text-foreground">{t('recentTrades')}</h3>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background border-b border-border">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t('price')}</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('amount')}</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('timeAgo')}</th>
            </tr>
          </thead>
          <tbody>
            {displayTrades.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-muted-foreground">
                  {t('noRecentTrades')}
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
