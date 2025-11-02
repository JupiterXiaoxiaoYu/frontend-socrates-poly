import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Info,
  AlertTriangle,
  Calculator,
  Zap,
  DollarSign,
  Clock,
  Shield,
} from "lucide-react";
import { cn, formatCurrency, formatPercent, formatTimeRemaining } from "@/lib/utils";
import { Market, OrderType, OrderStatus, MarketStatus } from "@/types/market";
import { webSocketService } from "@/services/websocket";
import { calculateSharesFromUSDC } from "@/utils/shareCalculator";

interface TradingPanelProps {
  market: Market;
  pairedMarket?: Market;
  userBalance: number;
  userPositions?: any[];
  isFeeExempt?: boolean;
  onPlaceOrder?: (order: { marketId: number; direction: string; orderType: OrderType; price: number; amount: number }) => Promise<void>;
  onClaim?: (marketId: number) => Promise<void>;
  onDirectionChange?: (direction: 'UP' | 'DOWN') => void;
  className?: string;
}

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];
const FEE_RATE = 0.02; // 2% protocol fee
const MIN_ORDER_AMOUNT = 1; // 最小订单金额 1 USDC (后端精度2位: 100=1.0，最小值100)

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
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [action, setAction] = useState<"buy" | "sell">("buy");
  
  // 包装 setDirection，立即通知父组件
  const handleDirectionChange = (newDirection: 'up' | 'down') => {
    setDirection(newDirection);
    onDirectionChange?.(newDirection.toUpperCase() as 'UP' | 'DOWN');
  };
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [amount, setAmount] = useState(0);
  const [limitPrice, setLimitPrice] = useState(
    market?.currentPrice !== undefined && market?.currentPrice !== null ? market.currentPrice / 100 : 0.5
  );
  const [sliderValue, setSliderValue] = useState([0]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderBook, setOrderBook] = useState<any>(null);
  const [priceImpact, setPriceImpact] = useState(0);

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
    const relevantOrders = direction === "up" ? book.asks : book.bids;
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
  const actualCost = amount; // 用户输入的就是本金
  const tradingFee = isFeeExempt ? 0 : amount * FEE_RATE;
  const totalCost = actualCost + tradingFee;
  const totalFees = tradingFee;

  // P&L calculations
  const maxWin = estimatedShares * 1.0; // $1 per share if win
  const maxLoss = totalCost; // 最大损失就是总成本（含手续费）
  const breakeven = price * (1 + FEE_RATE); // 盈亏平衡点（含手续费）
  const roi = totalCost > 0 ? ((maxWin - totalCost) / totalCost) * 100 : 0;

  // Order validation
  const canPlaceOrder =
    market?.status === MarketStatus.ACTIVE &&
    amount >= MIN_ORDER_AMOUNT &&
    amount <= userBalance &&
    (orderType === "limit" ? limitPrice > 0 && limitPrice < 1 : true);

  const handlePlaceOrder = async () => {
    if (!onPlaceOrder || !canPlaceOrder) return;

    setShowConfirmation(true);
  };

  const confirmOrder = async () => {
    if (!onPlaceOrder) return;

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
        direction: direction.toUpperCase(), // 传递当前选中的方向
        orderType: orderTypeValue,
        price: orderPrice,
        amount: Math.round(estimatedShares * 100),
      });

      // Reset form
      setAmount(0);
      setSliderValue([0]);
      setShowConfirmation(false);
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

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    const newAmount = (userBalance * value[0]) / 100;
    setAmount(newAmount);
  };

  const handlePercentClick = (percent: number) => {
    const newAmount = (userBalance * percent) / 100;
    setAmount(newAmount);
    setSliderValue([percent]);
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount);
    const percent = (quickAmount / userBalance) * 100;
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
              <div className="text-lg font-bold">You Won! 🎉</div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Your prediction was correct. Claim your winnings now.</p>
            <Button onClick={handleClaim} className="w-full bg-green-600 hover:bg-green-700" size="lg">
              <DollarSign className="w-4 h-4 mr-2" />
              Claim Winnings
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
              <div className="text-lg font-bold">Better Luck Next Time</div>
            </div>
            <p className="text-sm text-muted-foreground">The market resolved against your position.</p>
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
      {/* Market Info Header */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {market.assetId === 1 ? "BTC" : market.assetId === 2 ? "ETH" : "SOL"}{" "}
            {market.outcomeType === 1 ? "UP" : "DOWN"}
          </h3>
          <Badge variant={market.timeRemaining && market.timeRemaining < 60000 ? "destructive" : "secondary"}>
            {market.timeRemaining ? formatTimeRemaining(market.timeRemaining) : "Active"}
          </Badge>
        </div>
        {pairedMarket && (
          <div className="text-xs text-muted-foreground">
            Paired with {pairedMarket.outcomeType === 1 ? "UP" : "DOWN"} market (ID: {pairedMarket.marketId})
          </div>
        )}
      </div>

      {/* Direction Tabs (UP/DOWN) */}
      <Tabs
        value={direction}
        onValueChange={(v) => handleDirectionChange(v as "up" | "down")}
        className="space-y-4 flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-2 h-12 bg-muted">
          <TabsTrigger
            value="up"
            className="data-[state=active]:bg-success data-[state=active]:text-white font-semibold"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            UP
          </TabsTrigger>
          <TabsTrigger
            value="down"
            className="data-[state=active]:bg-danger data-[state=active]:text-white font-semibold"
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            DOWN
          </TabsTrigger>
        </TabsList>

        <TabsContent value={direction} className="space-y-4 flex-1 flex flex-col m-0">
          {/* 市场已结束 - 显示结果 */}
          {isMarketEnded ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 text-center space-y-3">
                  <Clock className="w-8 h-8 mx-auto text-muted-foreground" />
                  <div className="text-base font-semibold">
                    {market?.status === MarketStatus.PENDING ? "Not Started" :
                     market?.status === MarketStatus.CLOSED ? "Awaiting Oracle" : "Market Resolved"}
                  </div>
                  
                  {isResolved && (
                    <div className="space-y-2 text-sm pt-2">
                      <div className="flex justify-between py-1.5 border-t">
                        <span className="text-muted-foreground">Start:</span>
                        <span className="font-mono">${(startPrice / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-t">
                        <span className="text-muted-foreground">End:</span>
                        <span className="font-mono">${(endPrice / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-t">
                        <span className="text-muted-foreground">Winner:</span>
                        <span className={`font-semibold ${
                          winningOutcome === 1 ? "text-success" : 
                          winningOutcome === 0 ? "text-danger" : "text-warning"
                        }`}>
                          {winningOutcome === 1 ? "🔼 UP" : 
                           winningOutcome === 0 ? "🔽 DOWN" : "↔️ TIE"}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* 市场活跃 - 显示交易表单 */
            <Tabs value={action} onValueChange={(v) => setAction(v as "buy" | "sell")} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 h-10">
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="sell">Sell</TabsTrigger>
              </TabsList>

              <TabsContent value={action} className="space-y-4 m-0">
                {/* Order Type Dropdown */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Order Type</span>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as "market" | "limit")}
                    className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
                  >
                    <option value="market">Market</option>
                    <option value="limit">Limit</option>
                  </select>
                </div>
              {/* Price Impact Warning */}
              {orderType === "market" && priceImpact > 5 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    High price impact detected: {formatPercent(priceImpact / 100, 1)}. Consider using a limit order or
                    reducing your trade size.
                  </AlertDescription>
                </Alert>
              )}

              {/* Current Price Display - 只在 Limit 模式显示 */}
              {orderType === "limit" && (
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">Your Limit Price</div>
                  <div className="text-2xl font-bold">{formatCurrency(limitPrice)}</div>
                </div>
              )}

              {/* Limit Price - Only for limit orders */}
              {orderType === "limit" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Price</label>
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
                      Market: {formatCurrency(orderBook.midPrice)} •
                      {limitPrice > orderBook.midPrice ? " Above market" : " Below market"}
                    </div>
                  )}
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <label className="font-medium">Amount</label>
                  <span className="text-muted-foreground">Balance: ${userBalance.toFixed(2)}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="pl-7 h-12 text-lg font-semibold"
                    placeholder="0.00"
                    min={MIN_ORDER_AMOUNT}
                  />
                </div>
                {amount > 0 && amount < MIN_ORDER_AMOUNT && (
                  <div className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    最小订单金额为 ${MIN_ORDER_AMOUNT}
                  </div>
                )}
                {amount === 0 && <div className="text-xs text-muted-foreground">最小订单金额: ${MIN_ORDER_AMOUNT}</div>}
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
                    disabled={quickAmount > userBalance}
                  >
                    ${quickAmount}
                  </Button>
                ))}
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
                <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Shares</span>
                    <span className="text-lg font-bold">{estimatedShares.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Potential Win</span>
                    <span className="text-2xl font-bold text-success">${maxWin.toFixed(2)}</span>
                  </div>
                </div>
              )}
                
                {/* Submit Button */}
                <Button
            size="lg"
            className={cn(
              "w-full h-12 font-semibold text-base mt-auto",
              direction === "up"
                ? "bg-success hover:bg-success/90 text-white"
                : "bg-danger hover:bg-danger/90 text-white"
            )}
            disabled={!canPlaceOrder || isPlacingOrder}
            onClick={handlePlaceOrder}
          >
            {isPlacingOrder
              ? "Placing Order..."
              : `${action === "buy" ? "Buy" : "Sell"} ${direction.toUpperCase()} ${
                  orderType === "market" ? "(Market)" : "(Limit)"
                }`}
          </Button>

          {/* Position Info */}
          {userPosition && (
            <div className="text-xs text-muted-foreground text-center">You have a position in this market</div>
          )}
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
      </Tabs>

      {/* Order Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
            <DialogDescription>Please review your order details before confirming.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Market:</span>
                <div className="font-medium">
                  {market.assetId === 1 ? "BTC" : market.assetId === 2 ? "ETH" : "SOL"}{" "}
                  {market.outcomeType === 1 ? "UP" : "DOWN"}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Action:</span>
                <div className="font-medium capitalize">
                  {action} {direction.toUpperCase()}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <div className="font-medium capitalize">{orderType}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Price:</span>
                <div className="font-medium">{formatCurrency(price)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <div className="font-medium">{formatCurrency(amount)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Shares:</span>
                <div className="font-medium">{estimatedShares.toFixed(2)}</div>
              </div>
            </div>

            {priceImpact > 1 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Price impact: {formatPercent(priceImpact / 100, 1)}</AlertDescription>
              </Alert>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Trading Fee:</span>
                <span>{isFeeExempt ? "Exempt" : formatCurrency(tradingFee)}</span>
              </div>
              {!isFeeExempt && (
                <div className="flex justify-between text-sm mb-2">
                  <span>Protocol Fee (2%):</span>
                  <span>{formatCurrency(tradingFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base">
                <span>Total Cost:</span>
                <span>{formatCurrency(amount + totalFees)}</span>
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Risk Warning</span>
              </div>
              <p className="text-muted-foreground text-xs">
                This is a high-risk prediction market. You could lose your entire investment. Only trade what you can
                afford to lose.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={isPlacingOrder}>
              Cancel
            </Button>
            <Button
              onClick={confirmOrder}
              disabled={isPlacingOrder}
              className={cn(direction === "up" ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90")}
            >
              {isPlacingOrder ? "Placing Order..." : "Confirm Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TradingPanel;
