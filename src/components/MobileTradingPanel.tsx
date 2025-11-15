import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn, formatCurrency } from "@/lib/utils";
import { Market, OrderType, MarketStatus } from "@/types/market";
import { useMarket } from "@/contexts";

interface MobileTradingPanelProps {
  market: Market;
  userBalance: number;
  isFeeExempt?: boolean;
  onPlaceOrder?: (order: {
    marketId: number;
    direction: string;
    orderType: OrderType;
    price: number;
    amount: number;
  }) => Promise<void>;
  onClaim?: (marketId: number) => Promise<void>;
  onDirectionChange?: (direction: "UP" | "DOWN") => void;
}

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];
const MIN_ORDER_AMOUNT = 1;

const floorToTwoDecimals = (value: number): number => {
  return Math.floor(value * 100) / 100;
};

const MobileTradingPanel = ({
  market,
  userBalance,
  isFeeExempt = false,
  onPlaceOrder,
  onClaim,
  onDirectionChange,
}: MobileTradingPanelProps) => {
  const { t } = useTranslation("market");
  // 移动端默认使用Professional模式
  const [direction, setDirection] = useState<"yes" | "no">("yes");
  const [action, setAction] = useState<"buy" | "sell">("buy");

  const handleDirectionChange = (newDirection: "yes" | "no") => {
    setDirection(newDirection);
    onDirectionChange?.(newDirection === "yes" ? "UP" : "DOWN");
  };

  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [amount, setAmount] = useState(0);
  const [limitPrice, setLimitPrice] = useState(
    market?.currentPrice !== undefined && market?.currentPrice !== null ? market.currentPrice / 100 : 0.5
  );
  const [sliderValue, setSliderValue] = useState([0]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { playerId, apiClient } = useMarket();
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!playerId || !apiClient) return;
    const uid = `${playerId[0]}:${playerId[1]}`;
    let cancelled = false;
    const load = async () => {
      try {
        const b = await apiClient.getBalance(uid, "USDC");
        if (cancelled) return;
        setAvailableBalance(parseFloat(b.available));
      } catch (_e) {
        // ignore
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [playerId, apiClient]);

  const effectiveBalance = availableBalance !== null ? availableBalance : userBalance;

  useEffect(() => {
    if (market?.currentPrice !== undefined && market?.currentPrice !== null) {
      setLimitPrice(market.currentPrice / 100);
    }
  }, [market?.currentPrice]);

  const handleAmountChange = (value: number) => {
    const clampedValue = Math.max(0, Math.min(value, effectiveBalance));
    setAmount(clampedValue);
    const percentage = effectiveBalance > 0 ? (clampedValue / effectiveBalance) * 100 : 0;
    setSliderValue([percentage]);
  };

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    const newAmount = floorToTwoDecimals((value[0] / 100) * effectiveBalance);
    setAmount(newAmount);
  };

  const handleQuickAmount = (quickAmount: number) => {
    const newAmount = Math.min(quickAmount, effectiveBalance);
    handleAmountChange(newAmount);
  };

  const isMarketEnded =
    market.status === MarketStatus.RESOLVED ||
    market.status === MarketStatus.CLOSED ||
    Boolean(market.oracleEndTime && market.oracleEndTime > 0);

  const canClaim =
    isMarketEnded &&
    market.winningOutcome !== 255 &&
    (market.winningOutcome === 1 ? direction === "yes" : direction === "no");

  const handlePlaceOrder = async () => {
    if (amount < MIN_ORDER_AMOUNT) {
      return;
    }

    if (!onPlaceOrder) return;

    setIsPlacingOrder(true);
    try {
      const orderDirection = direction === "yes" ? "UP" : "DOWN";
      let finalOrderType: OrderType;

      if (orderType === "market") {
        finalOrderType = action === "buy" ? OrderType.MARKET_BUY : OrderType.MARKET_SELL;
      } else {
        finalOrderType = action === "buy" ? OrderType.LIMIT_BUY : OrderType.LIMIT_SELL;
      }

      const priceInBps = Math.round(limitPrice * 100);

      await onPlaceOrder({
        marketId: market.marketId,
        direction: orderDirection,
        orderType: finalOrderType,
        price: priceInBps,
        amount: amount,
      });

      setAmount(0);
      setSliderValue([0]);
    } catch (error) {
      console.error("Failed to place order:", error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleClaim = async () => {
    if (!onClaim || !canClaim) return;
    try {
      await onClaim(market.marketId);
    } catch (error) {
      console.error("Failed to claim:", error);
    }
  };

  return (
    <div className="px-3 pt-3 pb-6 h-full flex flex-col overflow-y-auto text-sm">
      {/* Professional Mode - 移动端专用，无标题 */}
      <div className="space-y-3 flex-1 flex flex-col min-h-0">
        {/* 如果市场已结束且可以领取，显示提示 */}
        {isMarketEnded && canClaim && (
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-xs">
                {market.winningOutcome === 2
                  ? t("marketTied")
                  : market.winningOutcome === 1
                  ? t("marketEndedYesWon")
                  : t("marketEndedNoWon")}
              </span>
              <Button size="sm" onClick={handleClaim} className="ml-2">
                {t("claimWinnings")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 始终显示交易界面 */}
        <>
          {/* Direction & Action Tabs */}
          <Tabs value={direction} onValueChange={(v) => handleDirectionChange(v as "yes" | "no")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger
                value="yes"
                className="text-xs data-[state=active]:bg-success data-[state=active]:text-white flex items-center justify-center gap-1"
              >
                <TrendingUp className="w-3 h-3" />
                Yes
              </TabsTrigger>
              <TabsTrigger
                value="no"
                className="text-xs data-[state=active]:bg-danger data-[state=active]:text-white flex items-center justify-center gap-1"
              >
                <TrendingDown className="w-3 h-3" />
                No
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={action} onValueChange={(v) => setAction(v as "buy" | "sell")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="buy" className="text-xs flex items-center justify-center gap-1">
                {t("buy")}
              </TabsTrigger>
              <TabsTrigger value="sell" className="text-xs flex items-center justify-center gap-1">
                {t("sell")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Order Type */}
          <div className="space-y-1">
            <Select value={orderType} onValueChange={(v) => setOrderType(v as "market" | "limit")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">{t("market")}</SelectItem>
                <SelectItem value="limit">{t("limit")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Limit Price */}
          {orderType === "limit" && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t("price")}</label>
              <Input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                min={0}
                max={1}
                step={0.01}
                className="h-8 text-xs"
              />
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs text-muted-foreground">{t("amount")}</label>
              <span className="text-xs text-muted-foreground">{formatCurrency(effectiveBalance)} USDC</span>
            </div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              min={0}
              max={effectiveBalance}
              step={1}
              className="h-8 text-xs"
            />
          </div>

          {/* Slider */}
          <Slider value={sliderValue} onValueChange={handleSliderChange} max={100} step={1} className="w-full" />

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-5 gap-0.5">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(quickAmount)}
                disabled={quickAmount > effectiveBalance}
                className="h-7 text-xs"
              >
                {quickAmount}
              </Button>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("shares")}</span>
              <span>{amount > 0 ? Math.floor(amount / limitPrice) : 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("avgPrice")}</span>
              <span>{formatCurrency(limitPrice * 100)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("total")}</span>
              <span className="font-semibold">{formatCurrency(amount)}</span>
            </div>
            {!isFeeExempt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("fee")}</span>
                <span>{formatCurrency(amount * 0.01)}</span>
              </div>
            )}
          </div>

          {/* Warnings */}
          {amount < MIN_ORDER_AMOUNT && amount > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                {t("minimumOrder")}: ${MIN_ORDER_AMOUNT}
              </AlertDescription>
            </Alert>
          )}

          {/* Place Order Button */}
          <Button
            onClick={handlePlaceOrder}
            disabled={
              Boolean(amount < MIN_ORDER_AMOUNT) ||
              isPlacingOrder ||
              Boolean(amount > effectiveBalance) ||
              isMarketEnded
            }
            className={cn(
              "w-full h-9 text-xs font-semibold",
              action === "buy" ? "bg-success hover:bg-success/90 text-white" : "bg-danger hover:bg-danger/90 text-white"
            )}
          >
            {isPlacingOrder
              ? t("placingOrder")
              : isMarketEnded
              ? t("marketEnded")
              : `${action === "buy" ? t("buy") : t("sell")} ${direction === "yes" ? "Yes" : "No"}`}
          </Button>
        </>
      </div>
    </div>
  );
};

export default MobileTradingPanel;
