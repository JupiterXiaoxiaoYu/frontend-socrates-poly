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
  // 初始限价：优先使用百分比价格（0-100），否则回退到 yes 概率，再否则 0.5
  const initialLimitPrice =
    typeof market?.currentPrice === "number" && market.currentPrice > 0 && market.currentPrice <= 100
      ? market.currentPrice / 100
      : typeof market?.yesChance === "number"
      ? Math.max(0.01, Math.min(0.99, market.yesChance / 100))
      : 0.5;
  const [limitPrice, setLimitPrice] = useState(initialLimitPrice);
  const [sliderValue, setSliderValue] = useState([0]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { balance } = useMarket();

  // 使用 Context 中统一管理的余额，避免重复调用
  const effectiveBalance = balance?.available ?? userBalance ?? 0;

  // 统一价格含义：接口返回 currentPrice(0-100)，这里转成 0-1 的小数价格
  const marketPriceDecimal =
    typeof market?.currentPrice === "number" && market.currentPrice > 0 && market.currentPrice <= 100
      ? market.currentPrice / 100
      : typeof market?.yesChance === "number"
      ? Math.max(0.01, Math.min(0.99, market.yesChance / 100))
      : 0.5;

  // 下单实际使用的价格：市价单用当前市场价格，限价单用用户输入价格
  const tradePrice = orderType === "market" ? marketPriceDecimal : limitPrice || marketPriceDecimal;

  // 份额估算：用户输入本金 amount（USDC），shares = amount / price
  const estimatedShares = amount > 0 && tradePrice > 0 ? amount / tradePrice : 0;

  useEffect(() => {
    // 当 market.currentPrice 是百分比（<=100）时更新；否则尝试根据 yesChance 更新
    if (typeof market?.currentPrice === "number" && market.currentPrice > 0 && market.currentPrice <= 100) {
      setLimitPrice(market.currentPrice / 100);
    } else if (typeof market?.yesChance === "number") {
      setLimitPrice(Math.max(0.01, Math.min(0.99, market.yesChance / 100)));
    }
  }, [market?.currentPrice, market?.yesChance]);

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

  const isMarketEnded = market.status === MarketStatus.RESOLVED || market.status === MarketStatus.CLOSED;

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

      // 价格换算与桌面端一致：limit -> BPS(0-10000)，market -> 0
      const priceInBps = orderType === "market" ? 0 : Math.round(limitPrice * 10000);

      // 与桌面端保持一致：后端期望 amount = 份额数量 * 100（精度两位）
      const shares = amount > 0 && tradePrice > 0 ? amount / tradePrice : 0;
      if (shares <= 0) {
        return;
      }

      await onPlaceOrder({
        marketId: market.marketId,
        direction: orderDirection,
        orderType: finalOrderType,
        price: priceInBps,
        amount: Math.round(shares * 100),
      });

      setAmount(0);
      setSliderValue([0]);
    } catch (error) {
      console.error("Failed to place order:", error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="px-3 pt-3 pb-6 h-full flex flex-col overflow-y-auto text-sm">
      {/* Professional Mode - 移动端专用，无标题 */}
      <div className="space-y-3 flex-1 flex flex-col min-h-0">
        {/* 市场结束时显示简洁信息 */}
        {isMarketEnded && (
          <div className="space-y-3">
            {/* 状态标题 */}
            <div className="text-center py-2 px-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-semibold text-muted-foreground mb-1">
                {market.status === MarketStatus.RESOLVED ? t("marketResolved") : t("marketEnded")}
              </div>
            </div>

            {/* 市场详细信息 - 只显示价格和结果 */}
            <div className="space-y-2 bg-card border border-border rounded-lg p-3">
              {/* 价格信息 */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Start Price:</span>
                <span className="font-mono font-semibold">
                  $
                  {(market.oracleStartPrice / 100).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">End Price:</span>
                <span
                  className={cn(
                    "font-mono font-semibold",
                    market.oracleEndPrice > 0 && market.oracleStartPrice > 0
                      ? market.oracleEndPrice >= market.oracleStartPrice
                        ? "text-success"
                        : "text-danger"
                      : ""
                  )}
                >
                  {market.oracleEndPrice > 0
                    ? `$${(market.oracleEndPrice / 100).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "N/A"}
                </span>
              </div>

              {/* 结果 */}
              {market.status === MarketStatus.RESOLVED && market.winningOutcome !== undefined && (
                <>
                  <div className="border-t border-border my-2"></div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Result:</span>
                    <span
                      className={cn(
                        "font-semibold text-base",
                        market.winningOutcome === 1 ? "text-success" : market.winningOutcome === 0 ? "text-danger" : ""
                      )}
                    >
                      {market.winningOutcome === 1 ? "✓ YES" : market.winningOutcome === 0 ? "✗ NO" : "TIE"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 只在市场活跃时显示交易界面 */}
        {!isMarketEnded && (
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
                <span>{estimatedShares > 0 ? estimatedShares.toFixed(2) : 0}</span>
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
              disabled={Boolean(amount < MIN_ORDER_AMOUNT) || isPlacingOrder || Boolean(amount > effectiveBalance)}
              className={cn(
                "w-full h-9 text-xs font-semibold",
                action === "buy"
                  ? "bg-success hover:bg-success/90 text-white"
                  : "bg-danger hover:bg-danger/90 text-white"
              )}
            >
              {isPlacingOrder
                ? t("placingOrder")
                : `${action === "buy" ? t("buy") : t("sell")} ${direction === "yes" ? "Yes" : "No"}`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileTradingPanel;
