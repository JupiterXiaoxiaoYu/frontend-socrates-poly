import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercent, formatDate } from '@/lib/formatters';
import { calculateUnrealizedPnL } from '@/lib/calculations';

interface PositionCardProps {
  marketTitle: string;
  side: 'up' | 'down';
  shares: number;
  avgPrice: number;
  currentPrice: number;
  cost: number;
  timestamp: number;
  onSell?: () => void;
  onClaim?: () => void;
  canClaim?: boolean;
  realtime?: boolean;
}

const PositionCard = ({
  marketTitle,
  side,
  shares,
  avgPrice,
  currentPrice,
  cost,
  timestamp,
  onSell,
  onClaim,
  canClaim = false,
}: PositionCardProps) => {
  const { pnl, pnlPercent } = calculateUnrealizedPnL(shares, avgPrice, currentPrice);
  const estValue = cost + pnl;
  const isProfit = pnl > 0;

  return (
    <Card className="p-4 hover:shadow-lg transition-all">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium line-clamp-1">{marketTitle}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-semibold',
                  side === 'up'
                    ? 'bg-success/20 text-success'
                    : 'bg-danger/20 text-danger'
                )}
              >
                {side.toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(timestamp)}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground text-xs mb-1">Shares</div>
            <div className="font-semibold">{shares.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs mb-1">Avg Price</div>
            <div className="font-semibold">{formatCurrency(avgPrice / 10000)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs mb-1">Cost</div>
            <div className="font-semibold">{formatCurrency(cost)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs mb-1">Est. Value</div>
            <div className="font-semibold">{formatCurrency(estValue)}</div>
          </div>
        </div>

        {/* P&L Display */}
        <div
          className={cn(
            'p-3 rounded-lg border',
            isProfit
              ? 'bg-success/5 border-success/20'
              : 'bg-danger/5 border-danger/20'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Unrealized P&L</div>
            <div
              className={cn(
                'flex items-center gap-1 text-lg font-bold',
                isProfit ? 'text-success' : 'text-danger'
              )}
            >
              {isProfit ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {formatCurrency(Math.abs(pnl))} ({formatPercent(Math.abs(pnlPercent))})
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {canClaim && onClaim ? (
            <Button onClick={onClaim} className="flex-1 gradient-primary">
              Claim Winnings
            </Button>
          ) : onSell ? (
            <Button onClick={onSell} variant="outline" className="flex-1">
              Sell Position
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
};

export default PositionCard;
