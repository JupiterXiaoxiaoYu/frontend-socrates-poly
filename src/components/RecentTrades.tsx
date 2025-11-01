import { TrendingUp, TrendingDown } from "lucide-react";
import { formatRelativeTime } from "@/lib/formatters";

interface Trade {
  id: string;
  price: string;
  amount: string;
  side: "BUY" | "SELL";
  timestamp: number;
}

interface RecentTradesProps {
  marketId: number;
}

const mockTrades: Trade[] = [
  { id: "1", price: "0.67", amount: "150", side: "BUY", timestamp: Date.now() - 1000 },
  { id: "2", price: "0.66", amount: "200", side: "SELL", timestamp: Date.now() - 5000 },
  { id: "3", price: "0.67", amount: "100", side: "BUY", timestamp: Date.now() - 10000 },
  { id: "4", price: "0.65", amount: "300", side: "SELL", timestamp: Date.now() - 15000 },
  { id: "5", price: "0.66", amount: "250", side: "BUY", timestamp: Date.now() - 20000 },
];

const RecentTrades = ({ marketId }: RecentTradesProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-border bg-muted/30">
        <h3 className="text-xs font-semibold text-foreground">Recent Trades</h3>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white border-b border-border">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Price</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody>
            {mockTrades.map((trade) => (
              <tr 
                key={trade.id} 
                className="border-b border-border hover:bg-muted/20 transition-colors"
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    {trade.side === "BUY" ? (
                      <TrendingUp className="w-3 h-3 text-success" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-danger" />
                    )}
                    <span className={trade.side === "BUY" ? "text-success font-medium" : "text-danger font-medium"}>
                      ${trade.price}
                    </span>
                  </div>
                </td>
                <td className="text-right px-3 py-2 text-foreground">
                  {trade.amount}
                </td>
                <td className="text-right px-3 py-2 text-muted-foreground">
                  {formatRelativeTime(trade.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentTrades;
