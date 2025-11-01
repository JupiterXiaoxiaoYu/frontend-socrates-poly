import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Shield
} from "lucide-react";
import { cn, formatCurrency, formatPercent, formatTimeRemaining } from "@/lib/utils";
import { Market, OrderType, OrderStatus, MarketStatus } from "@/types/market";
import { webSocketService } from "@/services/websocket";

interface TradingPanelProps {
  market: Market;
  pairedMarket?: Market;
  userBalance: number;
  userPositions?: any[];
  isFeeExempt?: boolean;
  onPlaceOrder?: (order: {
    marketId: number;
    orderType: OrderType;
    price: number;
    amount: number;
  }) => Promise<void>;
  onClaim?: (marketId: number) => Promise<void>;
  className?: string;
}

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];
const FEE_RATE = 0.02; // 2%
const GAS_ESTIMATE = 0.5; // $0.5 estimated gas

const TradingPanel = ({
  market,
  pairedMarket,
  userBalance,
  userPositions = [],
  isFeeExempt = false,
  onPlaceOrder,
  onClaim,
  className
}: TradingPanelProps) => {
  const [side, setSide] = useState<'up' | 'down'>('up');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState(0);
  const [limitPrice, setLimitPrice] = useState(market?.currentPrice || 0.5);
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
    if (market?.currentPrice) {
      setLimitPrice(market.currentPrice);
    }
  }, [market?.currentPrice]);

  const calculatePriceImpact = (tradeAmount: number, book: any) => {
    if (!book || orderType !== 'market' || tradeAmount === 0) {
      setPriceImpact(0);
      return;
    }

    // Simplified price impact calculation
    const relevantOrders = side === 'up' ? book.asks : book.bids;
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
  const userPosition = userPositions.find(pos => pos.marketId === market?.marketId);
  const hasWinnings = userPosition && market?.status === MarketStatus.RESOLVED &&
                     market?.winningOutcome !== undefined &&
                     ((market?.outcomeType === 1 && market.winningOutcome === 1) ||
                      (market?.outcomeType === 0 && market.winningOutcome === 0));

  // Fee calculations
  const tradingFee = isFeeExempt ? 0 : amount * FEE_RATE;
  const totalFees = tradingFee + GAS_ESTIMATE;

  // P&L calculations
  const price = orderType === 'market' ? (market?.currentPrice || 0.5) : limitPrice;
  const estimatedShares = amount > 0 ? amount / price : 0;
  const maxWin = estimatedShares * 1.0; // $1 per share if win
  const maxLoss = amount + totalFees;
  const breakeven = price;
  const roi = amount > 0 ? ((maxWin - maxLoss) / maxLoss * 100) : 0;

  // Order validation
  const canPlaceOrder = market?.status === MarketStatus.ACTIVE &&
                        amount > 0 &&
                        amount <= userBalance &&
                        (orderType === 'limit' ? limitPrice > 0 && limitPrice < 1 : true);

  const handlePlaceOrder = async () => {
    if (!onPlaceOrder || !canPlaceOrder) return;

    setShowConfirmation(true);
  };

  const confirmOrder = async () => {
    if (!onPlaceOrder) return;

    setIsPlacingOrder(true);
    try {
      const orderTypeValue = side === 'up'
        ? (orderType === 'market' ? OrderType.MARKET_BUY : OrderType.LIMIT_BUY)
        : (orderType === 'market' ? OrderType.MARKET_SELL : OrderType.LIMIT_SELL);

      await onPlaceOrder({
        marketId: market.marketId,
        orderType: orderTypeValue,
        price: Math.round(limitPrice * 10000), // Convert to BPS
        amount: Math.round(amount * 100), // Convert to cents
      });

      // Reset form
      setAmount(0);
      setSliderValue([0]);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Failed to place order:', error);
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
            <p className="text-sm text-muted-foreground mb-4">
              Your prediction was correct. Claim your winnings now.
            </p>
            <Button
              onClick={handleClaim}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
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
            <p className="text-sm text-muted-foreground">
              The market resolved against your position.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Market is not active
  if (market?.status !== MarketStatus.ACTIVE) {
    return (
      <div className={cn("p-6 space-y-4", className)}>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <div className="text-lg font-semibold mb-2">
              {market?.status === MarketStatus.PENDING ? 'Market Not Started' :
               market?.status === MarketStatus.CLOSED ? 'Trading Closed' :
               'Market Ended'}
            </div>
            <p className="text-sm text-muted-foreground">
              {market?.status === MarketStatus.PENDING ? 'This market has not yet started.' :
               market?.status === MarketStatus.CLOSED ? 'Trading has closed for this market.' :
               'This market has ended and is awaiting resolution.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("p-6 h-full flex flex-col overflow-auto", className)}>
      {/* Market Info Header */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {market.assetId === 1 ? 'BTC' : market.assetId === 2 ? 'ETH' : 'SOL'} {market.outcomeType === 1 ? 'UP' : 'DOWN'}
          </h3>
          <Badge variant={market.timeRemaining && market.timeRemaining < 60000 ? "destructive" : "secondary"}>
            {market.timeRemaining ? formatTimeRemaining(market.timeRemaining) : 'Active'}
          </Badge>
        </div>
        {pairedMarket && (
          <div className="text-xs text-muted-foreground">
            Paired with {pairedMarket.outcomeType === 1 ? 'UP' : 'DOWN'} market (ID: {pairedMarket.marketId})
          </div>
        )}
      </div>

      {/* Order Type Toggle */}
      <div className="mb-4">
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <Button
            variant={orderType === 'market' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setOrderType('market')}
            className="flex-1"
          >
            <Zap className="w-4 h-4 mr-2" />
            Market
          </Button>
          <Button
            variant={orderType === 'limit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setOrderType('limit')}
            className="flex-1"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Limit
          </Button>
        </div>
      </div>

      <Tabs value={side} onValueChange={(v) => setSide(v as 'up' | 'down')} className="space-y-4 flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger
            value="up"
            className="data-[state=active]:bg-success data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Buy UP
          </TabsTrigger>
          <TabsTrigger
            value="down"
            className="data-[state=active]:bg-danger data-[state=active]:text-white"
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            Buy DOWN
          </TabsTrigger>
        </TabsList>

        <TabsContent value={side} className="space-y-4 flex-1 flex flex-col">
          {/* Price Impact Warning */}
          {orderType === 'market' && priceImpact > 5 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                High price impact detected: {formatPercent(priceImpact / 100, 1)}.
                Consider using a limit order or reducing your trade size.
              </AlertDescription>
            </Alert>
          )}

          {/* Current Price Display */}
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground">Current Price</div>
            <div className="text-2xl font-bold">
              {formatCurrency(orderType === 'market' ? (market.currentPrice || 0.5) : limitPrice)}
            </div>
            {orderType === 'market' && orderBook && (
              <div className="text-xs text-muted-foreground mt-1">
                Spread: {formatCurrency(orderBook.spread)} • Mid: {formatCurrency(orderBook.midPrice)}
              </div>
            )}
          </div>

          {/* Limit Price - Only for limit orders */}
          {orderType === 'limit' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
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
                  {limitPrice > orderBook.midPrice ? ' Above market' : ' Below market'}
                </div>
              )}
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label className="font-medium">Amount</label>
              <span className="text-muted-foreground">
                Balance: ${userBalance.toFixed(2)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="pl-7 h-12 text-lg font-semibold"
                placeholder="0.00"
              />
            </div>
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

          {/* Estimated Returns */}
          <div className="space-y-2 p-4 rounded-lg bg-success/5 border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-foreground">Estimates</span>
              <Info className="w-3 h-3 text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Shares</span>
                <span className="font-semibold">{estimatedShares.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Max Win</span>
                <span className="font-semibold text-success">
                  +${maxWin.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Max Loss</span>
                <span className="font-semibold text-danger">
                  -${maxLoss.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Breakeven</span>
                <span className="font-semibold">${breakeven.toFixed(2)}</span>
              </div>
              {amount > 0 && (
                <div className="flex justify-between text-xs pt-1 border-t border-border">
                  <span className="text-muted-foreground">ROI</span>
                  <span className={cn("font-semibold", roi > 0 ? "text-success" : "text-danger")}>
                    {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border">
            <div className="text-sm font-semibold text-foreground mb-2">Fees</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Trading Fee (2%)</span>
                <span className="font-medium">
                  {isFeeExempt ? (
                    <span className="text-success">Exempt ✓</span>
                  ) : (
                    `$${tradingFee.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Gas Estimate</span>
                <span className="font-medium">${GAS_ESTIMATE.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1.5 border-t border-border">
                <span className="font-medium text-foreground">Total Fees</span>
                <span className="font-semibold">${totalFees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold pt-1.5 border-t border-border">
                <span className="text-foreground">Total Cost</span>
                <span className="text-foreground">${(amount + totalFees).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            size="lg"
            className={cn(
              "w-full h-12 font-semibold text-base mt-auto",
              side === 'up' ? "bg-success hover:bg-success/90 text-white" : "bg-danger hover:bg-danger/90 text-white"
            )}
            disabled={!canPlaceOrder || isPlacingOrder}
            onClick={handlePlaceOrder}
          >
            {isPlacingOrder ? 'Placing Order...' : `${orderType === 'market' ? 'Place Market' : 'Place Limit'} ${side === 'up' ? 'UP' : 'DOWN'} Order`}
          </Button>

          {/* Position Info */}
          {userPosition && (
            <div className="text-xs text-muted-foreground text-center">
              You have a position in this market
            </div>
          )}

          {/* Mining Reward */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <Sparkles className="w-3 h-3 text-accent" />
            <span>Est. reward 10 SOC, final based on settlement</span>
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
            <DialogDescription>
              Please review your order details before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Market:</span>
                <div className="font-medium">
                  {market.assetId === 1 ? 'BTC' : market.assetId === 2 ? 'ETH' : 'SOL'} {market.outcomeType === 1 ? 'UP' : 'DOWN'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Side:</span>
                <div className="font-medium capitalize">{side}</div>
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
                <AlertDescription>
                  Price impact: {formatPercent(priceImpact / 100, 1)}
                </AlertDescription>
              </Alert>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Trading Fee:</span>
                <span>{isFeeExempt ? 'Exempt' : formatCurrency(tradingFee)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Gas Estimate:</span>
                <span>{formatCurrency(GAS_ESTIMATE)}</span>
              </div>
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
                This is a high-risk prediction market. You could lose your entire investment.
                Only trade what you can afford to lose.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={isPlacingOrder}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmOrder}
              disabled={isPlacingOrder}
              className={cn(
                side === 'up' ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90"
              )}
            >
              {isPlacingOrder ? 'Placing Order...' : 'Confirm Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TradingPanel;
