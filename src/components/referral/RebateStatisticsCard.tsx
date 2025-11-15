import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

// 返佣统计卡片组件
const RebateStatisticsCard = () => {
  const { t } = useTranslation('referral');
  return (
    <Card className="relative z-30 p-6 mb-4 border border-border bg-card">
      <div className="flex items-center justify-center gap-8">
        {/* Fee Rebate */}
        <div className="flex-1 text-center">
          <div className="flex items-baseline justify-center gap-1 mb-3">
            <span className="text-3xl font-bold text-foreground">220.32</span>
            <span className="text-sm font-bold text-muted-foreground">USDC</span>
          </div>
          <p className="text-sm text-muted-foreground">{t('feeRebate')}</p>
        </div>

        {/* 分隔线 */}
        <div className="h-8 w-px bg-border" />

        {/* Mining Rebate */}
        <div className="flex-1 text-center">
          <div className="flex items-baseline justify-center gap-1 mb-3">
            <span className="text-3xl font-bold text-foreground">220.32</span>
            <span className="text-sm font-bold text-muted-foreground">SOC</span>
          </div>
          <p className="text-sm text-muted-foreground">{t('miningRebate')}</p>
        </div>
      </div>
    </Card>
  );
};

export default RebateStatisticsCard;

