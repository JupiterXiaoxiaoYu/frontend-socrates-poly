import Header from "../components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Bookmark } from "lucide-react";
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
}

const Index = () => {
  const navigate = useNavigate();
  const { markets, marketPrices, isLoading } = useMarket();
  const [selectedDuration, setSelectedDuration] = useState("all");

  // 转换 API 数据为显示格式 - 优化依赖避免闪烁
  const displayMarkets = useMemo(() => {
    // 只保留BTC市场（assetId === "1"）
    return markets.filter((market: any) => market.assetId === "1").map((market: any) => {
      // 从最新成交价格计算概率
      const latestPrice = marketPrices.get(market.marketId);
      const { yesChance, noChance } = latestPrice 
        ? calculateProbabilities(latestPrice)
        : calculateProbabilities(); // 默认 50/50

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
        windowMinutes: market.windowMinutes,
      } as DisplayMarket;
    });
  }, [markets.length]); // 只在市场数量变化时更新

  // 过滤和排序市场
  const filteredMarkets = useMemo(() => {
    let filtered = displayMarkets;

    // 按时长过滤
    if (selectedDuration !== "all") {
      const duration = parseInt(selectedDuration);
      filtered = filtered.filter((m: DisplayMarket) => m.windowMinutes === duration);
    }

    // 可以添加更多过滤条件（如按 token）

    // 倒序排列（最新的市场在前）
    return filtered.sort((a, b) => parseInt(b.marketId) - parseInt(a.marketId));
  }, [displayMarkets, selectedDuration]);

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
              Markets
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              Favorites
            </TabsTrigger>
          </TabsList>

          {/* Duration Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Duration:</span>
            <div className="inline-flex items-center rounded-md border border-border bg-background p-1">
              <button
                onClick={() => setSelectedDuration("all")}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  selectedDuration === "all"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedDuration("1")}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  selectedDuration === "1"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                1m
              </button>
              <button
                onClick={() => setSelectedDuration("3")}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  selectedDuration === "3"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                3m
              </button>
              <button
                onClick={() => setSelectedDuration("5")}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  selectedDuration === "5"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                5m
              </button>
            </div>
          </div>

          <TabsContent value="trending" className="space-y-3 mt-4">
            {isLoading && filteredMarkets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Loading markets...</p>
              </div>
            ) : filteredMarkets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No markets found</p>
                <p className="text-xs mt-2">Try changing the filters or wait for new markets to be created</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMarkets.map((market: DisplayMarket) => (
                  <div
                    key={market.marketId}
                    onClick={() => navigate(`/market/${market.marketId}`)}
                    className="p-4 border border-border rounded-lg bg-card hover:border-muted-foreground transition-colors cursor-pointer"
                  >
                    <h3 className="text-sm font-medium text-foreground mb-3 line-clamp-2">{market.title}</h3>

                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-success font-semibold">{market.yesChance}% Yes</span>
                      <span className="text-danger font-semibold">No {100 - market.yesChance}%</span>
                    </div>

                    <div className="h-1 bg-border rounded-full overflow-hidden flex mb-3">
                      <div className="bg-success" style={{ width: `${market.yesChance}%` }} />
                      <div className="bg-danger" style={{ width: `${100 - market.yesChance}%` }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          Vol. ${formatCompactNumber(market.volume)}
                        </span>
                        <span className="text-xs text-muted-foreground">{market.windowMinutes}m</span>
                      </div>
                      <Bookmark className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>No favorites yet</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
