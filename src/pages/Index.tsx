import Header from "../components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMarket } from "../contexts";
import {
  calculateProbabilities,
  fromUSDCPrecision,
  fromPricePrecision,
  formatCompactNumber,
  getMarketStatusLabel,
  generateMarketTitle,
} from "../lib/calculations";

interface DisplayMarket {
  marketId: string;
  title: string;
  status: string;
  targetPrice: number;
  yesChance: number;
  noChance: number;
  volume: number;
  windowMinutes: number;
  slot: string;
  startTimeSec: number;
}

// 将时间取 15 分钟刻度
const toQuarterMinute = (date: Date): Date => {
  const d = new Date(date);
  const quarter = Math.floor(d.getMinutes() / 15) * 15;
  d.setMinutes(quarter, 0, 0);
  return d;
};

// 生成时间刻度标签，如 7:00、7:15
const formatSlotLabel = (date: Date): string => {
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
};

// 从 Unix 秒（字符串或数字）生成刻度标签
const slotLabelFromUnixSeconds = (seconds: string | number): string => {
  const ts = typeof seconds === "string" ? parseInt(seconds) : seconds;
  const d = new Date(ts * 1000);
  return formatSlotLabel(toQuarterMinute(d));
};

const Index = () => {
  const { t } = useTranslation('market');
  const navigate = useNavigate();
  const { markets, marketPrices, isLoading, setMarketQuery } = useMarket();
  const [selectedDuration, setSelectedDuration] = useState("1");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("all");
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (dir: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = 260; // match w-[240px] + gap
    el.scrollBy({ left: dir === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  // 当前小时的 4 个 15 分钟刻度
  const timeSlots = useMemo(() => {
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);
    return [0, 15, 30, 45].map((min) => {
      const d = new Date(hourStart);
      d.setMinutes(min);
      return formatSlotLabel(d);
    });
  }, []);

  // 预留方案 A：将筛选参数传入 context（目前仍使用原接口，不改变数据来源）
  useEffect(() => {
    const intervalMinutes = parseInt(selectedDuration);
    setMarketQuery({
      intervalMinutes: Number.isFinite(intervalMinutes) ? intervalMinutes : null,
      slotLabel: selectedTimeSlot || null,
    });
  }, [selectedDuration, selectedTimeSlot, setMarketQuery]);

  // 转换 API 数据为显示格式 - 优化依赖避免闪烁
  const displayMarkets = useMemo(() => {
    // 只保留BTC市场（assetId === "1"）
    return markets
      .filter((market: any) => market.assetId === "1")
      .map((market: any) => {
        // 从最新成交价格计算概率
        const latestPrice = marketPrices.get(market.marketId);
        const { yesChance, noChance } = latestPrice ? calculateProbabilities(latestPrice) : calculateProbabilities(); // 默认 50/50

        // 计算总成交量
        const totalVolume =
          fromUSDCPrecision(market.upMarket?.volume || "0") + fromUSDCPrecision(market.downMarket?.volume || "0");

        // 生成标题（统一函数，带窗口）
        const asset = market.assetId === "1" ? "BTC" : "ETH";
        const targetPrice = fromPricePrecision(market.oracleStartPrice);
        const title = generateMarketTitle(
          asset as "BTC" | "ETH",
          targetPrice,
          parseInt(market.oracleStartTime),
          market.windowMinutes
        );

        return {
          marketId: market.marketId,
          title,
          status: getMarketStatusLabel(market.status),
          targetPrice,
          yesChance: Math.round(yesChance),
          noChance: Math.round(noChance),
          volume: totalVolume,
          windowMinutes: parseInt(market.windowMinutes),
          slot: slotLabelFromUnixSeconds(market.oracleStartTime),
          startTimeSec: parseInt(market.oracleStartTime),
        } as DisplayMarket;
      });
  }, [markets.length]); // 只在市场数量变化时更新

  // 过滤和排序市场
  const filteredMarkets = useMemo(() => {
    let filtered = displayMarkets;

    // 按时间刻度过滤（7:00 / 7:15 / 7:30 / 7:45）；All 不限
    if (selectedTimeSlot && selectedTimeSlot !== "all") {
      filtered = filtered.filter((m: DisplayMarket) => m.slot === selectedTimeSlot);
    }

    // 再按时长过滤
    const duration = parseInt(selectedDuration);
    filtered = filtered.filter((m: DisplayMarket) => m.windowMinutes === duration);

    // 可以添加更多过滤条件（如按 token）

    // 升序排列（用于横向走马灯，从左到右时间递增）
    return filtered.sort((a, b) => a.startTimeSec - b.startTimeSec);
  }, [displayMarkets, selectedDuration, selectedTimeSlot]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Market Filters */}
        <Tabs defaultValue="trending" className="space-y-4">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start p-0 h-auto">
            <TabsTrigger
              value="trending"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              {t('markets')}
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              {t('favorites')}
            </TabsTrigger>
          </TabsList>

          {/* Time Slots Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('time')}:</span>
            <Tabs value={selectedTimeSlot} onValueChange={setSelectedTimeSlot} className="space-y-0">
              <TabsList className="bg-transparent border border-border rounded-md p-1 h-auto">
                <TabsTrigger
                  key="all"
                  value="all"
                  className="px-3 py-1 text-sm font-medium rounded transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span>{t('all')}</span>
                </TabsTrigger>
                {timeSlots.map((slot) => (
                  <TabsTrigger
                    key={slot}
                    value={slot}
                    className="px-3 py-1 text-sm font-medium rounded transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <span>{slot}</span>
                    {selectedTimeSlot === slot && (
                      <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Duration Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('duration')}:</span>
            <div className="inline-flex items-center rounded-md border border-border bg-background p-1">
              {["1", "3", "5", "10", "15"].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDuration(d)}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    selectedDuration === d
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          <TabsContent value="trending" className="space-y-3 mt-4">
            {isLoading && filteredMarkets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t('loadingMarkets')}</p>
              </div>
            ) : filteredMarkets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t('noMarketsFound')}</p>
                <p className="text-xs mt-2">{t('noMarketsFoundDesc')}</p>
              </div>
            ) : (
              <div className="relative">
                <button
                  aria-label="Previous"
                  onClick={() => scrollByCard("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-card/90 border border-border p-2 hover:bg-background shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div
                  ref={carouselRef}
                  className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 px-10"
                >
                  {filteredMarkets.map((market: DisplayMarket) => (
                    <div
                      key={market.marketId}
                      onClick={() => navigate(`/market/${market.marketId}`)}
                      className="p-4 border border-border rounded-lg bg-card hover:border-muted-foreground transition-colors cursor-pointer w-[240px] min-w-[240px] h-[360px] snap-start flex flex-col"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {market.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{market.windowMinutes}m</span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-3 h-[48px]">
                        {market.title}
                      </h3>

                      <div className="mt-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-success font-semibold">{market.yesChance}% {t('yes')}</span>
                          <span className="text-danger font-semibold">{t('no')} {100 - market.yesChance}%</span>
                        </div>
                        <div className="h-2 bg-border rounded-full overflow-hidden flex">
                          <div className="bg-success" style={{ width: `${market.yesChance}%` }} />
                          <div className="bg-danger" style={{ width: `${100 - market.yesChance}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3">
                        <div>
                          <div className="text-[10px]">{t('target')}</div>
                          <div className="text-foreground font-medium">${market.targetPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-[10px]">{t('volume')}</div>
                          <div className="text-foreground font-medium">${formatCompactNumber(market.volume)}</div>
                        </div>
                        <div>
                          <div className="text-[10px]">{t('slot')}</div>
                          <div className="text-foreground font-medium">{market.slot}</div>
                        </div>
                        <div>
                          <div className="text-[10px]">{t('market')}</div>
                          <div className="text-foreground font-medium">#{market.marketId}</div>
                        </div>
                      </div>

                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{t('tapToView')}</span>
                        <Bookmark className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  aria-label="Next"
                  onClick={() => scrollByCard("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-card/90 border border-border p-2 hover:bg-background shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('noFavorites')}</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
