import Header from "../components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Bookmark } from "lucide-react";
import { useMarket } from "../contexts";
import { 
  calculateProbabilities, 
  fromUSDCPrecision, 
  fromPricePrecision,
  formatCompactNumber,
  getMarketStatusLabel 
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
  const { markets, globalState, isLoading } = useMarket();
  const [selectedToken, setSelectedToken] = useState("BTC");
  const [selectedDuration, setSelectedDuration] = useState("all");

  // 转换 API 数据为显示格式
  const displayMarkets = useMemo(() => {
    return markets.map((market: any) => {
      // 计算概率
      const upVolume = BigInt(market.upMarket?.volume || '0');
      const downVolume = BigInt(market.downMarket?.volume || '0');
      const { yesChance, noChance } = calculateProbabilities(upVolume, downVolume);
      
      // 计算总成交量
      const totalVolume = fromUSDCPrecision(market.upMarket?.volume || '0') + 
                         fromUSDCPrecision(market.downMarket?.volume || '0');
      
      // 生成标题（使用当地时区，英文格式，24小时制）
      const asset = market.assetId === '1' ? 'BTC' : 'ETH';
      const targetPrice = fromPricePrecision(market.oracleStartPrice);
      const time = new Date(parseInt(market.oracleStartTime) * 1000).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
        hour12: false
      });
      const title = `Will ${asset} be above $${targetPrice.toLocaleString()} at ${time}?`;
      
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
  }, [markets]);

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
    <div className="min-h-screen bg-white">
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

          {/* Dropdown filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Token:</span>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger className="h-9 w-24 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">BTC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Duration:</span>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger className="h-9 w-20 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1">1m</SelectItem>
                  <SelectItem value="3">3m</SelectItem>
                  <SelectItem value="5">5m</SelectItem>
                </SelectContent>
              </Select>
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
                  className="p-4 border border-border rounded-lg bg-white hover:border-muted-foreground transition-colors cursor-pointer"
                >
                  <h3 className="text-sm font-medium text-foreground mb-3 line-clamp-2">
                    {market.title}
                  </h3>

                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-success font-semibold">{market.yesChance}% Up</span>
                    <span className="text-danger font-semibold">Down {100 - market.yesChance}%</span>
                  </div>

                  <div className="h-1 bg-border rounded-full overflow-hidden flex mb-3">
                    <div
                      className="bg-success"
                      style={{ width: `${market.yesChance}%` }}
                    />
                    <div
                      className="bg-danger"
                      style={{ width: `${100 - market.yesChance}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Vol. ${formatCompactNumber(market.volume)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {market.windowMinutes}m
                      </span>
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
