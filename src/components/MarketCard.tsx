import { Card } from "@/components/ui/card";
import StatusBadge from "./StatusBadge";
import CountdownTimer from "./CountdownTimer";
import { TrendingUp, TrendingDown, Users, DollarSign, ArrowUpDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatCompactNumber, formatPercent } from "@/lib/formatters";
import { Market, MarketStatus, OutcomeType } from "@/types/market";

interface MarketCardProps {
  market: Market;
  pairedMarket?: Market;
  onClick: () => void;
  showPairedMarket?: boolean;
}

const MarketCard = ({
  market,
  pairedMarket,
  onClick,
  showPairedMarket = true,
}: MarketCardProps) => {
  const isUp = market.outcomeType === OutcomeType.UP;
  const borderColor = market.status === MarketStatus.ACTIVE
    ? (isUp ? 'border-l-success' : 'border-l-danger')
    : 'border-l-border';

  // Calculate price change
  const priceChange = market.priceChange || 0;
  const priceChangePercent = market.priceChangePercent || 0;

  // Get current tick for countdown
  const getCurrentTick = () => Math.floor(Date.now() / 5000);

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 border-l-4",
        borderColor,
        market.status === MarketStatus.ACTIVE && 'animate-breathing'
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">
              {market.title || `${market.assetId === 1 ? 'BTC' : market.assetId === 2 ? 'ETH' : 'SOL'} ${isUp ? 'UP' : 'DOWN'} (${market.windowMinutes}min)`}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <CountdownTimer
                targetTick={market.endTick}
                currentTick={getCurrentTick()}
                format="compact"
                className="text-xs"
              />
              {market.pairedMarketId && showPairedMarket && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Paired
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={market.status} size="sm" />
        </div>

        {/* Price Display */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Oracle Price</div>
            <div className="text-lg font-bold">
              {formatCurrency(market.currentPrice || 0, 0)}
            </div>
            {priceChange !== 0 && (
              <div className={cn(
                "text-xs flex items-center gap-1",
                priceChange > 0 ? "text-success" : "text-danger"
              )}>
                {priceChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {formatPercent(priceChangePercent / 100, 1)}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Direction</div>
            <div className={cn(
              "text-lg font-bold flex items-center gap-1 justify-end",
              isUp ? "text-up" : "text-down"
            )}>
              {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isUp ? 'UP' : 'DOWN'}
            </div>
          </div>
        </div>

        {/* Market Progress */}
        {market.status === MarketStatus.ACTIVE && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round((market.progress || 0) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  isUp ? "bg-success" : "bg-danger"
                )}
                style={{ width: `${(market.progress || 0) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Up/Down Chances */}
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg bg-success/10 border border-success/20 p-2">
            <div className="text-[10px] text-success-light mb-1">UP</div>
            <div className="text-lg font-bold text-success">
              {Math.round((market.yesChance || 0) * 100)}%
            </div>
          </div>
          <div className="flex-1 rounded-lg bg-danger/10 border border-danger/20 p-2">
            <div className="text-[10px] text-danger-light mb-1">DOWN</div>
            <div className="text-lg font-bold text-danger">
              {Math.round((market.noChance || 0) * 100)}%
            </div>
          </div>
        </div>

        {/* Market Resolution */}
        {market.status === MarketStatus.RESOLVED && market.winningOutcome !== undefined && (
          <div className={cn(
            "p-2 rounded-lg border text-center",
            market.winningOutcome === (isUp ? Outcome.UP : Outcome.DOWN)
              ? "bg-success/10 border-success/20 text-success"
              : "bg-danger/10 border-danger/20 text-danger"
          )}>
            <div className="text-xs font-semibold">
              {market.winningOutcome === (isUp ? Outcome.UP : Outcome.DOWN) ? '✓ WON' : '✗ LOST'}
            </div>
          </div>
        )}

        {/* Paired Market Preview */}
        {pairedMarket && showPairedMarket && (
          <div className="border-t border-border pt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <ArrowUpDown className="w-3 h-3" />
              <span>Paired Market</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">
                {pairedMarket.outcomeType === OutcomeType.UP ? 'UP' : 'DOWN'} Market
              </span>
              <span>{pairedMarket.windowMinutes}min</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            <span>{formatCompactNumber(market.volume || 0, 1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{market.traders || 0} traders</span>
          </div>
          {market.liquidity && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              <span>{formatCompactNumber(market.liquidity, 1)} liq</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MarketCard;
