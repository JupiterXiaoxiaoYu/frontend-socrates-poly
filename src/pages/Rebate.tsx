import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getMockMiningList, getMockFeeList } from "@/mocks/rebate";

const Rebate = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"points" | "transactions">("points");

  // Get mock data
  const miningList = getMockMiningList(20);
  const feeList = getMockFeeList(20);

  // Merge and sort by points (using amount as points for simulation)
  const allUsers = [...miningList, ...feeList]
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      points: parseFloat(item.amount) * (item.currency === "SOC" ? 10000 : 1000), // Simulated points calculation
    }))
    .sort((a, b) => b.points - a.points)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  // Current user data (mock)
  const currentUser = {
    rank: 500,
    userName: "Devon Lane",
    avatar: "/placeholder.svg",
    points: 500.0,
    makerPool: 10000,
    takerPool: 10000,
    expectedPoints: 500.0,
    makerVolume: 1000.0,
    takerVolume: 1000.0,
    period: "06/23 00:00 - 06/29 23:59 UTC",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6 text-foreground">My Points</h1>

        {/* Current user points card */}
        <Card className="p-6 border border-border mb-6 bg-gradient-to-br from-card to-card/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-5xl font-bold text-foreground mb-2">{currentUser.points.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Current Period</div>
              <div className="text-xs text-muted-foreground">{currentUser.period}</div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="text-2xl px-4 py-2 mb-2">
                {currentUser.rank}
              </Badge>
              <div className="text-xs text-muted-foreground">Current Rank</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Maker Point Pool</div>
              <div className="text-lg font-semibold text-foreground">{currentUser.makerPool}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Taker Point Pool</div>
              <div className="text-lg font-semibold text-foreground">{currentUser.takerPool}</div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="text-sm text-muted-foreground mb-2">My Estimated Points</div>
            <div className="text-3xl font-bold text-foreground mb-4">{currentUser.expectedPoints.toFixed(2)}</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Maker Volume</div>
                <div className="text-base font-semibold text-foreground">${currentUser.makerVolume.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Taker Volume</div>
                <div className="text-base font-semibold text-foreground">${currentUser.takerVolume.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div
            className="mt-4 text-xs text-[#f59e0b] cursor-pointer hover:underline"
            onClick={() => navigate("/rebate/records")}
          >
            View Records
          </div>
        </Card>

        {/* Points leaderboard and transaction volume leaderboard */}
        <Card className="border border-border">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "points" | "transactions")}
            className="w-full"
          >
            <div className="border-b border-border">
              <div className="px-4">
                <TabsList className="bg-transparent border-0 h-auto p-0">
                  <TabsTrigger
                    value="points"
                    className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
                  >
                    Points Leaderboard
                  </TabsTrigger>
                  <TabsTrigger
                    value="transactions"
                    className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
                  >
                    Volume Leaderboard
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="points" className="p-0 m-0">
              <div className="p-4 text-sm text-muted-foreground border-b border-border">
                Estimated points ranking for this period. Final points will be calculated and confirmed after the period
                ends.
              </div>

              {/* Current user highlighted row */}
              <div className="bg-primary/5 border-y-2 border-primary/20">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-12 text-center">
                    <Badge variant="secondary" className="text-base px-2 py-1">
                      {currentUser.rank}
                    </Badge>
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback>{currentUser.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground flex items-center gap-2">
                      {currentUser.userName}
                      <Badge variant="outline" className="text-xs">
                        ✓
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">@_username</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">{currentUser.points.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Point</div>
                  </div>
                </div>
              </div>

              {/* Leaderboard header */}
              <div className="flex items-center gap-4 p-4 border-b border-border bg-muted/30">
                <div className="w-12 text-center text-xs font-semibold text-muted-foreground">Rank</div>
                <div className="flex-1 text-xs font-semibold text-muted-foreground">Name</div>
                <div className="text-right text-xs font-semibold text-muted-foreground">Point</div>
              </div>

              {/* Leaderboard list */}
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {allUsers.slice(0, 100).map((user) => (
                  <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors">
                    <div className="w-12 text-center">
                      {user.rank <= 3 ? (
                        <Badge
                          variant={user.rank === 1 ? "default" : "secondary"}
                          className={`text-base px-2 py-1 ${
                            user.rank === 1
                              ? "bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
                              : user.rank === 2
                              ? "bg-[#C0C0C0] text-black hover:bg-[#C0C0C0]/90"
                              : "bg-[#CD7F32] text-white hover:bg-[#CD7F32]/90"
                          }`}
                        >
                          {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : "🥉"}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">{user.rank}</span>
                      )}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        {user.userName}
                        {user.rank <= 10 && (
                          <Badge variant="outline" className="text-xs">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">@_username</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-foreground">
                        {user.points.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="p-0 m-0">
              <div className="p-8 text-center text-muted-foreground">Volume leaderboard data coming soon</div>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default Rebate;
