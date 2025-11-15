import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import { Card } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

const ReferralRules = () => {
  const { t } = useTranslation('referral');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* 主导航栏 */}
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 返回按钮和标题 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">{t('rulesPageTitle')}</h1>
        </div>
        <Card className="p-6 border border-border">
          {/* Overview */}
          <div className="mb-10">
            <p className="text-2xl font-bold text-foreground leading-relaxed whitespace-pre-wrap">
              {t('rulesOverview')}
            </p>
          </div>

          {/* I. Terms & Roles */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">{t('termsRoles')}</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-foreground">
              <li>{t('tradeAmount')}</li>
              <li>{t('fee')}</li>
              <li>{t('platform')}</li>
              <li>{t('publicPool')}</li>
              <li>{t('market')}</li>
              <li>{t('l1Direct')}</li>
              <li>{t('l2Upline')}</li>
              <li>{t('level')}</li>
            </ul>
          </div>

          {/* II. Fee Rate & Macro Split (Fixed) */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">{t('feeRateMacro')}</h2>
            <ol className="list-decimal pl-6 space-y-2 text-sm text-foreground mb-4">
              <li>{t('tradingFee')}</li>
              <li>{t('allocation')}</li>
              <li>{t('exampleVolume')}</li>
            </ol>
            <ul className="list-disc pl-12 space-y-2 text-sm text-foreground mb-4">
              <li>{t('feeAmount')}</li>
              <li>{t('platformAmount')}</li>
              <li>{t('publicPoolBaseline')}</li>
              <li>{t('marketMax')}</li>
            </ul>
            <p className="text-sm text-muted-foreground pl-6">
              {t('noteFixed')}
            </p>
          </div>

          {/* III. Fee Rebate Caps by Level */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {t('feeRebateCaps')}
            </h2>
            <p className="text-sm text-foreground mb-4">{t('exampleFees')}</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-bold text-foreground">{t('rebateLevel')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('totalRebateCap')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('l1CapPercent')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('l1Amount')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('l2CapPercent')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('l2Amount')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('marketDistributed')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('publicPoolFinalInflow')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('platform')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S0</td>
                    <td className="p-3">70%</td>
                    <td className="p-3">56%</td>
                    <td className="p-3">112</td>
                    <td className="p-3">14%</td>
                    <td className="p-3">28</td>
                    <td className="p-3">140</td>
                    <td className="p-3">20</td>
                    <td className="p-3">40</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S1</td>
                    <td className="p-3">60%</td>
                    <td className="p-3">48%</td>
                    <td className="p-3">96</td>
                    <td className="p-3">12%</td>
                    <td className="p-3">24</td>
                    <td className="p-3">120</td>
                    <td className="p-3">40</td>
                    <td className="p-3">40</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S2</td>
                    <td className="p-3">50%</td>
                    <td className="p-3">40%</td>
                    <td className="p-3">80</td>
                    <td className="p-3">10%</td>
                    <td className="p-3">20</td>
                    <td className="p-3">100</td>
                    <td className="p-3">60</td>
                    <td className="p-3">40</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S3</td>
                    <td className="p-3">40%</td>
                    <td className="p-3">32%</td>
                    <td className="p-3">64</td>
                    <td className="p-3">8%</td>
                    <td className="p-3">16</td>
                    <td className="p-3">80</td>
                    <td className="p-3">80</td>
                    <td className="p-3">40</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S4</td>
                    <td className="p-3">30%</td>
                    <td className="p-3">24%</td>
                    <td className="p-3">48</td>
                    <td className="p-3">6%</td>
                    <td className="p-3">12</td>
                    <td className="p-3">60</td>
                    <td className="p-3">100</td>
                    <td className="p-3">40</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S5</td>
                    <td className="p-3">20%</td>
                    <td className="p-3">16%</td>
                    <td className="p-3">32</td>
                    <td className="p-3">4%</td>
                    <td className="p-3">8</td>
                    <td className="p-3">40</td>
                    <td className="p-3">120</td>
                    <td className="p-3">40</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* IV. SOC Token Rebate Caps by Level */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {t('socTokenRebate')}
            </h2>
            <p className="text-sm text-foreground mb-4">
              {t('exampleSOC')}
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-bold text-foreground">{t('rebateLevel')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('totalRebateCap')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('userBaseReward')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('l1CapPercent')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('l1AmountSOC')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('l2CapPercent')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('l2AmountSOC')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('marketDistributedSOC')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('publicPoolInflowSOC')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S0</td>
                    <td className="p-3">70%</td>
                    <td className="p-3">800</td>
                    <td className="p-3">56%</td>
                    <td className="p-3">112</td>
                    <td className="p-3">14%</td>
                    <td className="p-3">28</td>
                    <td className="p-3">140</td>
                    <td className="p-3">50% / 80</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S1</td>
                    <td className="p-3">60%</td>
                    <td className="p-3">800</td>
                    <td className="p-3">48%</td>
                    <td className="p-3">96</td>
                    <td className="p-3">12%</td>
                    <td className="p-3">24</td>
                    <td className="p-3">120</td>
                    <td className="p-3">40% / 80</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S2</td>
                    <td className="p-3">50%</td>
                    <td className="p-3">800</td>
                    <td className="p-3">40%</td>
                    <td className="p-3">80</td>
                    <td className="p-3">10%</td>
                    <td className="p-3">20</td>
                    <td className="p-3">100</td>
                    <td className="p-3">50% / 100</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S3</td>
                    <td className="p-3">40%</td>
                    <td className="p-3">800</td>
                    <td className="p-3">32%</td>
                    <td className="p-3">64</td>
                    <td className="p-3">8%</td>
                    <td className="p-3">16</td>
                    <td className="p-3">80</td>
                    <td className="p-3">60% / 120</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S4</td>
                    <td className="p-3">30%</td>
                    <td className="p-3">800</td>
                    <td className="p-3">24%</td>
                    <td className="p-3">48</td>
                    <td className="p-3">6%</td>
                    <td className="p-3">12</td>
                    <td className="p-3">60</td>
                    <td className="p-3">70% / 140</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S5</td>
                    <td className="p-3">20%</td>
                    <td className="p-3">800</td>
                    <td className="p-3">16%</td>
                    <td className="p-3">32</td>
                    <td className="p-3">4%</td>
                    <td className="p-3">8</td>
                    <td className="p-3">40</td>
                    <td className="p-3">80% / 160</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* V. Upgrade Thresholds & Downgrade Rules */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {t('upgradeThresholds')}
            </h2>
            <p className="text-sm text-foreground mb-4">
              {t('volumeReset')}
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-bold text-foreground">{t('rebateLevel')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('totalRebateCap')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('l1CapPercent')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('l2CapPercent')}</th>
                    <th className="text-left p-3 font-bold text-foreground">{t('upgradeCriterion')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S0</td>
                    <td className="p-3">70%</td>
                    <td className="p-3">56%</td>
                    <td className="p-3">14%</td>
                    <td className="p-3">{t('cumulative1M')}</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S1</td>
                    <td className="p-3">60%</td>
                    <td className="p-3">48%</td>
                    <td className="p-3">12%</td>
                    <td className="p-3">{t('cumulative500K')}</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S2</td>
                    <td className="p-3">50%</td>
                    <td className="p-3">40%</td>
                    <td className="p-3">10%</td>
                    <td className="p-3">{t('cumulative200K')}</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S3</td>
                    <td className="p-3">40%</td>
                    <td className="p-3">32%</td>
                    <td className="p-3">8%</td>
                    <td className="p-3">{t('cumulative50K')}</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S4</td>
                    <td className="p-3">30%</td>
                    <td className="p-3">24%</td>
                    <td className="p-3">6%</td>
                    <td className="p-3">{t('cumulative10K')}</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S5</td>
                    <td className="p-3">20%</td>
                    <td className="p-3">16%</td>
                    <td className="p-3">4%</td>
                    <td className="p-3">{t('registerFirstTrade')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default ReferralRules;

