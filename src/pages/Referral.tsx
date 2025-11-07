import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, ChevronRight, HelpCircle } from "lucide-react";
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

// 模拟 Fee Rebate 数据
const mockFeeRebateRecords: RebateRecord[] = [
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

// 模拟 Mining Rebate 数据
const mockMiningRebateRecords: RebateRecord[] = [
  {
    id: "1",
    userName: "Jenny Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jenny",
    timestamp: "2025/12/12 12:23:12",
    amount: "12.12",
    currency: "SOC",
    ratio: "56%",
  },
  {
    id: "2",
    userName: "Jenny",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jenny2",
    timestamp: "2025/12/12 12:23:12",
    amount: "10.12",
    currency: "SOC",
    ratio: "56%",
  },
  {
    id: "3",
    userName: "Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wilson",
    timestamp: "2025/12/12 12:23:12",
    amount: "10.12",
    currency: "SOC",
    ratio: "8%",
  },
  {
    id: "4",
    userName: "Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wilson2",
    timestamp: "2025/12/12 12:23:12",
    amount: "10.12",
    currency: "SOC",
    ratio: "8%",
  },
  {
    id: "5",
    userName: "Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wilson3",
    timestamp: "2025/12/12 12:23:12",
    amount: "10.12",
    currency: "SOC",
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
  const navigate = useNavigate();
  const [rebateTab, setRebateTab] = useState<"fee" | "mining">("fee");
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ReferralRecord | null>(null);
  const [isRebateRecordsOpen, setIsRebateRecordsOpen] = useState(false);
  const [isReferralRecordsOpen, setIsReferralRecordsOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // 复制到剪贴板
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  // Claim 按钮处理
  const handleClaim = (type: "fee" | "mining", amount: number) => {
    const minAmount = 10;
    if (amount < minAmount) {
      toast({
        title: "Cannot Claim",
        description: `Claimable once it reaches ${minAmount} ${type === "fee" ? "USDT" : "SOC"}`,
        variant: "destructive",
      });
      return;
    }
    // 这里添加实际的 Claim 逻辑
    toast({
      title: "Success",
      description: "Claimed successfully!",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-4xl pb-24 md:pb-6">
        {/* 页面标题 - 桌面端显示 */}
        <div className="mb-6 hidden md:block">
          <h1 className="text-2xl font-bold text-foreground">Referral</h1>
        </div>

        {/* 返佣统计卡片 */}
        <Card className="p-6 mb-4 border border-border">
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

        {/* 可领取卡片 - 移动端优先 */}
        <Card className="p-6 mb-4 border border-border md:hidden">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">Claimable</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Fee Rebate</span>
                  <span className="text-base font-bold text-foreground">220.32 USDT</span>
                </div>
                <Button
                  size="sm"
                  className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4"
                  onClick={() => handleClaim("fee", 220.32)}
                >
                  Claim
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mining Rebate</span>
                  <span className="text-base font-bold text-foreground">9.32 SOC</span>
                </div>
                <Button
                  size="sm"
                  className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4"
                  onClick={() => handleClaim("mining", 9.32)}
                >
                  Claim
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Dashboard 按钮 - 移动端优先 */}
        <Card
          className="p-4 mb-4 border border-border cursor-pointer hover:bg-muted/50 transition-colors md:hidden"
          onClick={() => setIsDashboardOpen(true)}
        >
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-foreground">Dashboard</span>
            <div className="flex items-center text-muted-foreground">
              <ChevronRight className="w-5 h-5" />
              <ChevronRight className="w-5 h-5 -ml-2" />
            </div>
          </div>
        </Card>

        {/* 返佣等级 - 移动端 */}
        <Card className="p-6 mb-4 border border-border md:hidden">
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
              <button
                onClick={() => navigate("/referral/rules")}
                className="flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors"
              >
                <span>Rebate Reward Rules</span>
                <ChevronRight className="w-4 h-4" />
                <ChevronRight className="w-4 h-4 -ml-3" />
              </button>
            </div>
          </div>
        </Card>

        {/* 返佣等级和可领取卡片 - 桌面端布局 */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                <button
                  onClick={() => navigate("/referral/rules")}
                  className="flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors"
                >
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
                  <Button
                    size="sm"
                    className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4"
                    onClick={() => handleClaim("fee", 220.32)}
                  >
                    Claim
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Mining Rebate</span>
                    <span className="text-base font-bold text-foreground">9.32 SOC</span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4"
                    onClick={() => handleClaim("mining", 9.32)}
                  >
                    Claim
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Dashboard 按钮 - 仅桌面端显示 */}
        <Card
          className="p-4 mb-4 border border-border cursor-pointer hover:bg-muted/50 transition-colors hidden md:flex"
          onClick={() => setIsDashboardOpen(true)}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-base font-bold text-foreground">Dashboard</span>
            <div className="flex items-center text-muted-foreground">
              <ChevronRight className="w-5 h-5" />
              <ChevronRight className="w-5 h-5 -ml-2" />
            </div>
          </div>
        </Card>

        {/* 推荐链接和推荐码 - 仅桌面端显示 */}
        <Card className="p-6 mb-4 border border-border hidden md:block">
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
        <Card className="p-6 mb-4 border border-border">
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

            {/* Fee Rebate Tab */}
            <TabsContent value="fee" className="mt-0">
              {mockFeeRebateRecords.length === 0 ? (
                // 空状态
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <HelpCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No data yet</p>
                </div>
              ) : (
                <div>
                  {/* 桌面端：滚动显示所有记录 */}
                  <div className="hidden md:block">
                    <ScrollArea className="h-[340px] rounded-md pr-4">
                      <div className="space-y-0">
                        {mockFeeRebateRecords.map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between py-3 border-b border-border last:border-0"
                          >
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
                  </div>

                  {/* 移动端：只显示3条 + All Records */}
                  <div className="md:hidden">
                    <div className="space-y-0">
                      {mockFeeRebateRecords.slice(0, 3).map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between py-3 border-b border-border last:border-0"
                        >
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
                          <div className="text-right">
                            <p className="text-base font-bold text-foreground">
                              {record.amount} {record.currency}
                            </p>
                            <p className="text-xs text-muted-foreground">Ratio {record.ratio}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setIsRebateRecordsOpen(true)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
                    >
                      <span>All Records</span>
                      <ChevronRight className="w-4 h-4" />
                      <ChevronRight className="w-4 h-4 -ml-3" />
                    </button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Mining Rebate Tab */}
            <TabsContent value="mining" className="mt-0">
              {mockMiningRebateRecords.length === 0 ? (
                // 空状态
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <HelpCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No data yet</p>
                </div>
              ) : (
                <div>
                  {/* 桌面端：滚动显示所有记录 */}
                  <div className="hidden md:block">
                    <ScrollArea className="h-[340px] rounded-md pr-4">
                      <div className="space-y-0">
                        {mockMiningRebateRecords.map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between py-3 border-b border-border last:border-0"
                          >
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
                  </div>

                  {/* 移动端：只显示3条 + All Records */}
                  <div className="md:hidden">
                    <div className="space-y-0">
                      {mockMiningRebateRecords.slice(0, 3).map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between py-3 border-b border-border last:border-0"
                        >
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
                          <div className="text-right">
                            <p className="text-base font-bold text-foreground">
                              {record.amount} {record.currency}
                            </p>
                            <p className="text-xs text-muted-foreground">Ratio {record.ratio}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setIsRebateRecordsOpen(true)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
                    >
                      <span>All Records</span>
                      <ChevronRight className="w-4 h-4" />
                      <ChevronRight className="w-4 h-4 -ml-3" />
                    </button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* 推荐记录 */}
        <Card className="p-6 mb-4 border border-border">
          <h3 className="text-base font-bold text-foreground mb-2">Referral Records</h3>
          <p className="text-sm font-bold text-foreground mb-4">Total referrals: 20</p>

          {mockReferralRecords.length === 0 ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <HelpCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No data yet</p>
            </div>
          ) : (
            <div>
              {/* 桌面端：滚动显示所有记录 */}
              <div className="hidden md:block">
                <ScrollArea className="h-[340px] rounded-md pr-4">
                  <div className="space-y-0">
                    {mockReferralRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedUser(record)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <img src={record.avatar} alt={record.userName} className="w-11 h-11 rounded-full bg-muted" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-foreground">{record.userName}</p>
                            <p className="text-xs text-muted-foreground">{record.timestamp}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* 移动端：只显示3条 + All Records */}
              <div className="md:hidden">
                <div className="space-y-0">
                  {mockReferralRecords.slice(0, 3).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedUser(record)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <img src={record.avatar} alt={record.userName} className="w-11 h-11 rounded-full bg-muted" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-foreground">{record.userName}</p>
                          <p className="text-xs text-muted-foreground">{record.timestamp}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setIsReferralRecordsOpen(true)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
                >
                  <span>All Records</span>
                  <ChevronRight className="w-4 h-4" />
                  <ChevronRight className="w-4 h-4 -ml-3" />
                </button>
              </div>
            </div>
          )}
        </Card>
      </main>

      {/* 移动端底部固定 Refer 按钮 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border md:hidden z-20">
        <Button
          className="w-full bg-foreground text-background hover:bg-foreground/90 font-bold text-base py-6 rounded-full"
          onClick={() => setIsShareDialogOpen(true)}
        >
          Refer
        </Button>
      </div>

      {/* Dashboard 弹窗（桌面端）/ 全屏页面（移动端） */}
      <Dialog open={isDashboardOpen} onOpenChange={setIsDashboardOpen}>
        <DialogContent className="h-full w-full max-w-full md:max-w-md md:h-auto md:max-h-[calc(100vh-120px)] left-0 top-0 md:left-[50%] md:top-[50%] translate-x-0 translate-y-0 md:translate-x-[-50%] md:translate-y-[-50%] overflow-y-auto rounded-none md:rounded-lg p-0 gap-0 border-0 md:border">
          {/* 移动端标题栏 */}
          <div className="sticky top-0 z-10 bg-background border-b border-border md:hidden">
            <div className="flex items-center h-14 px-4">
              <button
                onClick={() => setIsDashboardOpen(false)}
                className="flex items-center justify-center w-8 h-8 -ml-2"
              >
                <ChevronRight className="w-5 h-5 rotate-180 text-foreground" />
              </button>
              <h2 className="flex-1 text-center text-base font-bold text-foreground pr-8">Dashboard</h2>
            </div>
          </div>

          {/* 桌面端标题 - 隐藏默认的关闭按钮 */}
          <DialogHeader className="hidden md:flex p-6 pb-4">
            <DialogTitle className="text-base font-bold">Dashboard</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4 md:px-6 md:pb-6 md:pt-0">
            {/* Referrals */}
            <Card className="p-4 border border-border bg-card">
              <h3 className="text-base font-bold text-foreground mb-4">Referrals</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Direct Referrals</span>
                  <span className="font-bold text-foreground">22</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Indirect Referrals</span>
                  <span className="font-bold text-foreground">220</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Referrals</span>
                  <span className="font-bold text-foreground">242</span>
                </div>
              </div>
            </Card>

            {/* Trading Volume */}
            <Card className="p-4 border border-border bg-card">
              <h3 className="text-base font-bold text-foreground mb-4">Trading Volume</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Direct Referrals</span>
                  <span className="font-bold text-foreground">22 USDT</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Indirect Referrals</span>
                  <span className="font-bold text-foreground">220 USDT</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Referrals</span>
                  <span className="font-bold text-foreground">242 USDT</span>
                </div>
              </div>
            </Card>

            {/* Fee Rebate */}
            <Card className="p-4 border border-border bg-card">
              <h3 className="text-base font-bold text-foreground mb-4">Fee Rebate</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Direct Referrals</span>
                  <span className="font-bold text-foreground">22 USDT</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Indirect Referrals</span>
                  <span className="font-bold text-foreground">220 USDT</span>
                </div>
              </div>
            </Card>

            {/* Mining Rebate */}
            <Card className="p-4 border border-border bg-card">
              <h3 className="text-base font-bold text-foreground mb-4">Mining Rebate</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Direct Referrals</span>
                  <span className="font-bold text-foreground">22 SOC</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Indirect Referrals</span>
                  <span className="font-bold text-foreground">220 SOC</span>
                </div>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* 二级弹窗：用户的推荐记录（桌面端弹窗 / 移动端全屏） */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="h-full w-full max-w-full md:max-w-md md:h-auto md:max-h-[calc(100vh-120px)] left-0 top-0 md:left-[50%] md:top-[50%] translate-x-0 translate-y-0 md:translate-x-[-50%] md:translate-y-[-50%] overflow-y-auto rounded-none md:rounded-lg p-0 gap-0 border-0 md:border">
          {/* 移动端标题栏 */}
          <div className="sticky top-0 z-10 bg-background border-b border-border md:hidden">
            <div className="flex items-center h-14 px-4">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex items-center justify-center w-8 h-8 -ml-2"
              >
                <ChevronRight className="w-5 h-5 rotate-180 text-foreground" />
              </button>
              <h2 className="flex-1 text-center text-base font-bold text-foreground pr-8">
                {selectedUser?.userName}'s Referral Records
              </h2>
            </div>
          </div>

          {/* 桌面端标题 */}
          <DialogHeader className="hidden md:flex md:mb-4 p-6 pb-4">
            <div className="flex items-center gap-3">
              <img
                src={selectedUser?.avatar || ""}
                alt={selectedUser?.userName || ""}
                className="w-10 h-10 rounded-full bg-muted"
              />
              <DialogTitle className="text-base font-bold">{selectedUser?.userName}'s Referral Records</DialogTitle>
            </div>
          </DialogHeader>

          <div className="p-4 md:px-6 md:pb-6 md:pt-0">
            <p className="text-sm font-bold text-foreground mb-4">Total referrals: 20</p>
            
            <div className="space-y-0">
              {mockReferralRecords.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedUser(record)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <img src={record.avatar} alt={record.userName} className="w-11 h-11 rounded-full bg-muted" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{record.userName}</p>
                      <p className="text-xs text-muted-foreground">{record.timestamp}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 返佣记录全屏页面（移动端） */}
      <Dialog open={isRebateRecordsOpen} onOpenChange={setIsRebateRecordsOpen}>
        <DialogContent className="h-full w-full max-w-full left-0 top-0 translate-x-0 translate-y-0 overflow-y-auto rounded-none p-0 gap-0 border-0">
          {/* 标题栏 */}
          <div className="sticky top-0 z-10 bg-background border-b border-border">
            <div className="flex items-center h-14 px-4">
              <button
                onClick={() => setIsRebateRecordsOpen(false)}
                className="flex items-center justify-center w-8 h-8 -ml-2"
              >
                <ChevronRight className="w-5 h-5 rotate-180 text-foreground" />
              </button>
              <h2 className="flex-1 text-center text-base font-bold text-foreground pr-8">Rebate Records</h2>
            </div>
          </div>

          <div className="p-4">
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

              {/* Fee Rebate Tab */}
              <TabsContent value="fee" className="mt-0">
                {mockFeeRebateRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <HelpCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No data yet</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {mockFeeRebateRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      >
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
                        <div className="text-right">
                          <p className="text-base font-bold text-foreground">
                            {record.amount} {record.currency}
                          </p>
                          <p className="text-xs text-muted-foreground">Ratio {record.ratio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Mining Rebate Tab */}
              <TabsContent value="mining" className="mt-0">
                {mockMiningRebateRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <HelpCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No data yet</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {mockMiningRebateRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      >
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
                        <div className="text-right">
                          <p className="text-base font-bold text-foreground">
                            {record.amount} {record.currency}
                          </p>
                          <p className="text-xs text-muted-foreground">Ratio {record.ratio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* 推荐记录全屏页面（移动端） */}
      <Dialog open={isReferralRecordsOpen} onOpenChange={setIsReferralRecordsOpen}>
        <DialogContent className="h-full w-full max-w-full left-0 top-0 translate-x-0 translate-y-0 overflow-y-auto rounded-none p-0 gap-0 border-0">
          {/* 标题栏 */}
          <div className="sticky top-0 z-10 bg-background border-b border-border">
            <div className="flex items-center h-14 px-4">
              <button
                onClick={() => setIsReferralRecordsOpen(false)}
                className="flex items-center justify-center w-8 h-8 -ml-2"
              >
                <ChevronRight className="w-5 h-5 rotate-180 text-foreground" />
              </button>
              <h2 className="flex-1 text-center text-base font-bold text-foreground pr-8">Referral Records</h2>
            </div>
          </div>

          <div className="p-4">
            <p className="text-sm font-bold text-foreground mb-4">Total referrals: 20</p>
            
            <div className="space-y-0">
              {mockReferralRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setIsReferralRecordsOpen(false);
                    setSelectedUser(record);
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <img src={record.avatar} alt={record.userName} className="w-11 h-11 rounded-full bg-muted" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{record.userName}</p>
                      <p className="text-xs text-muted-foreground">{record.timestamp}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 分享弹窗 - 底部弹出 */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-full w-full p-0 gap-0 bottom-0 top-auto left-0 translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none border-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom">
          {/* 顶部拖动条 */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-border rounded-full"></div>
          </div>

          {/* 标题 */}
          <div className="text-center py-4 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">Share</h2>
          </div>

          <div className="p-4 pb-8">
            {/* Referral Link */}
            <div className="bg-card border border-border rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Referral link</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Soc……92VA</span>
                  <button
                    onClick={() => copyToClipboard("https://socrates.com/ref/92VA", "Referral link")}
                    className="text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Referral Code */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Referral code</span>
                <div className="flex items-center gap-2">
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

            {/* 社交媒体分享选项 */}
            <div className="flex items-center justify-between mb-6 px-2">
              {/* Copy link */}
              <button
                onClick={() => {
                  copyToClipboard("https://socrates.com/ref/92VA", "Referral link");
                  setIsShareDialogOpen(false);
                }}
                className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <Copy className="w-6 h-6 text-foreground" />
                </div>
                <span className="text-xs text-foreground">Copy link</span>
              </button>

              {/* X (Twitter) */}
              <button
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent("https://socrates.com/ref/92VA")}&text=${encodeURIComponent("Join me on Socrates!")}`, '_blank');
                  setIsShareDialogOpen(false);
                }}
                className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-xs text-foreground">X</span>
              </button>

              {/* Telegram */}
              <button
                onClick={() => {
                  window.open(`https://t.me/share/url?url=${encodeURIComponent("https://socrates.com/ref/92VA")}&text=${encodeURIComponent("Join me on Socrates!")}`, '_blank');
                  setIsShareDialogOpen(false);
                }}
                className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-14 h-14 rounded-full bg-[#0088cc] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                </div>
                <span className="text-xs text-foreground">Telegram</span>
              </button>

              {/* Messages */}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Join Socrates",
                      text: "Join me on Socrates prediction market!",
                      url: "https://socrates.com/ref/92VA",
                    });
                  }
                  setIsShareDialogOpen(false);
                }}
                className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-14 h-14 rounded-full bg-[#00B900] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                  </svg>
                </div>
                <span className="text-xs text-foreground">Messages</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => {
                  window.open(`https://wa.me/?text=${encodeURIComponent("Join me on Socrates! https://socrates.com/ref/92VA")}`, '_blank');
                  setIsShareDialogOpen(false);
                }}
                className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span className="text-xs text-foreground">Whatsapp</span>
              </button>

              {/* More */}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Join Socrates",
                      text: "Join me on Socrates prediction market!",
                      url: "https://socrates.com/ref/92VA",
                    });
                  }
                  setIsShareDialogOpen(false);
                }}
                className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <svg className="w-6 h-6 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </div>
                <span className="text-xs text-foreground">More</span>
              </button>
            </div>

            {/* Cancel Button */}
            <Button
              variant="outline"
              className="w-full border-border text-foreground hover:bg-muted font-medium text-base py-6 rounded-full"
              onClick={() => setIsShareDialogOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Referral;

