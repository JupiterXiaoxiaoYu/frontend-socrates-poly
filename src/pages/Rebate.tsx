import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMockMiningList, getMockFeeList } from "@/mocks/rebate";
import RankBadge from "@/components/rebate/RankBadge";
import VerifiedIcon from "@/components/rebate/VerifiedIcon";

const Rebate = () => {
  const { t } = useTranslation('rebate');
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
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <button
            onClick={() => navigate("/rebate/rules")}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-border hover:bg-muted transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* My Points 卡片 */}
        <Card
          className="p-4 border border-border mb-4 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => navigate("/rebate/points-history")}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-1">{t('myPoints')}</div>
              <div className="text-3xl font-bold text-foreground">{currentUser.points.toFixed(2)}</div>
            </div>
            <ChevronRight className="w-6 h-6 text-muted-foreground" />
          </div>
        </Card>

        {/* Current user stats card */}
        <Card className="p-6 border border-border mb-6">
          {/* 本期时间 */}
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-1">{t('currentPeriod')}</div>
            <div className="text-sm font-medium text-foreground">{currentUser.period}</div>
          </div>

          {/* Point Pool */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">{t('makerPointPool')}</div>
              <div className="text-lg font-semibold text-foreground">{currentUser.makerPool.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">{t('takerPointPool')}</div>
              <div className="text-lg font-semibold text-foreground">{currentUser.takerPool.toLocaleString()}</div>
            </div>
          </div>

          {/* 分割线 */}
          <div className="border-t border-border my-4" />

          {/* 我的预计积分 */}
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">{t('myEstimatedPoints')}</div>
            <div className="text-3xl font-bold text-foreground">{currentUser.expectedPoints.toFixed(2)}</div>
          </div>

          {/* 成交量 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">{t('makerVolume')}</div>
              <div className="text-lg font-semibold text-foreground">${currentUser.makerVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">{t('takerVolume')}</div>
              <div className="text-lg font-semibold text-foreground">${currentUser.takerVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div
            className="text-sm text-[#f59e0b] cursor-pointer hover:underline"
            onClick={() => navigate("/rebate/volume-records")}
          >
            {t('common:button.viewRecords', 'View Records')}
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
                    {t('pointsLeaderboard')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="transactions"
                    className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
                  >
                    {t('volumeLeaderboard')}
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="points" className="p-0 m-0">
              <div className="p-4 text-sm text-muted-foreground">
                {t('estimatedPointsRankingDesc')}
              </div>

              {/* Current user highlighted row */}
              <div className="bg-[#FFF9E6] dark:bg-[#2A2416] px-4 py-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 flex items-center justify-center">
                    <RankBadge rank={currentUser.rank} />
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback>{currentUser.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      {currentUser.userName}
                      <VerifiedIcon />
                    </div>
                    <div className="text-xs text-muted-foreground">@_username</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-foreground">{currentUser.points.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>
              </div>

              {/* Leaderboard header */}
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-9 text-xs font-semibold text-muted-foreground">{t('rank')}</div>
                <div className="flex-1 text-xs font-semibold text-muted-foreground">{t('name')}</div>
                <div className="text-right text-xs font-semibold text-muted-foreground">{t('points')}</div>
              </div>

              {/* Leaderboard list */}
              <div className="max-h-[600px] overflow-y-auto">
                {allUsers.slice(0, 100).map((user) => (
                  <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="w-9 flex items-center justify-center">
                      <RankBadge rank={user.rank} />
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        {user.userName}
                        {user.rank <= 10 && <VerifiedIcon />}
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
              <div className="p-4 text-sm text-muted-foreground">
                {t('highestVolumeDesc')}
              </div>

              {/* Current user highlighted row */}
              <div className="bg-[#FFF9E6] dark:bg-[#2A2416] px-4 py-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 flex items-center justify-center">
                    <RankBadge rank={currentUser.rank} />
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback>{currentUser.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      {currentUser.userName}
                      <VerifiedIcon />
                    </div>
                    <div className="text-xs text-muted-foreground">@_username</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">${currentUser.makerVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="text-sm font-bold text-foreground">${currentUser.takerVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>
              </div>

              {/* Leaderboard header */}
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-9 text-xs font-semibold text-muted-foreground">{t('rank')}</div>
                <div className="flex-1 text-xs font-semibold text-muted-foreground">{t('name')}</div>
                <div className="text-right text-xs font-semibold text-muted-foreground">{t('makerTaker')}</div>
              </div>

              {/* Leaderboard list */}
              <div className="max-h-[600px] overflow-y-auto">
                {allUsers.slice(0, 100).map((user) => (
                  <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="w-9 flex items-center justify-center">
                      <RankBadge rank={user.rank} />
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        {user.userName}
                        {user.rank <= 10 && <VerifiedIcon />}
                      </div>
                      <div className="text-xs text-muted-foreground">@_username</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">
                        ${(user.points * 10).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        ${(user.points * 10).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default Rebate;
