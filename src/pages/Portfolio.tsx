import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PortfolioPnLChart from "@/components/PortfolioPnLChart";

// Mock positions data
const mockPositions = Array(5).fill(null).map((_, i) => ({
  id: i + 1,
  market: "Ethereum above $4,500 on December 31?",
  side: "UP" as const,
  shares: 24,
  avg: 50,
  now: 50,
  cost: "$10.00",
  estValue: "$100.00",
  unrealizedPnL: "+$128.00(+41%)",
}));

const Portfolio = () => {
  const navigate = useNavigate();
  const [timePeriod, setTimePeriod] = useState("1D");
  const [positionFilter, setPositionFilter] = useState("All");

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Portfolio</h1>
        
        {/* Web3 wallet status */}
        <div className="mb-4">
          <a href="#" className="text-sm text-primary hover:underline">Web3 wallet</a>
          <span className="text-sm text-muted-foreground ml-1">in use</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left: Stats and Claim */}
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Portfolio</div>
                <div className="text-3xl font-bold text-foreground">$3,950.22</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Est.Value</div>
                <div className="text-3xl font-bold text-success">+$10.36</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Cash</div>
                <div className="text-3xl font-bold text-foreground">$10.36</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Realized P&L</div>
                <div className="text-3xl font-bold text-success">+$3,950.22</div>
                <div className="text-xs text-muted-foreground">Past day</div>
              </div>
            </div>

            {/* Claim Section */}
            <Card className="p-4 border border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="text-base font-medium text-foreground">
                  $20,000.53 to Claim
                </div>
                <Button
                  className="bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => navigate('/rewards')}
                >
                  Claim
                </Button>
              </div>
            </Card>
          </div>

          {/* Right: Chart */}
          <Card className="p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-foreground">Realized P&L</div>
              <div className="flex gap-2">
                {["1D", "1W", "1M", "All"].map((period) => (
                  <Button
                    key={period}
                    variant={timePeriod === period ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTimePeriod(period)}
                    className="h-7 px-3 text-xs"
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
            <div className="h-40">
              <PortfolioPnLChart />
            </div>
          </Card>
        </div>

        {/* Positions Table */}
        <Card className="border border-border">
          {/* Tabs */}
          <div className="border-b border-border">
            <Tabs defaultValue="positions" className="w-full">
              <div className="px-4">
                <TabsList className="bg-transparent border-0 h-auto p-0">
                  <TabsTrigger 
                    value="positions" 
                    className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
                  >
                    Positions(10)
                  </TabsTrigger>
                  <TabsTrigger 
                    value="orders" 
                    className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
                  >
                    Open Orders(11)
                  </TabsTrigger>
                    <TabsTrigger 
                    value="history" 
                    className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
                  >
                    History
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </div>

          {/* Filter buttons */}
          <div className="px-4 py-3 border-b border-border flex gap-2">
            {["All", "Up", "Down"].map((filter) => (
              <Button
                key={filter}
                variant={positionFilter === filter ? "default" : "ghost"}
                size="sm"
                onClick={() => setPositionFilter(filter)}
                className="h-8 px-4"
              >
                {filter}
              </Button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Market</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Shares</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Avg</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Now</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Cost</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Est.Value</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Unrealized P&L</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockPositions.map((position) => (
                  <tr key={position.id} className="border-b border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{position.market}</span>
                        <Badge variant="default" className="bg-success text-white text-xs">
                          {position.side}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {position.shares} ¢
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {position.avg} ¢
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {position.now} ¢
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {position.cost}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {position.estValue}
                    </td>
                    <td className="px-4 py-3 text-sm text-success">
                      {position.unrealizedPnL}
                    </td>
                    <td className="px-4 py-3">
                      <Button 
                        variant="link" 
                        className="text-primary h-auto p-0 text-sm"
                      >
                        Sell
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Portfolio;
