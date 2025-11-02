import { useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import Header from "../components/Header";
import PriceChart from "../components/PriceChart";
import OrderBook from "../components/OrderBook";
import TradingPanel from "../components/TradingPanel";
import PositionTabs from "../components/PositionTabs";
import CountdownTimer from "../components/CountdownTimer";
import StatusBadge from "../components/StatusBadge";
import RecentTrades from "../components/RecentTrades";
import { AppSidebar } from "../components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../components/ui/resizable";
import { Wallet, DollarSign } from "lucide-react";
import { useMarket } from "../contexts";
import { useWallet } from "../contexts";
import { useConnectModal } from "zkwasm-minirollup-browser";
import { useToast } from "../hooks/use-toast";
import { 
  calculateProbabilities, 
  fromUSDCPrecision, 
  fromPricePrecision,
  generateMarketTitle,
  getMarketStatusLabel
} from "../lib/calculations";
import { MarketStatus } from "../types/api";

const MarketDetail = () => {
  const { id } = useParams();
  const { 
    currentMarket, 
    globalState, 
    positions,
    orders,
    setCurrentMarketId,
    placeOrder,
    claim,
    isLoading 
  } = useMarket();
  const { l1Account, l2Account, isConnected, isL2Connected, connectL2 } = useWallet();
  const { openConnectModal } = useConnectModal();
  const { toast } = useToast();
  const [isTradingOpen, setIsTradingOpen] = useState(false);

  // 设置当前市场 ID
  useEffect(() => {
    if (id) {
      setCurrentMarketId(id);
    }
    return () => {
      setCurrentMarketId(null);
    };
  }, [id, setCurrentMarketId]);

  // 计算市场当前价格（从订单簿）
  const marketCurrentPrice = useMemo(() => {
    if (!orders || orders.length === 0) return null;

    // 获取活跃的买单和卖单
    const activeOrders = orders.filter(o => o.status === 0);
    if (activeOrders.length === 0) return null;

    // 计算中间价（买一价 + 卖一价）/ 2
    const buyOrders = activeOrders.filter(o => o.orderType === 0 || o.orderType === 2).sort((a, b) => parseInt(b.price) - parseInt(a.price));
    const sellOrders = activeOrders.filter(o => o.orderType === 1 || o.orderType === 3).sort((a, b) => parseInt(a.price) - parseInt(b.price));

    // 后端使用 BPS：10000 = 100%
    // 除以 100 得到百分比值（0-100）
    const bestBid = buyOrders[0] ? parseInt(buyOrders[0].price) / 100 : null;
    const bestAsk = sellOrders[0] ? parseInt(sellOrders[0].price) / 100 : null;

    if (bestBid && bestAsk) {
      return (bestBid + bestAsk) / 2;
    } else if (bestBid) {
      return bestBid;
    } else if (bestAsk) {
      return bestAsk;
    }

    return null;
  }, [orders]);

  // 计算显示数据并转换为 TradingPanel 所需的 Market 格式
  const marketData = useMemo(() => {
    if (!currentMarket) return null;

    // 计算概率
    const upVolume = BigInt(currentMarket.upMarket?.volume || '0');
    const downVolume = BigInt(currentMarket.downMarket?.volume || '0');
    const { yesChance, noChance } = calculateProbabilities(upVolume, downVolume);

    // 计算总成交量
    const totalVolume = fromUSDCPrecision(currentMarket.upMarket?.volume || '0') + 
                       fromUSDCPrecision(currentMarket.downMarket?.volume || '0');

    // 生成标题
    const asset = currentMarket.assetId === '1' ? 'BTC' : 'ETH';
    const targetPrice = fromPricePrecision(currentMarket.oracleStartPrice);
    const title = generateMarketTitle(
      asset as 'BTC' | 'ETH',
      targetPrice,
      parseInt(currentMarket.oracleStartTime),
      currentMarket.windowMinutes
    );

    // 转换为 TradingPanel 所需的格式
    return {
      id: parseInt(currentMarket.marketId),
      marketId: parseInt(currentMarket.marketId),
      title,
      status: currentMarket.status,  // 保持数字类型（MarketStatus 枚举）
      statusLabel: getMarketStatusLabel(currentMarket.status),
      targetPrice,
      currentPrice: marketCurrentPrice, // 从订单簿计算的价格
      hasOrders: marketCurrentPrice !== null,
      yesChance: Math.round(yesChance),
      noChance: Math.round(noChance),
      totalVolume,
      windowMinutes: currentMarket.windowMinutes,
      startTick: parseInt(currentMarket.startTick),
      endTick: parseInt(currentMarket.endTick),
      // 计算结束时间戳
      endTimestamp: parseInt(currentMarket.oracleStartTime) + (currentMarket.windowMinutes * 60),
      // Oracle 价格
      oracleStartPrice: parseInt(currentMarket.oracleStartPrice),
      oracleEndPrice: parseInt(currentMarket.oracleEndPrice || '0'),
      // TradingPanel 需要的字段
      yesOrders: [],
      noOrders: [],
      recentTrades: [],
      description: title,
      endTime: new Date(parseInt(currentMarket.oracleStartTime) * 1000 + currentMarket.windowMinutes * 60 * 1000).toISOString(),
      creatorFee: "0.02",
      resolvedOutcome: currentMarket.status === MarketStatus.Resolved ? (currentMarket.winningOutcome === 1 ? true : false) : null,
      assetId: parseInt(currentMarket.assetId),
      outcomeType: 1,
      timeRemaining: 0,
      winningOutcome: currentMarket.status === MarketStatus.Resolved ? currentMarket.winningOutcome : undefined,
    };
  }, [currentMarket?.marketId, currentMarket?.status, marketCurrentPrice]); // 只在关键字段变化时更新

  // 计算用户余额
  const userBalance = useMemo(() => {
    if (!positions.length) return 0;
    const usdcPosition = positions.find(p => p.tokenIdx === '0');
    return usdcPosition ? fromUSDCPrecision(usdcPosition.balance) : 0;
  }, [positions]);

  // 处理下单
  const handlePlaceOrder = async (order: {
    marketId: number;
    orderType: any;
    price: number;
    amount: number;
  }) => {
    try {
      // 转换参数格式
      const direction = order.orderType === 0 || order.orderType === 2 ? 'UP' : 'DOWN';
      const orderTypeStr = 
        order.orderType === 0 ? 'limit_buy' :
        order.orderType === 1 ? 'limit_sell' :
        order.orderType === 2 ? 'market_buy' : 'market_sell';

      // TradingPanel 传过来的参数：
      // - price: 已经是 BPS (0-10000)，例如 5000 = 50%
      // - amount: 已经是 2位精度 (100 = 1.0)，例如 1000 = 10.00
      await placeOrder({
        marketId: BigInt(order.marketId),
        direction,
        orderType: orderTypeStr as any,
        price: BigInt(order.price), // 直接使用，已经是 BPS
        amount: BigInt(order.amount), // 直接使用，已经是 2位精度
      });

      toast({
        title: 'Order Placed',
        description: `Successfully placed ${direction} ${orderTypeStr} order`,
      });
    } catch (error) {
      console.error('Place order failed:', error);
      toast({
        title: 'Order Failed',
        description: error instanceof Error ? error.message : 'Failed to place order',
        variant: 'destructive',
      });
    }
  };

  // 处理 Claim
  const handleClaim = async (marketId: number) => {
    try {
      await claim(BigInt(marketId));
      toast({
        title: 'Claim Successful',
        description: 'Successfully claimed winnings!',
      });
    } catch (error) {
      console.error('Claim failed:', error);
      toast({
        title: 'Claim Failed',
        description: error instanceof Error ? error.message : 'Failed to claim',
        variant: 'destructive',
      });
    }
  };

  // 检查是否已完全连接（L1 + L2）
  const isWalletConnected = isConnected && (isL2Connected || !!l2Account);

  // 处理钱包连接（与 WalletButton 一致）
  const handleConnectWallet = async () => {
    try {
      if (!isConnected) {
        // 打开 RainbowKit 连接模态框
        console.log('Opening connect modal...');
        openConnectModal?.();
      } else if (!isL2Connected && !l2Account) {
        // 连接 L2
        console.log('Connecting to L2...');
        toast({
          title: 'Connecting to App...',
          description: 'Please sign the message to connect',
        });
        await connectL2();
        toast({
          title: 'Connected!',
          description: 'Successfully connected to the prediction market',
        });
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // 处理交易按钮点击
  const handleTradingClick = () => {
    if (!isWalletConnected) {
      handleConnectWallet();
    } else {
      setIsTradingOpen(true);
    }
  };

  // 加载中状态
  if (isLoading && !currentMarket) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Loading market...</p>
          </div>
        </div>
      </div>
    );
  }

  // 市场不存在
  if (!currentMarket && !isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Market not found</p>
          </div>
        </div>
      </div>
    );
  }

  if (!marketData) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      <Header />
      
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-white">
        <h1 className="text-sm font-medium text-foreground flex-1">{marketData.title}</h1>
        <StatusBadge status={marketData.status} />
        <CountdownTimer
          targetTimestamp={marketData.endTimestamp}
          format="compact"
        />
      </div>

      <main className="flex-1 flex flex-col">
        {/* Market Info Bar */}
        <div className="px-4 py-3 bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between text-xs">
            <div className="hidden md:flex items-center gap-3">
              <div className="text-muted-foreground">
                Market Price: {marketData.hasOrders ? (
                  <span className="font-semibold text-foreground">
                    {marketData.currentPrice?.toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">No orders</span>
                )}
              </div>
              <div className="text-muted-foreground">
                Target: <span className="text-foreground font-semibold">${marketData.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Probability:</span>
                <span className="text-success font-semibold">{marketData.yesChance}% UP</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-danger font-semibold">{marketData.noChance}% DOWN</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>Volume ${(marketData.totalVolume / 1000).toFixed(1)}K</span>
              </div>
              <span>/</span>
              <div className="flex items-center gap-1">
                <span>{marketData.windowMinutes}m Window</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left: Sidebar */}
          <ResizablePanel 
            defaultSize={20} 
            minSize={15} 
            maxSize={30}
            className="hidden md:block"
          >
            <AppSidebar />
          </ResizablePanel>

          <ResizableHandle withHandle className="hidden md:flex" />

          {/* Middle: Chart + Tabs */}
          <ResizablePanel defaultSize={55} minSize={40}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Top: Chart/OrderBook/Rules */}
              <ResizablePanel defaultSize={60} minSize={40} maxSize={70}>
                <div className="flex flex-col h-full min-w-0">
                  <Tabs defaultValue="chart" className="flex flex-col h-full">
                    <TabsList className="w-full justify-start rounded-none border-b border-border bg-white h-auto p-0 flex-shrink-0">
                      <TabsTrigger
                        value="chart"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
                      >
                        Chart
                      </TabsTrigger>
                      <TabsTrigger
                        value="orderbook"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
                      >
                        Order Book
                      </TabsTrigger>
                      <TabsTrigger
                        value="rules"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
                      >
                        Rules
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="chart" className="flex-1 p-0 m-0 h-full">
                      <div className="h-full p-4">
                        <PriceChart
                          targetPrice={marketData.targetPrice}
                          currentPrice={marketData.currentPrice || undefined}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="orderbook" className="flex-1 p-0 m-0 h-full overflow-hidden">
                      <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-auto">
                          <OrderBook marketId={marketData.marketId} />
                        </div>
                        <div className="h-[200px] border-t border-border flex-shrink-0">
                          <RecentTrades marketId={marketData.marketId} />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="rules" className="flex-1 p-4 m-0 overflow-auto">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• Market resolves UP if BTC price &gt; ${marketData.targetPrice.toLocaleString()}</p>
                        <p>• Market resolves DOWN if BTC price &lt; ${marketData.targetPrice.toLocaleString()}</p>
                        <p>• Market resolves TIE if BTC price = ${marketData.targetPrice.toLocaleString()}</p>
                        <p>• Oracle: Binance API (submitted by Oracle at market end)</p>
                        <p>• Each winning share pays $1.00 USDC</p>
                        <p>• Protocol Fee: 2% (waived for designated market makers)</p>
                        <p>• Window: {marketData.windowMinutes} minute(s)</p>
                        <p>• Grace Period: 1 minute after market end for Oracle resolution</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Bottom: Position Tabs (including Claim) */}
              <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
                <div className="h-full overflow-auto border-t border-border">
                  <PositionTabs />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle className="hidden lg:flex" />

          {/* Right: Trading Panel */}
          <ResizablePanel 
            defaultSize={25} 
            minSize={20} 
            maxSize={35}
            className="hidden lg:block"
          >
            <div className="border-l border-border bg-white h-full">
              {isWalletConnected ? (
                <TradingPanel
                  market={marketData as any}
                  userBalance={userBalance}
                  isFeeExempt={false}
                  onPlaceOrder={handlePlaceOrder}
                  onClaim={handleClaim}
                />
              ) : (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="text-center space-y-4">
                    <Wallet className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Connect Wallet to Trade
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Connect your wallet to start trading
                      </p>
                    </div>
                    <Button onClick={handleConnectWallet}>
                      Connect Wallet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Mobile Trading Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg z-50">
          <div className="px-4 py-3">
            <div className="flex gap-3">
              {isWalletConnected ? (
                <>
                  <Sheet open={isTradingOpen} onOpenChange={setIsTradingOpen}>
                    <SheetTrigger asChild>
                      <Button
                        size="lg"
                        className="flex-1 h-12 bg-success hover:bg-success/90 text-white font-semibold text-base rounded-full"
                        onClick={handleTradingClick}
                      >
                        Up
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[90vh] p-0">
                      <SheetHeader className="px-6 py-4 border-b border-border">
                        <SheetTitle>Buy Up Shares</SheetTitle>
                      </SheetHeader>
                      <div className="h-[calc(90vh-73px)] overflow-auto">
                        <TradingPanel
                          market={marketData as any}
                          userBalance={userBalance}
                          isFeeExempt={false}
                          onPlaceOrder={handlePlaceOrder}
                          onClaim={handleClaim}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Button
                    size="lg"
                    className="flex-1 h-12 bg-danger hover:bg-danger/90 text-white font-semibold text-base rounded-full"
                    onClick={handleTradingClick}
                  >
                    Down
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base rounded-full"
                  onClick={handleConnectWallet}
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect Wallet to Trade
                </Button>
              )}
            </div>
          </div>
        </div>


        {/* Bottom padding for mobile to prevent content being hidden behind bottom bar */}
        <div className="lg:hidden h-24" />
      </main>
    </div>
  );
};

export default MarketDetail;
