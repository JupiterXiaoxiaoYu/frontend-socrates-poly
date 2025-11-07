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

        {/* Dashboard 按钮 */}
        <Card
          className="p-4 mb-8 border border-border cursor-pointer hover:bg-muted/50 transition-colors"
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
                // 固定高度的滚动区域，最多显示5行
                <ScrollArea className="h-[340px] rounded-md pr-4">
                  <div className="space-y-0">
                    {mockFeeRebateRecords.map((record) => (
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
                // 固定高度的滚动区域，最多显示5行
                <ScrollArea className="h-[340px] rounded-md pr-4">
                  <div className="space-y-0">
                    {mockMiningRebateRecords.map((record) => (
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
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* 推荐记录 */}
        <Card className="p-6 border border-border">
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
            // 固定高度的滚动区域，最多显示5行
            <ScrollArea className="h-[340px] rounded-md pr-4">
              <div className="space-y-0">
                {mockReferralRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedUser(record)}
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
          )}
        </Card>
      </main>

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
    </div>
  );
};

export default Referral;

