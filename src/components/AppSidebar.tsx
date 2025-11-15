import { NavLink } from "react-router-dom";
import { formatCompactNumber } from "../lib/formatters";
import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import BTCIcon from "./BTCIcon";
import { useMarket, useSound } from "../contexts";
import {
  calculateProbabilities,
  fromUSDCPrecision,
  fromPricePrecision,
  generateMarketTitle,
} from "../lib/calculations";

interface DisplayMarket {
  marketId: string;
  title: string;
  yesChance: number;
  volume: number;
  windowMinutes: number;
}

export function AppSidebar() {
  const { t } = useTranslation('market');
  const { markets, marketPrices } = useMarket();
  const { playNewMarketSound } = useSound();
  const [selectedDuration, setSelectedDuration] = useState("all");
  const previousMarketCountRef = useRef<number>(0);

  // 检测新市场并播放音效
  useEffect(() => {
    if (markets.length > 0) {
      // 如果市场数量增加，播放音效
      if (previousMarketCountRef.current > 0 && markets.length > previousMarketCountRef.current) {
        playNewMarketSound();
      }
      previousMarketCountRef.current = markets.length;
    }
  }, [markets.length, playNewMarketSound]);

  // 转换 API 数据为显示格式 - 只保留BTC市场
  const displayMarkets = useMemo(() => {
    return markets.filter((market: any) => market.assetId === "1").map((market: any) => {
      // 从最新成交价格计算概率
      const latestPrice = marketPrices.get(market.marketId);
      const { yesChance } = latestPrice 
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
        yesChance: Math.round(yesChance),
        volume: totalVolume,
        windowMinutes: market.windowMinutes,
      } as DisplayMarket;
    });
  }, [markets, marketPrices]); // 依赖完整的 markets 数组，确保实时更新

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
    <div className="bg-card">
      {/* Fixed Header */}
      <div className="px-4 py-3 border-b border-border">
        {/* Market & Duration Tabs */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Market & Duration</span>
          <div className="grid grid-cols-4 gap-1 p-1 bg-muted/30 rounded-md">
            <button
              onClick={() => setSelectedDuration("all")}
              className={`px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedDuration === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {t('all')}
            </button>
            <button
              onClick={() => setSelectedDuration("1")}
              className={`px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedDuration === "1"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              1m
            </button>
            <button
              onClick={() => setSelectedDuration("5")}
              className={`px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedDuration === "5"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              5m
            </button>
            <button
              onClick={() => setSelectedDuration("10")}
              className={`px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedDuration === "10"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              10m
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Market List - 固定高度 */}
      <div className="h-[calc(100vh-200px)] overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 200px)" }}>
        {filteredMarkets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            <p>{t('noMarketsFoundSidebar')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMarkets.map((market: DisplayMarket) => (
              <NavLink
                key={market.marketId}
                to={`/market/${market.marketId}`}
                className={({ isActive }) =>
                  `block p-3 rounded-lg border transition-all ${
                    isActive ? "border-foreground bg-muted" : "border-border hover:border-muted-foreground bg-card"
                  }`
                }
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BTCIcon size="sm" />
                    <h3 className="text-xs font-medium text-foreground line-clamp-2 flex-1">{market.title}</h3>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-success font-semibold">{market.yesChance}% {t('yes')}</span>
                    <span className="text-danger font-semibold">{t('no')} {100 - market.yesChance}%</span>
                  </div>

                  <div className="h-1 bg-muted rounded-full overflow-hidden flex">
                    <div className="bg-success" style={{ width: `${market.yesChance}%` }} />
                    <div className="bg-danger" style={{ width: `${100 - market.yesChance}%` }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t('volume')} ${formatCompactNumber(market.volume)}</span>
                    <span className="text-xs text-muted-foreground">
                      {market.windowMinutes}m
                    </span>
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
