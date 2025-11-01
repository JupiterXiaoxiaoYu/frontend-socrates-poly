import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Bookmark } from "lucide-react";

// Mock data - replace with actual API
const currentTick = 1000;
const mockMarkets = [
  {
    marketId: 1,
    title: "Will BTC be above $119,500 at 23:15?",
    status: 'active' as const,
    targetPrice: 119500,
    currentPrice: 119756,
    currentTick: currentTick,
    targetTick: currentTick + 54, // ~4.5 minutes
    yesChance: 67,
    volume: 125000,
    traders: 342,
    isUp: true,
  },
  {
    marketId: 2,
    title: "Will BTC be above $119,800 at 23:20?",
    status: 'active' as const,
    targetPrice: 119800,
    currentPrice: 119756,
    currentTick: currentTick,
    targetTick: currentTick + 114, // ~9.5 minutes
    yesChance: 45,
    volume: 85000,
    traders: 218,
    isUp: false,
  },
  {
    marketId: 3,
    title: "Will BTC be above $119,600 at 23:25?",
    status: 'pending' as const,
    targetPrice: 119600,
    currentPrice: 119756,
    currentTick: currentTick,
    targetTick: currentTick + 174, // ~14.5 minutes
    yesChance: 50,
    volume: 0,
    traders: 0,
    isUp: true,
  },
  {
    marketId: 4,
    title: "Will BTC be above $119,400 at 23:30?",
    status: 'active' as const,
    targetPrice: 119400,
    currentPrice: 119756,
    currentTick: currentTick,
    targetTick: currentTick + 234, // ~19.5 minutes
    yesChance: 78,
    volume: 156000,
    traders: 445,
    isUp: true,
  },
  {
    marketId: 5,
    title: "Will BTC be above $120,000 at 23:35?",
    status: 'closed' as const,
    targetPrice: 120000,
    currentPrice: 119756,
    currentTick: currentTick,
    targetTick: currentTick - 12, // Already passed
    yesChance: 42,
    volume: 98000,
    traders: 287,
    isUp: false,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [selectedToken, setSelectedToken] = useState("BTC");
  const [selectedDuration, setSelectedDuration] = useState("1");

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
                  <SelectItem value="1">1m</SelectItem>
                  <SelectItem value="3">3m</SelectItem>
                  <SelectItem value="5">5m</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="trending" className="space-y-3 mt-4">
            <div className="space-y-3">
              {mockMarkets.map((market) => (
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
                    <span className="text-xs text-muted-foreground">
                      Vol. ${(market.volume / 1000000).toFixed(1)}M
                    </span>
                    <Bookmark className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
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
