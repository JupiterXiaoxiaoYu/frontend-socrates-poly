import { useParams } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/Header";
import PriceChart from "@/components/PriceChart";
import OrderBook from "@/components/OrderBook";
import TradingPanel from "@/components/TradingPanel";
import PositionTabs from "@/components/PositionTabs";
import CountdownTimer from "@/components/CountdownTimer";
import StatusBadge from "@/components/StatusBadge";
import RecentTrades from "@/components/RecentTrades";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { TrendingUp, Users, DollarSign, ArrowUpDown } from "lucide-react";

// Mock data - replace with actual API call
const mockMarket = {
  marketId: 1,
  title: "Will BTC be above $119,500 at 23:15?",
  status: 'active' as const,
  targetPrice: 119500,
  currentPrice: 119756,
  currentTick: 100,
  endTick: 200,
  yesChance: 67,
  volume: 125000,
  traders: 342,
  liquidity: 50000,
  // Add missing properties that TradingPanel expects
  yesOrders: [],
  noOrders: [],
  recentTrades: [],
  description: "Bitcoin price prediction market",
  endTime: "2025-11-01T23:15:00Z",
  creatorFee: "0.02",
  resolvedOutcome: null,
  // Additional properties needed by TradingPanel
  assetId: 1,
  outcomeType: 1,
  timeRemaining: 3600000, // 1 hour in milliseconds
  winningOutcome: undefined,
};

const MarketDetail = () => {
  const { id } = useParams();
  const market = mockMarket; // In real app: fetch market by id
  const [isTradingOpen, setIsTradingOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      <Header />
      
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-white">
        <h1 className="text-sm font-medium text-foreground flex-1">{market.title}</h1>
        <StatusBadge status={market.status} />
        <CountdownTimer
          targetTick={market.endTick}
          currentTick={market.currentTick}
          format="compact"
        />
      </div>

      <main className="flex-1 flex flex-col">
        {/* Market Info Bar */}
        <div className="px-4 py-3 bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between text-xs">
            <div className="hidden md:flex items-center gap-3">
              <div className="text-muted-foreground">
                Current Price: <span className="text-foreground font-semibold">${market.currentPrice.toLocaleString()}</span>
              </div>
              <div className="text-muted-foreground">
                Price to Beat: <span className="text-foreground font-semibold">${market.targetPrice.toLocaleString()}</span>
              </div>
              <div className={market.currentPrice > market.targetPrice ? "text-success" : "text-danger"}>
                Probability: <span className="font-semibold">{market.yesChance}%</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>Liquidity ${(market.liquidity / 1000).toFixed(1)}K</span>
              </div>
              <span>/</span>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Traders {market.traders}</span>
              </div>
              <span>/</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Volume ${(market.volume / 1000).toFixed(1)}K</span>
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
                          targetPrice={market.targetPrice}
                          currentPrice={market.currentPrice}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="orderbook" className="flex-1 p-0 m-0 h-full overflow-hidden">
                      <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-auto">
                          <OrderBook marketId={market.marketId} />
                        </div>
                        <div className="h-[200px] border-t border-border flex-shrink-0">
                          <RecentTrades marketId={market.marketId} />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="rules" className="flex-1 p-4 m-0 overflow-auto">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• Market resolves YES if BTC &gt; ${market.targetPrice.toLocaleString()}</p>
                        <p>• Oracle: Binance API</p>
                        <p>• Each share pays $1.00 if correct</p>
                        <p>• Fee: 2% (waived for makers)</p>
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
              <TradingPanel
                marketId={market.marketId}
                userBalance={1000}
                isFeeExempt={false}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Mobile Trading Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg z-50">
          <div className="px-4 py-3">
            <div className="flex gap-3">
              <Sheet open={isTradingOpen} onOpenChange={setIsTradingOpen}>
                <SheetTrigger asChild>
                  <Button
                    size="lg"
                    className="flex-1 h-12 bg-success hover:bg-success/90 text-white font-semibold text-base rounded-full"
                    onClick={() => setIsTradingOpen(true)}
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
                      marketId={market.marketId}
                      userBalance={1000}
                      isFeeExempt={false}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                size="lg"
                className="flex-1 h-12 bg-danger hover:bg-danger/90 text-white font-semibold text-base rounded-full"
                onClick={() => setIsTradingOpen(true)}
              >
                Down
              </Button>
            </div>
            
            {/* Unrealized P&L */}
            <div className="mt-2 text-center">
              <span className="text-xs text-muted-foreground">
                Unrealized P&L:{" "}
                <span className="font-semibold text-success">+$20,000.53</span>
              </span>
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
