import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "../hooks/use-toast";
import Header from "../components/Header";

// 导入拆分后的组件
import RebateStatisticsCard from "../components/referral/RebateStatisticsCard";
import ClaimableCard from "../components/referral/ClaimableCard";
import DashboardButton from "../components/referral/DashboardButton";
import RebateLevelCard from "../components/referral/RebateLevelCard";
import ReferralLinkCard from "../components/referral/ReferralLinkCard";
import RebateRecordsCard, { RebateRecord } from "../components/referral/RebateRecordsCard";
import ReferralRecordsCard, { ReferralRecord } from "../components/referral/ReferralRecordsCard";
import DashboardDialog from "../components/referral/DashboardDialog";
import ReferralRecordsDialog from "../components/referral/ReferralRecordsDialog";
import { AllRebateRecordsDialog, AllReferralRecordsDialog } from "../components/referral/AllRecordsDialog";
import ShareDialog from "../components/referral/ShareDialog";

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

// 模拟推荐记录数据
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
  
  // 状态管理
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
        <RebateStatisticsCard />

        {/* 可领取卡片 - 移动端优先 */}
        <ClaimableCard onClaim={handleClaim} className="md:hidden" />

        {/* Dashboard 按钮 - 移动端优先 */}
        <DashboardButton onClick={() => setIsDashboardOpen(true)} className="md:hidden" />

        {/* 返佣等级 - 移动端 */}
        <RebateLevelCard onRulesClick={() => navigate("/referral/rules")} className="md:hidden" />

        {/* 返佣等级和可领取卡片 - 桌面端布局 */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <RebateLevelCard onRulesClick={() => navigate("/referral/rules")} className="!mb-0" />
          <ClaimableCard onClaim={handleClaim} className="!mb-0" />
        </div>

        {/* Dashboard 按钮 - 仅桌面端显示 */}
        <DashboardButton onClick={() => setIsDashboardOpen(true)} className="hidden md:flex" />

        {/* 推荐链接和推荐码 - 仅桌面端显示 */}
        <ReferralLinkCard onCopy={copyToClipboard} className="hidden md:block" />

        {/* 返佣记录 */}
        <RebateRecordsCard
          feeRebateRecords={mockFeeRebateRecords}
          miningRebateRecords={mockMiningRebateRecords}
          activeTab={rebateTab}
          onTabChange={setRebateTab}
          onShowAllRecords={() => setIsRebateRecordsOpen(true)}
        />

        {/* 推荐记录 */}
        <ReferralRecordsCard
          records={mockReferralRecords}
          totalReferrals={20}
          onRecordClick={setSelectedUser}
          onShowAllRecords={() => setIsReferralRecordsOpen(true)}
        />
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

      {/* Dashboard 弹窗 */}
      <DashboardDialog open={isDashboardOpen} onOpenChange={setIsDashboardOpen} />

      {/* 推荐记录详情弹窗（动态内容切换） */}
      <ReferralRecordsDialog
        open={!!selectedUser}
        selectedUser={selectedUser}
        records={mockReferralRecords}
        onOpenChange={(open) => !open && setSelectedUser(null)}
        onRecordClick={setSelectedUser}
      />

      {/* 全部返佣记录页面（移动端） */}
      <AllRebateRecordsDialog
        open={isRebateRecordsOpen}
        onOpenChange={setIsRebateRecordsOpen}
        activeTab={rebateTab}
        onTabChange={setRebateTab}
        feeRebateRecords={mockFeeRebateRecords}
        miningRebateRecords={mockMiningRebateRecords}
      />

      {/* 全部推荐记录页面（移动端） */}
      <AllReferralRecordsDialog
        open={isReferralRecordsOpen}
        onOpenChange={setIsReferralRecordsOpen}
        records={mockReferralRecords}
        totalReferrals={20}
        onRecordClick={setSelectedUser}
      />

      {/* 分享弹窗 */}
      <ShareDialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen} onCopy={copyToClipboard} />
    </div>
  );
};

export default Referral;
