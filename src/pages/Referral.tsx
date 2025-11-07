import { useState } from "react";
import Header from "../components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, ChevronRight } from "lucide-react";
import { useToast } from "../hooks/use-toast";

// 返佣记录数据类型
interface RebateRecord {
  id: string;
  userName: string;
  avatar: string;
  timestamp: string;
  amount: string;
  currency: string;
  ratio: string;
}

// 推荐记录数据类型
interface ReferralRecord {
  id: string;
  userName: string;
  avatar: string;
  timestamp: string;
}

// 模拟数据
const mockRebateRecords: RebateRecord[] = [
  {
    id: "1",
    userName: "Jenny Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jenny",
    timestamp: "2025/12/12 12:23:12",
    amount: "9.12",
    currency: "USDT",
    ratio: "56%",
  },
  {
    id: "2",
    userName: "Jenny",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jenny2",
    timestamp: "2025/12/12 12:23:12",
    amount: "10.12",
    currency: "USDT",
    ratio: "56%",
  },
  {
    id: "3",
    userName: "Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wilson",
    timestamp: "2025/12/12 12:23:12",
    amount: "10.12",
    currency: "USDT",
    ratio: "56%",
  },
  {
    id: "4",
    userName: "Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wilson2",
    timestamp: "2025/12/12 12:23:12",
    amount: "10.12",
    currency: "USDT",
    ratio: "56%",
  },
  {
    id: "5",
    userName: "Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wilson3",
    timestamp: "2025/12/12 12:23:12",
    amount: "10.12",
    currency: "USDT",
    ratio: "8%",
  },
];

const mockReferralRecords: ReferralRecord[] = [
  {
    id: "1",
    userName: "Jenny Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jenny",
    timestamp: "2025/12/12 12:23:12",
  },
  {
    id: "2",
    userName: "Jenny",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jenny2",
    timestamp: "2025/12/12 12:23:12",
  },
  {
    id: "3",
    userName: "Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wilson",
    timestamp: "2025/12/12 12:23:12",
  },
  {
    id: "4",
    userName: "Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wilson2",
    timestamp: "2025/12/12 12:23:12",
  },
  {
    id: "5",
    userName: "Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wilson3",
    timestamp: "2025/12/12 12:23:12",
  },
];

const Referral = () => {
  const { toast } = useToast();
  const [rebateTab, setRebateTab] = useState<"fee" | "mining">("fee");

  // 复制到剪贴板
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Referral</h1>
        </div>

        {/* 返佣统计卡片 */}
        <Card className="p-6 mb-10 border border-border shadow-lg">
          <div className="flex items-center justify-center gap-8">
            {/* Fee Rebate */}
            <div className="flex-1 text-center">
              <div className="flex items-baseline justify-center gap-1 mb-3">
                <span className="text-3xl font-bold text-foreground">220.32</span>
                <span className="text-sm font-bold text-muted-foreground">USDT</span>
              </div>
              <p className="text-sm text-muted-foreground">Fee Rebate</p>
            </div>

            {/* 分隔线 */}
            <div className="h-8 w-px bg-border" />

            {/* Mining Rebate */}
            <div className="flex-1 text-center">
              <div className="flex items-baseline justify-center gap-1 mb-3">
                <span className="text-3xl font-bold text-foreground">220.32</span>
                <span className="text-sm font-bold text-muted-foreground">SOC</span>
              </div>
              <p className="text-sm text-muted-foreground">Mining Rebate</p>
            </div>
          </div>
        </Card>

        {/* 返佣等级和可领取卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* 返佣等级 */}
          <Card className="p-6 border border-border">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Rebate Level: S0</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Lv.1 rebate rate</span>
                  <span className="text-base font-bold text-foreground">56%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Lv.2 rebate rate</span>
                  <span className="text-base font-bold text-foreground">14%</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <button className="flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors">
                  <span>Rebate Reward Rules</span>
                  <ChevronRight className="w-4 h-4" />
                  <ChevronRight className="w-4 h-4 -ml-3" />
                </button>
              </div>
            </div>
          </Card>

          {/* 可领取 */}
          <Card className="p-6 border border-border">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Claimable</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Fee Rebate</span>
                    <span className="text-base font-bold text-foreground">220.32 USDT</span>
                  </div>
                  <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4">
                    Claim
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Mining Rebate</span>
                    <span className="text-base font-bold text-foreground">9.32 SOC</span>
                  </div>
                  <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4">
                    Claim
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Dashboard 按钮 */}
        <Card className="p-4 mb-8 border border-border cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-foreground">Dashboard</span>
            <div className="flex items-center text-muted-foreground">
              <ChevronRight className="w-5 h-5" />
              <ChevronRight className="w-5 h-5 -ml-2" />
            </div>
          </div>
        </Card>

        {/* 推荐链接和推荐码 */}
        <Card className="p-6 mb-8 border border-border">
          <h3 className="text-base font-bold text-foreground mb-4">Referral</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Referral link */}
            <div className="bg-muted rounded-2xl p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Referral link</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">Soc……92VA</span>
                <button
                  onClick={() => copyToClipboard("https://socrates.com/ref/92VA", "Referral link")}
                  className="text-foreground hover:text-muted-foreground transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Referral code */}
            <div className="bg-muted rounded-2xl p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Referral code</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">AKV392VA</span>
                <button
                  onClick={() => copyToClipboard("AKV392VA", "Referral code")}
                  className="text-foreground hover:text-muted-foreground transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* 返佣记录 */}
        <Card className="p-6 mb-8 border border-border">
          <h3 className="text-base font-bold text-foreground mb-4">Rebate Records</h3>

          {/* Tab 切换 */}
          <Tabs value={rebateTab} onValueChange={(v) => setRebateTab(v as "fee" | "mining")} className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-border rounded-none mb-4">
              <TabsTrigger
                value="fee"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
              >
                Fee Rebate
              </TabsTrigger>
              <TabsTrigger
                value="mining"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
              >
                Mining Rebate
              </TabsTrigger>
            </TabsList>

            <TabsContent value={rebateTab} className="mt-0">
              {/* 固定高度的滚动区域，最多显示5行 */}
              <ScrollArea className="h-[340px] relative">
                <div className="space-y-0">
                  {mockRebateRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      {/* 左侧：头像和信息 */}
                      <div className="flex items-center gap-3">
                        <img
                          src={record.avatar}
                          alt={record.userName}
                          className="w-11 h-11 rounded-full bg-muted"
                        />
                        <div>
                          <p className="text-sm font-bold text-foreground">{record.userName}</p>
                          <p className="text-xs text-muted-foreground">{record.timestamp}</p>
                        </div>
                      </div>

                      {/* 右侧：金额和比率 */}
                      <div className="text-right">
                        <p className="text-base font-bold text-foreground">
                          {record.amount} {record.currency}
                        </p>
                        <p className="text-xs text-muted-foreground">Ratio {record.ratio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>

        {/* 推荐记录 */}
        <Card className="p-6 border border-border">
          <h3 className="text-base font-bold text-foreground mb-2">Referral Records</h3>
          <p className="text-sm font-bold text-foreground mb-4">Total referrals: 20</p>

          {/* 固定高度的滚动区域，最多显示5行 */}
          <ScrollArea className="h-[340px] relative">
            <div className="space-y-0">
              {mockReferralRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  {/* 左侧：头像和信息 */}
                  <div className="flex items-center gap-3 flex-1">
                    <img src={record.avatar} alt={record.userName} className="w-11 h-11 rounded-full bg-muted" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{record.userName}</p>
                      <p className="text-xs text-muted-foreground">{record.timestamp}</p>
                    </div>
                  </div>

                  {/* 右侧：箭头 */}
                  <ChevronRight className="w-6 h-6 text-muted-foreground" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </main>
    </div>
  );
};

export default Referral;

