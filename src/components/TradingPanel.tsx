import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { Market, OrderType, MarketStatus } from "@/types/market";
import { webSocketService } from "@/services/websocket";
import { useMarket } from "@/contexts";

interface TradingPanelProps {
  market: Market;
  pairedMarket?: Market;
  userBalance: number;
  userPositions?: any[];
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
  className?: string;
}

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];
const MIN_ORDER_AMOUNT = 1; // 最小订单金额 1 USDC (后端精度2位: 100=1.0，最小值100)

// 向下取整到两位小数（用于百分数计算）
const floorToTwoDecimals = (value: number): number => {
  return Math.floor(value * 100) / 100;
};

const TradingPanel = ({
  market,
  pairedMarket,
  userBalance,
  userPositions = [],
  isFeeExempt = false,
  onPlaceOrder,
  onClaim,
  onDirectionChange,
  className,
}: TradingPanelProps) => {
  const { t } = useTranslation("market");
  const navigate = useNavigate();
  const { markets, refreshData } = useMarket();
  const [isProfessional, setIsProfessional] = useState(false);
  const [direction, setDirection] = useState<"yes" | "no">("yes");
  const [action, setAction] = useState<"buy" | "sell">("buy");

  // 包装 setDirection，立即通知父组件
  const handleDirectionChange = (newDirection: "yes" | "no") => {
    setDirection(newDirection);
    // 将yes/no映射回UP/DOWN供后端使用
    onDirectionChange?.(newDirection === "yes" ? "UP" : "DOWN");
  };
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [amount, setAmount] = useState(0);
  const [limitPrice, setLimitPrice] = useState(
    market?.currentPrice !== undefined && market?.currentPrice !== null ? market.currentPrice / 100 : 0.5
  );
  const [sliderValue, setSliderValue] = useState([0]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderBook, setOrderBook] = useState<any>(null);
  const [priceImpact, setPriceImpact] = useState(0);
  const { playerId, apiClient } = useMarket();
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);

  // Load USDC balance from gateway, fallback to prop if unavailable
  useEffect(() => {
    if (!playerId || !apiClient) return;
    const uid = `${playerId[0]}:${playerId[1]}`;
    let cancelled = false;
    const load = async () => {
      try {
        const b = await apiClient.getBalance(uid, "USDC");
        if (cancelled) return;
        // Gateway API now returns actual amount (not 2-decimal precision)
        setAvailableBalance(parseFloat(b.available));
      } catch (_e) {
        // ignore and keep fallback balance
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [playerId, apiClient]);

  const effectiveBalance = (availableBalance ?? userBalance) || 0;

  useEffect(() => {
    // Only subscribe if market exists
    if (!market?.marketId) return;

    // Subscribe to order book updates
    const unsubscribe = webSocketService.onOrderBookUpdate(market.marketId, (update) => {
      setOrderBook(update);
      calculatePriceImpact(amount, update);
    });

    return () => unsubscribe();
  }, [market?.marketId]);

  useEffect(() => {
    if (market?.currentPrice !== undefined && market?.currentPrice !== null) {
      // market.currentPrice 是百分比（0-100），需要转为小数（0-1）
      const priceDecimal = market.currentPrice / 100;
      setLimitPrice(priceDecimal);
    }
  }, [market?.currentPrice]);

  const calculatePriceImpact = (tradeAmount: number, book: any) => {
    if (!book || orderType !== "market" || tradeAmount === 0) {
      setPriceImpact(0);
      return;
    }

    // Simplified price impact calculation
    const relevantOrders = direction === "yes" ? book.asks : book.bids;
    let remainingAmount = tradeAmount;
    let totalCost = 0;

    for (const order of relevantOrders) {
      const fillAmount = Math.min(remainingAmount, order.total);
      totalCost += fillAmount * order.price;
      remainingAmount -= fillAmount;

      if (remainingAmount <= 0) break;
    }

    if (remainingAmount > 0) {
      // Not enough liquidity
      setPriceImpact(100);
      return;
    }

    const avgPrice = totalCost / tradeAmount;
    const midPrice = book.midPrice;
    const impact = Math.abs(((avgPrice - midPrice) / midPrice) * 100);
    setPriceImpact(impact);
  };

  // Check if user has position in this market
  const userPosition = userPositions.find((pos) => pos.marketId === market?.marketId);
  const hasWinnings =
    userPosition &&
    market?.status === MarketStatus.RESOLVED &&
    market?.winningOutcome !== undefined &&
    ((market?.outcomeType === 1 && market.winningOutcome === 1) ||
      (market?.outcomeType === 0 && market.winningOutcome === 0));

  // 价格计算（接口返回的是百分比 0-100，这里统一转为 0-1 小数）
  const marketPriceDecimal =
    market?.currentPrice !== undefined && market?.currentPrice !== null ? market.currentPrice / 100 : 0.5;
  const price = orderType === "market" ? marketPriceDecimal : limitPrice;

  // 简化的份额计算（用户输入的是本金，不含手续费）
  const estimatedShares = amount > 0 ? amount / price : 0;

  // P&L calculations
  const maxWin = estimatedShares * 1.0; // $1 per share if win

  // Order validation
  const canPlaceOrder =
    market?.status === MarketStatus.ACTIVE &&
    amount >= MIN_ORDER_AMOUNT &&
    amount <= effectiveBalance &&
    (orderType === "limit" ? limitPrice > 0 && limitPrice < 1 : true);

  const handlePlaceOrder = async () => {
    if (!onPlaceOrder || !canPlaceOrder) return;

    setIsPlacingOrder(true);
    try {
      // 根据 action (buy/sell) 和 orderType (market/limit) 确定订单类型
      let orderTypeValue: OrderType;
      if (action === "buy") {
        orderTypeValue = orderType === "market" ? OrderType.MARKET_BUY : OrderType.LIMIT_BUY;
      } else {
        orderTypeValue = orderType === "market" ? OrderType.MARKET_SELL : OrderType.LIMIT_SELL;
      }

      // 后端期望：
      // - Limit Order: price 是用户指定的价格（BPS）
      // - Market Order: price 传 0（后端按最优价格成交）
      // - amount: 份额数量（精度2位）
      const orderPrice =
        orderType === "market"
          ? 0 // 市价单：price = 0
          : Math.round(limitPrice * 10000); // 限价单：转为 BPS

      await onPlaceOrder({
        marketId: market.marketId,
        direction: direction === "yes" ? "UP" : "DOWN", // 将yes/no映射为UP/DOWN
        orderType: orderTypeValue,
        price: orderPrice,
        amount: Math.round(estimatedShares * 100),
      });

      // Reset form
      setAmount(0);
      setSliderValue([0]);
    } catch (error) {
      // Error handled by parent component
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleClaim = async () => {
    if (!onClaim || !hasWinnings) return;
    await onClaim(market.marketId);
  };

  // 查找同类型的活跃市场
  const findSimilarActiveMarket = () => {
    if (!market) return null;

    // 查找相同 assetId 的活跃市场（优先相同时长）
    const similarMarket = markets.find(
      (m: any) =>
        m.marketId !== market.marketId.toString() &&
        m.assetId === market.assetId.toString() &&
        m.status === MarketStatus.ACTIVE
    );

    return similarMarket;
  };

  const handleContinuePredicting = async () => {
    // 先刷新市场列表，确保获取最新的活跃市场
    await refreshData();

    // 稍微延迟以确保状态更新完成
    setTimeout(() => {
      const similarMarket = findSimilarActiveMarket();
      if (similarMarket) {
        navigate(`/market/${similarMarket.marketId}`);
      }
      // 如果没有相同类型的市场，不跳转（保持在当前页面）
    }, 100);
  };

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    const newAmount = (effectiveBalance * value[0]) / 100;
    // 向下取整到两位小数
    setAmount(floorToTwoDecimals(newAmount));
  };

  const handlePercentClick = (percent: number) => {
    const newAmount = (effectiveBalance * percent) / 100;
    // 向下取整到两位小数
    setAmount(floorToTwoDecimals(newAmount));
    setSliderValue([percent]);
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount);
    const percent = effectiveBalance > 0 ? (quickAmount / effectiveBalance) * 100 : 0;
    setSliderValue([Math.min(percent, 100)]);
  };

  // Market is resolved and user has winnings
  if (market?.status === MarketStatus.RESOLVED && hasWinnings) {
    return (
      <div className={cn("p-6 space-y-4", className)}>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="text-green-600 mb-2">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" />
              <div className="text-lg font-bold">{t("youWon")}</div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t("youWonDesc")}</p>
            <Button onClick={handleClaim} className="w-full bg-green-600 hover:bg-green-700" size="lg">
              <DollarSign className="w-4 h-4 mr-2" />
              {t("claimWinningsButton")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Market is resolved but user lost (only show if user had a position)
  const hadPosition = userPositions && userPositions.length > 0;
  if (market?.status === MarketStatus.RESOLVED && !hasWinnings && hadPosition) {
    return (
      <div className={cn("p-6 space-y-4", className)}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <div className="text-red-600 mb-2">
              <TrendingDown className="w-8 h-8 mx-auto mb-2" />
              <div className="text-lg font-bold">{t("betterLuckNextTime")}</div>
            </div>
            <p className="text-sm text-muted-foreground">{t("betterLuckNextTimeDesc")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 检查市场是否已结束（但仍显示 UP/DOWN 标签结构）
  const isMarketEnded = market?.status !== MarketStatus.ACTIVE;
  const isResolved = market?.status === MarketStatus.RESOLVED;
  const startPrice = market?.oracleStartPrice || 0;
  const endPrice = market?.oracleEndPrice || startPrice;
  const winningOutcome = market?.winningOutcome;

  return (
    <div className={cn("p-6 h-full flex flex-col overflow-auto", className)}>
      {/* Market Info Header with Professional Toggle */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {market.assetId === 1 ? "BTC" : market.assetId === 2 ? "ETH" : "SOL"}{" "}
            {market.outcomeType === 1 ? "UP" : "DOWN"}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Professional</span>
            <Switch checked={isProfessional} onCheckedChange={setIsProfessional} />
          </div>
        </div>
        {pairedMarket && (
          <div className="text-xs text-muted-foreground">
            Paired with {pairedMarket.outcomeType === 1 ? "UP" : "DOWN"} market (ID: {pairedMarket.marketId})
          </div>
        )}
      </div>

      {/* Simple Mode - Direct Buy Yes/No Buttons */}
      {!isProfessional ? (
        <div className="space-y-4 flex-1 flex flex-col">
          {/* 市场已结束 - 显示结果 */}
          {isMarketEnded ? (
            <Card className="border-2">
              <CardContent className="p-6 text-center space-y-4">
                <Clock className="w-10 h-10 mx-auto text-muted-foreground" />
                <div className="text-lg font-bold">
                  {market?.status === MarketStatus.PENDING
                    ? t("notStarted")
                    : market?.status === MarketStatus.CLOSED
                    ? t("awaitingOracle")
                    : t("marketResolved")}
                </div>

                {isResolved && (
                  <>
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center py-3 border-t">
                        <span className="text-sm text-muted-foreground">{t("start")}:</span>
                        <span className="text-xl font-bold font-mono">${(startPrice / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-t">
                        <span className="text-sm text-muted-foreground">{t("end")}:</span>
                        <span className="text-xl font-bold font-mono">${(endPrice / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-t">
                        <span className="text-sm text-muted-foreground">Outcome:</span>
                        <span
                          className={`text-xl font-bold ${
                            winningOutcome === 1
                              ? "text-success"
                              : winningOutcome === 0
                              ? "text-danger"
                              : "text-warning"
                          }`}
                        >
                          {winningOutcome === 1
                            ? `✓ ${t("yes")}`
                            : winningOutcome === 0
                            ? `✗ ${t("no")}`
                            : `↔️ ${t("tie")}`}
                        </span>
                      </div>
                    </div>

                    {/* Continue Predicting Button - 只在有相似市场时显示 */}
                    {findSimilarActiveMarket() && (
                      <Button
                        onClick={handleContinuePredicting}
                        className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        size="lg"
                      >
                        Continue Predicting
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            /* 市场活跃 - 显示交易表单 */
            <>
              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <label className="font-medium">{t("amount")}</label>
                  <span className="text-muted-foreground">
                    {t("balance")}: ${effectiveBalance.toFixed(2)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
                  <Input
                    type="number"
                    value={amount || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || val === ".") {
                        setAmount(0);
                      } else {
                        const numVal = Number(val);
                        if (!isNaN(numVal)) {
                          setAmount(numVal);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        setAmount(Number(val.toFixed(2)));
                      } else if (val === 0 || isNaN(val)) {
                        setAmount(0);
                      }
                    }}
                    className="pl-8 h-16 text-2xl font-semibold text-center"
                    placeholder="0"
                    min={MIN_ORDER_AMOUNT}
                    step="0.01"
                  />
                </div>
                {amount > 0 && amount < MIN_ORDER_AMOUNT && (
                  <div className="text-xs text-red-500 flex items-center gap-1 justify-center">
                    <AlertTriangle className="w-3 h-3" />
                    {t("minimumOrder", { amount: MIN_ORDER_AMOUNT })}
                  </div>
                )}
              </div>

              {/* Slider */}
              <div className="space-y-2">
                <Slider value={sliderValue} onValueChange={handleSliderChange} max={100} step={1} className="py-4" />
                <div className="flex gap-2">
                  {[25, 50, 75, 100].map((percent) => (
                    <Button
                      key={percent}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePercentClick(percent)}
                      className="flex-1 text-xs"
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>
              </div>

              {/* Potential Win Display */}
              {amount > 0 && (
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">{t("potentialWin")}</div>
                  <div className="text-xl font-bold">${(amount / marketPriceDecimal).toFixed(2)}</div>
                </div>
              )}

              {/* Buy Yes / Buy No Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <Button
                  size="lg"
                  className="h-14 font-semibold text-base bg-success hover:bg-success/90 text-white"
                  disabled={!canPlaceOrder || isPlacingOrder}
                  onClick={() => {
                    setDirection("yes");
                    setAction("buy");
                    setOrderType("market");
                    handlePlaceOrder();
                  }}
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Buy Yes
                </Button>
                <Button
                  size="lg"
                  className="h-14 font-semibold text-base bg-danger hover:bg-danger/90 text-white"
                  disabled={!canPlaceOrder || isPlacingOrder}
                  onClick={() => {
                    setDirection("no");
                    setAction("buy");
                    setOrderType("market");
                    handlePlaceOrder();
                  }}
                >
                  <TrendingDown className="w-5 h-5 mr-2" />
                  Buy No
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Professional Mode - Full Trading Interface */
        <div className="space-y-4 flex-1 flex flex-col">
          {/* 市场已结束 - 显示结果 */}
          {isMarketEnded ? (
            <Card className="border-2">
              <CardContent className="p-6 text-center space-y-4">
                <Clock className="w-10 h-10 mx-auto text-muted-foreground" />
                <div className="text-lg font-bold">
                  {market?.status === MarketStatus.PENDING
                    ? t("notStarted")
                    : market?.status === MarketStatus.CLOSED
                    ? t("awaitingOracle")
                    : t("marketResolved")}
                </div>

                {isResolved && (
                  <>
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center py-3 border-t">
                        <span className="text-sm text-muted-foreground">{t("start")}:</span>
                        <span className="text-xl font-bold font-mono">${(startPrice / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-t">
                        <span className="text-sm text-muted-foreground">{t("end")}:</span>
                        <span className="text-xl font-bold font-mono">${(endPrice / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-t">
                        <span className="text-sm text-muted-foreground">Outcome:</span>
                        <span
                          className={`text-xl font-bold ${
                            winningOutcome === 1
                              ? "text-success"
                              : winningOutcome === 0
                              ? "text-danger"
                              : "text-warning"
                          }`}
                        >
                          {winningOutcome === 1
                            ? `✓ ${t("yes")}`
                            : winningOutcome === 0
                            ? `✗ ${t("no")}`
                            : `↔️ ${t("tie")}`}
                        </span>
                      </div>
                    </div>

                    {/* Continue Predicting Button - 只在有相似市场时显示 */}
                    {findSimilarActiveMarket() && (
                      <Button
                        onClick={handleContinuePredicting}
                        className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        size="lg"
                      >
                        Continue Predicting
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            /* 市场活跃 - 显示 YES/NO 标签和交易表单 */
            <Tabs
              value={direction}
              onValueChange={(v) => handleDirectionChange(v as "yes" | "no")}
              className="space-y-4 flex-1 flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 h-12 bg-muted">
                <TabsTrigger
                  value="yes"
                  className="data-[state=active]:bg-success data-[state=active]:text-white font-semibold"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  YES
                </TabsTrigger>
                <TabsTrigger
                  value="no"
                  className="data-[state=active]:bg-danger data-[state=active]:text-white font-semibold"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  NO
                </TabsTrigger>
              </TabsList>

              <TabsContent value={direction} className="space-y-4 flex-1 flex flex-col m-0">
                {/* 市场活跃 - 显示交易表单 */}
                <Tabs value={action} onValueChange={(v) => setAction(v as "buy" | "sell")} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 h-10">
                    <TabsTrigger
                      value="buy"
                      className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black font-semibold"
                    >
                      {t("buy")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="sell"
                      className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black font-semibold"
                    >
                      {t("sell")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={action} className="space-y-4 m-0">
                    {/* Order Type Dropdown */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("orderType")}</span>
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value as "market" | "limit")}
                        className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
                      >
                        <option value="market">{t("marketType")}</option>
                        <option value="limit">{t("limit")}</option>
                      </select>
                    </div>
                    {/* Price Impact Warning */}
                    {orderType === "market" && priceImpact > 5 && (
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {t("highPriceImpact", { impact: formatPercent(priceImpact / 100, 1) })}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Current Price Display - 只在 Limit 模式显示 */}
                    {orderType === "limit" && (
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm text-muted-foreground">{t("yourLimitPrice")}</div>
                        <div className="text-2xl font-bold">{formatCurrency(limitPrice)}</div>
                      </div>
                    )}

                    {/* Limit Price - Only for limit orders */}
                    {orderType === "limit" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t("yourPrice")}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            type="number"
                            value={limitPrice}
                            onChange={(e) => setLimitPrice(Number(e.target.value))}
                            className="pl-7 h-10"
                            step="0.01"
                            min="0.01"
                            max="0.99"
                          />
                        </div>
                        {orderBook && (
                          <div className="text-xs text-muted-foreground">
                            {t("market")}: {formatCurrency(orderBook.midPrice)} •
                            {limitPrice > orderBook.midPrice ? ` ${t("aboveMarket")}` : ` ${t("belowMarket")}`}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Amount Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <label className="font-medium">{t("amount")}</label>
                        <span className="text-muted-foreground">
                          {t("balance")}: ${effectiveBalance.toFixed(2)}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={amount || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || val === ".") {
                              setAmount(0);
                            } else {
                              const numVal = Number(val);
                              if (!isNaN(numVal)) {
                                setAmount(numVal);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              setAmount(Number(val.toFixed(2)));
                            } else if (val === 0 || isNaN(val)) {
                              setAmount(0);
                            }
                          }}
                          className="pl-7 h-12 text-lg font-semibold"
                          placeholder="0.00"
                          min={MIN_ORDER_AMOUNT}
                          step="0.01"
                        />
                      </div>
                      {amount > 0 && amount < MIN_ORDER_AMOUNT && (
                        <div className="text-xs text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {t("minimumOrder", { amount: MIN_ORDER_AMOUNT })}
                        </div>
                      )}
                      {amount === 0 && (
                        <div className="text-xs text-muted-foreground">
                          {t("minimumOrderDesc", { amount: MIN_ORDER_AMOUNT })}
                        </div>
                      )}
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {QUICK_AMOUNTS.map((quickAmount) => (
                        <Button
                          key={quickAmount}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAmount(quickAmount)}
                          className="text-xs"
                          disabled={quickAmount > effectiveBalance}
                        >
                          ${quickAmount}
                        </Button>
                      ))}
                    </div>

                    {/* Slider */}
                    <div className="space-y-2">
                      <Slider
                        value={sliderValue}
                        onValueChange={handleSliderChange}
                        max={100}
                        step={1}
                        className="py-4"
                      />
                      <div className="flex gap-2">
                        {[25, 50, 75, 100].map((percent) => (
                          <Button
                            key={percent}
                            variant="outline"
                            size="sm"
                            onClick={() => handlePercentClick(percent)}
                            className="flex-1 text-xs"
                          >
                            {percent}%
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Potential Win Display */}
                    {amount > 0 && (
                      <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">{t("sharesLabel")}</span>
                          <span className="text-lg font-bold">{estimatedShares.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{t("potentialWin")}</span>
                          <span className="text-2xl font-bold text-success">${maxWin.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      size="lg"
                      className={cn(
                        "w-full h-12 font-semibold text-base mt-auto",
                        direction === "yes"
                          ? "bg-success hover:bg-success/90 text-white"
                          : "bg-danger hover:bg-danger/90 text-white"
                      )}
                      disabled={!canPlaceOrder || isPlacingOrder}
                      onClick={handlePlaceOrder}
                    >
                      {isPlacingOrder
                        ? t("placingOrder")
                        : `${action === "buy" ? t("buy") : t("sell")} ${direction.toUpperCase()} ${
                            orderType === "market" ? t("marketOrder") : t("limitOrder")
                          }`}
                    </Button>

                    {/* Position Info */}
                    {userPosition && (
                      <div className="text-xs text-muted-foreground text-center">{t("youHavePosition")}</div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
};

export default TradingPanel;
