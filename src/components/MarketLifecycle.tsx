// Market Lifecycle Management Component
// Displays market status, progress, and lifecycle events with real-time updates

import { useState, useEffect } from "react";
import { Market, MarketStatus, OutcomeType, Outcome } from "@/types/market";
import { webSocketService } from "@/services/websocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Timer,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  Flag,
  DollarSign,
  Calendar,
  BarChart3,
} from "lucide-react";
import { cn, formatTimeRemaining, formatCurrency, formatPercent, calculatePercentChange } from "@/lib/utils";

interface MarketLifecycleProps {
  market: Market;
  pairedMarket?: Market;
  className?: string;
  onMarketAction?: (action: string, marketId: number) => void;
  showDetails?: boolean;
}

interface LifecycleEvent {
  id: string;
  type: "created" | "started" | "closed" | "resolved";
  timestamp: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "completed" | "pending" | "current";
}

const MarketLifecycle: React.FC<MarketLifecycleProps> = ({
  market,
  pairedMarket,
  className,
  onMarketAction,
  showDetails = true,
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    const unsubscribeMarket = webSocketService.onMarketUpdate(market.marketId, () => {
      // Handle market updates
    });

    return () => {
      clearInterval(timer);
      unsubscribeMarket();
    };
  }, [market.marketId]);

  const getCurrentTick = () => Math.floor(currentTime / 5000);

  // Calculate lifecycle events
  const getLifecycleEvents = (): LifecycleEvent[] => {
    const events: LifecycleEvent[] = [];
    const currentTick = getCurrentTick();
    const startTick = market.startTick;
    const endTick = market.endTick;
    const closeTick = endTick - 12; // Close 1 minute before end

    // Market created
    events.push({
      id: "created",
      type: "created",
      timestamp: startTick * 5000,
      title: "Market Created",
      description: `Prediction market for ${market.assetId === 1 ? "BTC" : market.assetId === 2 ? "ETH" : "SOL"} ${
        market.outcomeType === OutcomeType.UP ? "UP" : "DOWN"
      }`,
      icon: <Flag className="h-4 w-4" />,
      status: currentTick >= startTick ? "completed" : "pending",
    });

    // Market started
    events.push({
      id: "started",
      type: "started",
      timestamp: startTick * 5000,
      title: "Trading Started",
      description: "Market is now open for trading",
      icon: <Play className="h-4 w-4" />,
      status: currentTick >= startTick ? "completed" : "pending",
    });

    // Market closed (for new orders)
    events.push({
      id: "closed",
      type: "closed",
      timestamp: closeTick * 5000,
      title: "Trading Closed",
      description: "No more orders can be placed",
      icon: <Pause className="h-4 w-4" />,
      status:
        currentTick >= closeTick
          ? "completed"
          : currentTick >= startTick && currentTick < closeTick
          ? "current"
          : "pending",
    });

    // Market resolved
    if (market.status === MarketStatus.RESOLVED) {
      events.push({
        id: "resolved",
        type: "resolved",
        timestamp: market.oracleEndTime * 1000,
        title: "Market Resolved",
        description: `Winning outcome: ${getWinningOutcomeText()}`,
        icon: <CheckCircle className="h-4 w-4" />,
        status: "completed",
      });
    } else if (currentTick >= endTick) {
      events.push({
        id: "resolved",
        type: "resolved",
        timestamp: endTick * 5000,
        title: "Awaiting Resolution",
        description: "Market has ended, waiting for oracle price",
        icon: <Timer className="h-4 w-4" />,
        status: "current",
      });
    } else {
      events.push({
        id: "resolved",
        type: "resolved",
        timestamp: endTick * 5000,
        title: "Market Ends",
        description: "Final oracle price will be determined",
        icon: <Clock className="h-4 w-4" />,
        status: "pending",
      });
    }

    return events;
  };

  const getWinningOutcomeText = (): string => {
    if (market.winningOutcome === Outcome.UP) return "UP";
    if (market.winningOutcome === Outcome.DOWN) return "DOWN";
    if (market.winningOutcome === Outcome.TIE) return "TIE";
    return "Unknown";
  };

  const getMarketProgress = (): number => {
    const currentTick = getCurrentTick();
    const totalTicks = market.endTick - market.startTick;
    const elapsedTicks = Math.max(0, Math.min(totalTicks, currentTick - market.startTick));
    return (elapsedTicks / totalTicks) * 100;
  };

  const getTimeRemaining = (): number => {
    const currentTick = getCurrentTick();
    return Math.max(0, (market.endTick - currentTick) * 5000);
  };

  const getStatusColor = (status: MarketStatus): string => {
    switch (status) {
      case MarketStatus.ACTIVE:
        return "text-green-600 bg-green-50 border-green-200";
      case MarketStatus.PENDING:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case MarketStatus.CLOSED:
        return "text-orange-600 bg-orange-50 border-orange-200";
      case MarketStatus.RESOLVED:
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: MarketStatus): React.ReactNode => {
    switch (status) {
      case MarketStatus.ACTIVE:
        return <Play className="h-4 w-4" />;
      case MarketStatus.PENDING:
        return <Clock className="h-4 w-4" />;
      case MarketStatus.CLOSED:
        return <Pause className="h-4 w-4" />;
      case MarketStatus.RESOLVED:
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: MarketStatus): string => {
    switch (status) {
      case MarketStatus.ACTIVE:
        return "Active";
      case MarketStatus.PENDING:
        return "Pending";
      case MarketStatus.CLOSED:
        return "Closed";
      case MarketStatus.RESOLVED:
        return "Resolved";
      default:
        return "Unknown";
    }
  };

  const events = getLifecycleEvents();
  const progress = getMarketProgress();
  const timeRemaining = getTimeRemaining();

  // 计算 windowTicks 和 windowMinutes
  const windowTicks = market.endTick - market.startTick;
  const windowMinutes = Math.round((windowTicks * 5) / 60); // 每个 tick 是 5 秒

  // 计算价格变化
  const priceChange =
    market.oracleStartPrice && market.oracleEndPrice ? market.oracleEndPrice - market.oracleStartPrice : null;
  const priceChangePercent =
    market.oracleStartPrice && market.oracleEndPrice && market.oracleStartPrice > 0
      ? calculatePercentChange(market.oracleEndPrice, market.oracleStartPrice)
      : null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Market Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Market Status</CardTitle>
            <Badge className={cn("flex items-center gap-1", getStatusColor(market.status))}>
              {getStatusIcon(market.status)}
              {getStatusText(market.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {market.status === MarketStatus.ACTIVE && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-muted-foreground">{formatTimeRemaining(timeRemaining)} remaining</div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
                <span className="text-sm font-medium">Duration</span>
              </div>
              <div className="text-lg font-bold">{windowMinutes}min</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Timer className="h-4 w-4 text-muted-foreground mr-1" />
                <span className="text-sm font-medium">Window</span>
              </div>
              <div className="text-lg font-bold">{windowTicks} ticks</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <BarChart3 className="h-4 w-4 text-muted-foreground mr-1" />
                <span className="text-sm font-medium">Volume</span>
              </div>
              <div className="text-lg font-bold">{formatCurrency(market.volume || 0, 0)}</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground mr-1" />
                <span className="text-sm font-medium">Traders</span>
              </div>
              <div className="text-lg font-bold">{market.traders || 0}</div>
            </div>
          </div>

          {/* Oracle Price Information */}
          {(market.oracleStartPrice || market.oracleEndPrice) && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Oracle Price Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {market.oracleStartPrice && (
                  <div>
                    <div className="text-sm text-muted-foreground">Start Price</div>
                    <div className="font-semibold">{formatCurrency(market.oracleStartPrice)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(market.oracleStartTime * 1000).toLocaleString()}
                    </div>
                  </div>
                )}
                {market.oracleEndPrice && (
                  <div>
                    <div className="text-sm text-muted-foreground">End Price</div>
                    <div className="font-semibold">{formatCurrency(market.oracleEndPrice)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(market.oracleEndTime * 1000).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {priceChange !== null && priceChangePercent !== null && (
                <div className="mt-2">
                  <div className="text-sm text-muted-foreground">Price Change</div>
                  <div
                    className={cn(
                      "font-semibold flex items-center gap-1",
                      priceChange > 0 ? "text-green-600" : priceChange < 0 ? "text-red-600" : "text-gray-600"
                    )}
                  >
                    {priceChange > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : priceChange < 0 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : null}
                    {formatCurrency(priceChange)} ({formatPercent(priceChangePercent / 100, 2)})
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resolution Information */}
          {market.status === MarketStatus.RESOLVED && market.winningOutcome !== undefined && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Resolution Result
              </h4>
              <div
                className={cn(
                  "p-3 rounded-lg border text-center",
                  market.winningOutcome === (market.outcomeType === OutcomeType.UP ? Outcome.UP : Outcome.DOWN)
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                )}
              >
                <div className="text-lg font-bold mb-1">
                  {market.winningOutcome === (market.outcomeType === OutcomeType.UP ? Outcome.UP : Outcome.DOWN)
                    ? "✓ YOU WON"
                    : "✗ YOU LOST"}
                </div>
                <div className="text-sm">Winning outcome: {getWinningOutcomeText()}</div>
              </div>
            </div>
          )}

          {/* Paired Market Information */}
          {pairedMarket && showDetails && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Paired Market
              </h4>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">ID:</span> {pairedMarket.marketId}
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  {pairedMarket.outcomeType === OutcomeType.UP ? "UP" : "DOWN"}
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span> {getStatusText(pairedMarket.status)}
                </div>
              </div>
            </div>
          )}

          {/* Admin Actions */}
          {onMarketAction && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Admin Actions</h4>
              <div className="flex flex-wrap gap-2">
                {market.status === MarketStatus.ACTIVE && (
                  <Button size="sm" variant="outline" onClick={() => onMarketAction("close", market.marketId)}>
                    <Pause className="h-4 w-4 mr-1" />
                    Close Market
                  </Button>
                )}
                {market.status === MarketStatus.CLOSED && (
                  <Button size="sm" variant="outline" onClick={() => onMarketAction("resolve", market.marketId)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Resolve Market
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => onMarketAction("details", market.marketId)}>
                  View Details
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lifecycle Timeline */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Market Timeline
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      event.status === "completed"
                        ? "bg-green-100 text-green-600"
                        : event.status === "current"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {event.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{event.title}</h4>
                      {event.status === "current" && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {index < events.length - 1 && <div className="absolute left-4 mt-8 w-0.5 h-8 bg-gray-200" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarketLifecycle;
