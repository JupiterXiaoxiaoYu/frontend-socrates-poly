import { Bookmark } from "lucide-react";
import { NavLink } from "react-router-dom";
import { formatCompactNumber } from "../lib/formatters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState, useMemo, useEffect, useRef } from "react";
import { useMarket, useSound } from "../contexts";
import {
  calculateProbabilities,
  fromUSDCPrecision,
  fromPricePrecision,
} from "../lib/calculations";

interface DisplayMarket {
  marketId: string;
  title: string;
  yesChance: number;
  volume: number;
  windowMinutes: number;
}

export function AppSidebar() {
  const { markets } = useMarket();
  const { playNewMarketSound } = useSound();
  const [selectedToken, setSelectedToken] = useState("BTC");
  const [selectedDuration, setSelectedDuration] = useState("all");
  const previousMarketCountRef = useRef<number>(0);

  // 检测新市场并播放音效
  useEffect(() => {
    if (markets.length > 0) {
      // 如果市场数量增加，播放音效
      if (previousMarketCountRef.current > 0 && markets.length > previousMarketCountRef.current) {
        console.log('🔔 New market detected! Playing notification sound...');
        playNewMarketSound();
      }
      previousMarketCountRef.current = markets.length;
    }
  }, [markets.length, playNewMarketSound]);

  // 转换 API 数据为显示格式
  const displayMarkets = useMemo(() => {
    return markets.map((market: any) => {
      // 计算概率
      const upVolume = BigInt(market.upMarket?.volume || '0');
      const downVolume = BigInt(market.downMarket?.volume || '0');
      const { yesChance } = calculateProbabilities(upVolume, downVolume);

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
        yesChance: Math.round(yesChance),
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

    // 倒序排列（最新的市场在前）
    return filtered.sort((a, b) => parseInt(b.marketId) - parseInt(a.marketId));
  }, [displayMarkets, selectedDuration]);

  return (
    <div className="bg-white">
      {/* Fixed Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-muted-foreground">Market</span>
          <div className="flex items-center gap-2 text-xs">
            <button className="px-3 py-1 rounded bg-foreground text-white hover:bg-foreground/90">
              Trending
            </button>
            <button className="text-muted-foreground hover:text-foreground">
              Favorites
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger className="flex-1 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BTC">BTC</SelectItem>
              <SelectItem value="ETH">ETH</SelectItem>
              <SelectItem value="USDT">USDT</SelectItem>
              <SelectItem value="USDC">USDC</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDuration} onValueChange={setSelectedDuration}>
            <SelectTrigger className="flex-1 h-7 text-xs">
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

      {/* Scrollable Market List - 固定高度 */}
      <div className="h-[calc(100vh-200px)] overflow-y-auto p-2" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {filteredMarkets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <p>No markets found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMarkets.map((market: DisplayMarket) => (
              <NavLink
                key={market.marketId}
                to={`/market/${market.marketId}`}
                className={({ isActive }) =>
                  `block p-3 rounded-lg border transition-all ${
                    isActive
                      ? "border-foreground bg-muted"
                      : "border-border hover:border-muted-foreground bg-white"
                  }`
                }
              >
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-foreground line-clamp-2">
                    {market.title}
                  </h3>

                  <div className="flex justify-between text-xs">
                    <span className="text-success font-semibold">
                      {market.yesChance}% Up
                    </span>
                    <span className="text-danger font-semibold">
                      Down {100 - market.yesChance}%
                    </span>
                  </div>

                  <div className="h-1 bg-muted rounded-full overflow-hidden flex">
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
                    <span className="text-xs text-muted-foreground">
                      Vol. ${formatCompactNumber(market.volume)}
                    </span>
                    <Bookmark className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              </NavLink>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
