import { Bookmark } from "lucide-react";
import { NavLink } from "react-router-dom";
import { formatCompactNumber } from "@/lib/formatters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

// Mock markets data
const mockMarkets = [
  {
    marketId: 1,
    title: "Will BTC be above $119,500 at 23:15?",
    yesChance: 66,
    volume: 3800000,
  },
  {
    marketId: 2,
    title: "Will BTC be above $119,800 at 23:20?",
    yesChance: 45,
    volume: 3800000,
  },
  {
    marketId: 3,
    title: "Will BTC be above $119,600 at 23:25?",
    yesChance: 50,
    volume: 3800000,
  },
  {
    marketId: 4,
    title: "Will BTC be above $119,400 at 23:30?",
    yesChance: 78,
    volume: 3800000,
  },
  {
    marketId: 5,
    title: "Will BTC be above $120,000 at 23:35?",
    yesChance: 42,
    volume: 3800000,
  },
];

export function AppSidebar() {
  const [selectedToken, setSelectedToken] = useState("BTC");
  const [selectedDuration, setSelectedDuration] = useState("1");

  return (
    <div className="h-full overflow-hidden bg-white">
      <div className="h-full overflow-y-auto">
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
                <SelectItem value="1">1m</SelectItem>
                <SelectItem value="3">3m</SelectItem>
                <SelectItem value="5">5m</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-2">
          <div className="space-y-2">
            {mockMarkets.map((market) => (
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
        </div>
      </div>
    </div>
  );
}
