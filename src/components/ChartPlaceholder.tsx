import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface ChartPlaceholderProps {
  targetPrice: number;
  currentPrice: number;
}

const ChartPlaceholder = ({ targetPrice, currentPrice }: ChartPlaceholderProps) => {
  const isUp = currentPrice > targetPrice;
  const percentChange = ((currentPrice - targetPrice) / targetPrice * 100).toFixed(2);

  return (
    <Card className="p-6 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Current Price</div>
          <div className="text-3xl font-bold">${currentPrice.toLocaleString()}</div>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          isUp ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        )}>
          <TrendingUp className={cn("w-5 h-5", !isUp && "rotate-180")} />
          <span className="text-lg font-bold">{percentChange}%</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/30">
        <div className="text-center space-y-2">
          <div className="text-4xl">📊</div>
          <div className="text-sm text-muted-foreground">
            Price chart will display here
          </div>
          <div className="text-xs text-muted-foreground">
            Target: ${targetPrice.toLocaleString()}
          </div>
        </div>
      </div>
    </Card>
  );
};

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default ChartPlaceholder;
