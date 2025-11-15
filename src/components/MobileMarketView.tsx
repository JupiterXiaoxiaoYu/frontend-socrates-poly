import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Wallet } from "lucide-react";
import PriceChart from "./PriceChart";
import MobileOrderBook from "./MobileOrderBook";
import MobileTradingPanel from "./MobileTradingPanel";
import PositionTabs from "./PositionTabs";
import CountdownTimer from "./CountdownTimer";
import BTCIcon from "./BTCIcon";
import { useMarket, useWallet } from "../contexts";
import { useToast } from "../hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  calculateProbabilities,
  fromUSDCPrecision,
  fromPricePrecision,
  generateMarketTitle,
} from "../lib/calculations";
import { OrderType, MarketStatus } from "../types/market";
import type { Market } from "../types/market";

interface MobileMarketViewProps {
  marketId: string;
  allMarketIds: string[];
}

const MobileMarketView = ({ marketId, allMarketIds }: MobileMarketViewProps) => {
  const { t } = useTranslation("market");
  const navigate = useNavigate();
  const { toast } = useToast();

  const { currentMarket, positions, orders, trades, setCurrentMarketId, placeOrder, claim } = useMarket();
  const { l2Account, isConnected, isL2Connected, connectL2 } = useWallet();

  const [selectedDirection, setSelectedDirection] = useState<"UP" | "DOWN">("UP");
  const [realtimeBTCPrice, setRealtimeBTCPrice] = useState<number | null>(null);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 找到当前市场在列表中的索引
  useEffect(() => {
    const index = allMarketIds.findIndex((id) => id === marketId);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [marketId, allMarketIds]);

  // 设置当前市场
  useEffect(() => {
    if (marketId) {
      setCurrentMarketId(marketId);
    }
    return () => {
      setCurrentMarketId(null);
    };
  }, [marketId, setCurrentMarketId]);

  // 滑动切换市场
  const handleSwipe = (direction: "left" | "right") => {
    let newIndex = currentIndex;
    if (direction === "left" && currentIndex < allMarketIds.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === "right" && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }

    if (newIndex !== currentIndex) {
      const newMarketId = allMarketIds[newIndex];
      navigate(`/market/${newMarketId}`);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe("left"),
    onSwipedRight: () => handleSwipe("right"),
    trackMouse: false,
    trackTouch: true,
  });

  // 计算市场当前价格
  const marketCurrentPrice = useMemo(() => {
    if (trades && trades.length > 0) {
      const latestTrade = trades[0];
      return parseInt(latestTrade.price) / 100;
    }

    if (!orders || orders.length === 0) return null;

    const activeOrders = orders.filter((o) => o.status === 0);
    if (activeOrders.length === 0) return null;

    const buyOrders = activeOrders
      .filter((o) => o.orderType === 0 || o.orderType === 2)
      .sort((a, b) => parseInt(b.price) - parseInt(a.price));
    const sellOrders = activeOrders
      .filter((o) => o.orderType === 1 || o.orderType === 3)
      .sort((a, b) => parseInt(a.price) - parseInt(b.price));

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
  }, [trades, orders]);

  // 计算市场数据
  const marketData = useMemo(():
    | (Market & { endTimestamp: number; targetPrice: number; windowMinutes: number; totalVolume: number })
    | null => {
    if (!currentMarket) return null;

    const { yesChance, noChance } =
      marketCurrentPrice !== null ? calculateProbabilities(marketCurrentPrice) : { yesChance: 50, noChance: 50 };

    const totalVolume =
      fromUSDCPrecision(currentMarket.upMarket?.volume || "0") +
      fromUSDCPrecision(currentMarket.downMarket?.volume || "0");

    const targetPrice = fromPricePrecision(currentMarket.oracleStartPrice);
    const currentPrice = realtimeBTCPrice || targetPrice;
    const endTimestamp = parseInt(currentMarket.oracleStartTime) + currentMarket.windowMinutes * 60;

    // 将API MarketStatus转换为Market MarketStatus
    let status: MarketStatus;
    switch (currentMarket.status) {
      case 0:
        status = MarketStatus.PENDING;
        break;
      case 1:
        status = MarketStatus.ACTIVE;
        break;
      case 2:
        status = MarketStatus.RESOLVED;
        break;
      case 3:
        status = MarketStatus.CLOSED;
        break;
      default:
        status = MarketStatus.PENDING;
    }

    const assetName = parseInt(currentMarket.assetId) === 1 ? "BTC" : "ETH";
    const title = generateMarketTitle(
      assetName,
      targetPrice,
      parseInt(currentMarket.oracleStartTime),
      currentMarket.windowMinutes
    );

    return {
      marketId: parseInt(currentMarket.marketId),
      title,
      yesChance,
      noChance,
      volume: totalVolume,
      totalVolume,
      endTimestamp,
      status,
      assetId: parseInt(currentMarket.assetId),
      outcomeType: 0,
      startTick: 0,
      endTick: 0,
      oracleStartTime: parseInt(currentMarket.oracleStartTime),
      oracleStartPrice: parseInt(currentMarket.oracleStartPrice),
      oracleEndTime: parseInt(currentMarket.oracleEndTime || "0"),
      oracleEndPrice: parseInt(currentMarket.oracleEndPrice || "0"),
      winningOutcome: 255,
      targetPrice,
      currentPrice,
      windowMinutes: currentMarket.windowMinutes,
    };
  }, [currentMarket, marketCurrentPrice, realtimeBTCPrice]);

  // 计算用户余额
  const userBalance = useMemo(() => {
    const usdcPosition = positions.find((p) => p.tokenIdx === "0");
    return usdcPosition ? fromUSDCPrecision(usdcPosition.balance) : 0;
  }, [positions]);

  // 连接钱包
  const handleConnectWallet = async () => {
    try {
      if (!isConnected) {
        // 打开 Privy 登录弹窗
        // login();
      } else if (!isL2Connected) {
        toast({
          title: t("connectingToApp"),
          description: t("connectingToAppDesc"),
        });
        await connectL2();
        toast({
          title: t("connected"),
          description: t("connectedDesc"),
        });
      }
    } catch (error) {
      toast({
        title: t("connectionFailed"),
        description: t("connectionFailedDesc"),
        variant: "destructive",
      });
    }
  };

  // 下单处理
  const handlePlaceOrder = async (order: {
    marketId: number;
    direction: string;
    orderType: OrderType;
    price: number;
    amount: number;
  }) => {
    try {
      // 将OrderType转换为orderType字符串
      let orderTypeStr: "limit_buy" | "limit_sell" | "market_buy" | "market_sell";
      if (order.orderType === OrderType.LIMIT_BUY) {
        orderTypeStr = "limit_buy";
      } else if (order.orderType === OrderType.LIMIT_SELL) {
        orderTypeStr = "limit_sell";
      } else if (order.orderType === OrderType.MARKET_BUY) {
        orderTypeStr = "market_buy";
      } else {
        orderTypeStr = "market_sell";
      }

      await placeOrder({
        marketId: BigInt(order.marketId),
        direction: order.direction as "UP" | "DOWN",
        orderType: orderTypeStr,
        price: BigInt(Math.round(order.price)),
        amount: BigInt(Math.round(order.amount * 1000000)), // 转换为精度1e6
      });
      toast({
        title: t("orderPlaced"),
        description: t("orderPlacedDesc"),
      });
    } catch (error) {
      toast({
        title: t("orderFailed"),
        description: error instanceof Error ? error.message : t("orderFailedDesc"),
        variant: "destructive",
      });
    }
  };

  // 领取奖励
  const handleClaim = async (marketId: number) => {
    try {
      await claim(BigInt(marketId));
      toast({
        title: t("claimSuccess"),
        description: t("claimSuccessDesc"),
      });
    } catch (error) {
      toast({
        title: t("claimFailed"),
        description: error instanceof Error ? error.message : t("claimFailedDesc"),
        variant: "destructive",
      });
    }
  };

  const isWalletConnected = isConnected && isL2Connected && l2Account;

  if (!marketData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 市场切换指示器 */}
      <div className="flex items-center justify-center gap-1 py-2 border-b border-border">
        {allMarketIds.map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all ${
              index === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-muted"
            }`}
          />
        ))}
      </div>

      {/* 市场信息头部 */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BTCIcon className="w-6 h-6" />
            <div>
              <h1 className="text-lg font-bold">{marketData.title}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {t("targetPrice")}: ${marketData.targetPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <CountdownTimer targetTimestamp={marketData.endTimestamp} format="compact" />
        </div>

        {/* 当前价格和概率 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-success">${marketData.currentPrice?.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              {t("probability")}: {marketData.yesChance}% Yes / {marketData.noChance}% No
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>
              {t("volume")}: ${(marketData.totalVolume / 1000).toFixed(1)}K
            </div>
            <div>
              {marketData.windowMinutes}m {t("window")}
            </div>
          </div>
        </div>
      </div>

      {/* 可滑动的内容区域 - 根据chart展开状态调整底部padding */}
      <div
        {...swipeHandlers}
        className={`flex-1 overflow-auto flex flex-col relative transition-all duration-300 ${
          isChartExpanded ? "pb-[320px]" : "pb-14"
        }`}
      >
        {/* 订单簿和交易面板 - 左右布局 */}
        <div className="flex-shrink-0 p-2 border-b border-border">
          <div className="grid grid-cols-2 gap-2">
            {/* 订单簿 - 固定高度，隐藏滚动条 */}
            <div className="h-[400px] overflow-hidden border border-border rounded">
              <MobileOrderBook marketId={marketData.marketId} direction={selectedDirection} />
            </div>

            {/* 交易面板 - 固定高度，隐藏滚动条 */}
            <div className="h-[400px] overflow-hidden border border-border rounded">
              {isWalletConnected ? (
                <MobileTradingPanel
                  market={marketData}
                  userBalance={userBalance}
                  isFeeExempt={false}
                  onPlaceOrder={handlePlaceOrder}
                  onClaim={handleClaim}
                  onDirectionChange={setSelectedDirection}
                />
              ) : (
                <div className="h-full flex items-center justify-center p-4">
                  <div className="text-center space-y-3">
                    <Wallet className="w-10 h-10 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">{t("connectWalletToTrade")}</p>
                      <p className="text-[10px] text-muted-foreground">{t("connectWalletDesc")}</p>
                    </div>
                    <Button size="sm" onClick={handleConnectWallet} className="w-full">
                      {t("connectWallet")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 持仓区域 - 在OrderBook和TradingPanel正下方，支持滚动 */}
          {isWalletConnected && (
            <div className="mt-2 border border-border rounded bg-card">
              <PositionTabs />
            </div>
          )}
        </div>

        {/* 占位空间，让内容可以滚动 */}
        <div className="flex-1 min-h-[100px]"></div>
      </div>

      {/* K线图 - 固定在底部，向上展开 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg transition-all duration-300">
        <button
          onClick={() => setIsChartExpanded(!isChartExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors bg-card"
        >
          <span className="font-semibold text-sm">{t("chart")}</span>
          {isChartExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {isChartExpanded && (
          <div className="h-64 p-2 border-t border-border bg-card overflow-hidden">
            <PriceChart targetPrice={marketData.targetPrice} onPriceUpdate={setRealtimeBTCPrice} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMarketView;
