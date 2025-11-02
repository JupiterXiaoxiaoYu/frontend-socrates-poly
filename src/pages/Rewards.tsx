import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle } from "lucide-react";

interface RewardItem {
  id: number;
  timestamp: string;
  market: string;
  amount: number;
  type: "Maker" | "Creator";
  status: "待领取" | "已领取";
}

const mockRewards: RewardItem[] = [
  {
    id: 1,
    timestamp: "2024-12-31 14:32:00",
    market: "Ethereum above $4,500 on December 31?",
    amount: 12.32,
    type: "Maker",
    status: "待领取",
  },
  {
    id: 2,
    timestamp: "2024-12-31 14:32:00",
    market: "Ethereum above $4,500 on December 31?Ethereum above $4,500 on December 31?",
    amount: 12.32,
    type: "Creator",
    status: "待领取",
  },
  {
    id: 3,
    timestamp: "2024-12-31 14:32:00",
    market: "Ethereum above $4,500 on December 31?Ethereum above $4,500 on December 31?",
    amount: 12.32,
    type: "Creator",
    status: "已领取",
  },
];

const Rewards = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Rewards</h1>

        {/* Summary Card */}
        <Card className="p-6 border border-border mb-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">Cumulative Rewards USDC</span>
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold text-foreground">3,950.22</div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <div className="text-sm text-muted-foreground mb-2">Current Claimable USDC</div>
              <div className="text-3xl font-bold text-foreground">123.12</div>
            </div>

            <div className="flex items-center">
              <Button className="bg-foreground text-background hover:bg-foreground/90 px-12 h-12 text-base">
                Claim
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Card className="border border-border">
          <Tabs defaultValue="details" className="w-full">
            <div className="border-b border-border">
              <div className="px-4">
                <TabsList className="bg-transparent border-0 h-auto p-0">
                  <TabsTrigger
                    value="details"
                    className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
                  >
                    Reward Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="records"
                    className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
                  >
                    Claim Records
                  </TabsTrigger>
                  <TabsTrigger
                    value="rules"
                    className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
                  >
                    View Rules
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="details" className="p-0 m-0">
              <div className="divide-y divide-border">
                {mockRewards.map((reward) => (
                  <div key={reward.id} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs text-muted-foreground">{reward.timestamp}</span>
                          <Badge variant="secondary" className="text-xs">
                            {reward.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-foreground mb-2 line-clamp-2">{reward.market}</div>
                        <div className="text-base font-semibold text-[#f59e0b]">{reward.amount.toFixed(2)} USDC</div>
                      </div>
                      <div className="flex-shrink-0">
                        {reward.status === "待领取" ? (
                          <Button variant="link" className="text-foreground h-auto p-0 text-sm">
                            Claimable
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Claimed</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="records" className="p-8">
              <div className="text-center text-muted-foreground">No claim records yet</div>
            </TabsContent>

            <TabsContent value="rules" className="p-8">
              <div className="space-y-4 text-sm text-foreground">
                <h3 className="font-semibold text-base">Reward Rules</h3>
                <p>1. Market creators will receive a percentage of trading volume as rewards</p>
                <p>2. Market makers earn rewards by providing liquidity</p>
                <p>3. Rewards are distributed in USDC and can be claimed at any time</p>
                <p>4. Claimed rewards will be displayed in the claim records</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default Rewards;
