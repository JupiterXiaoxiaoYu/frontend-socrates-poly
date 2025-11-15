import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";

const RebateRules = () => {
  const { t } = useTranslation('rebate');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 标题栏 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">{t('rulesTitle')}</h1>
        </div>

        {/* 规则内容 */}
        <Card className="p-6 border border-border">
          <div className="space-y-[60px] text-foreground">
            {/* 基本规则 */}
            <div className="space-y-9">
              <div>
                <h2 className="text-base font-medium mb-3">{t('basicRules')}</h2>
              </div>

              {/* 行为分类 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">{t('behaviorClassification')}</h3>
                <ul className="list-disc ml-5 space-y-2 text-sm text-muted-foreground">
                  <li>{t('behaviorClassificationDesc1')}</li>
                  <li>{t('behaviorClassificationDesc2')}</li>
                </ul>
              </div>

              {/* 积分发放条件 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">{t('pointDistribution')}</h3>
                <ul className="list-disc ml-5 space-y-2 text-sm text-muted-foreground">
                  <li>{t('pointDistributionDesc1')}</li>
                  <li>{t('pointDistributionDesc2')}</li>
                </ul>
              </div>

              {/* 积分奖励计算方式 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">{t('pointCalculation')}</h3>
                <ul className="list-disc ml-5 space-y-2 text-sm text-muted-foreground">
                  <li>{t('pointCalculationDesc1')}</li>
                  <li>{t('pointCalculationDesc2')}</li>
                  <li>{t('pointCalculationDesc3')}</li>
                </ul>
              </div>

              {/* 积分的用途 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">{t('useOfPoints')}</h3>
                <ul className="list-disc ml-5 text-sm text-muted-foreground">
                  <li>{t('useOfPointsDesc')}</li>
                </ul>
              </div>
            </div>

            {/* 积分算法公式 & 计算步骤详解 */}
            <div className="space-y-9">
              <div>
                <h2 className="text-base font-medium mb-3">{t('algorithmTitle')}</h2>
              </div>

              {/* 数据定义 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">{t('dataDefinition')}</h3>
                <ul className="list-disc ml-[18px] space-y-0 text-xs text-muted-foreground leading-4">
                  <li>V<sub>maker</sub>(u): {t('dataDefVMaker')}</li>
                  <li>V<sub>taker</sub>(u): {t('dataDefVTaker')}</li>
                  <li>∑V<sub>maker</sub>(i): {t('dataDefSumVMaker')}</li>
                  <li>∑V<sub>taker</sub>(i): {t('dataDefSumVTaker')}</li>
                  <li>A: {t('dataDefA')}</li>
                  <li>B: {t('dataDefB')}</li>
                </ul>
              </div>

              {/* 按比例计算每位用户的 Maker 积分 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">{t('calculateMakerPoints')}</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-mono text-foreground">
                    R<sub>maker</sub>(u) = (V<sub>maker</sub>(u) / ∑V<sub>maker</sub>(i)) × A
                  </p>
                </div>
                <div className="pl-3 space-y-3">
                  <p className="text-xs text-foreground">{t('explanation')}</p>
                  <ul className="list-disc ml-[18px] space-y-2 text-xs text-muted-foreground leading-4">
                    <li>{t('makerExplanation1')}</li>
                    <li>{t('makerExplanation2')}</li>
                  </ul>
                  <p className="text-xs text-foreground">{t('notes')}</p>
                  <ul className="list-disc ml-[18px] space-y-2 text-xs text-muted-foreground leading-4">
                    <li>{t('makerNote1')}</li>
                    <li>{t('makerNote2')}</li>
                  </ul>
                </div>
              </div>

              {/* 按比例计算每位用户的 Taker 积分 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">{t('calculateTakerPoints')}</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-mono text-foreground">
                    R<sub>taker</sub>(u) = (V<sub>taker</sub>(u) / ∑V<sub>taker</sub>(i)) × B
                  </p>
                </div>
                <div className="pl-3 space-y-3">
                  <p className="text-xs text-foreground">{t('explanation')}</p>
                  <ul className="list-disc ml-[18px] space-y-2 text-xs text-muted-foreground leading-4">
                    <li>{t('takerExplanation1')}</li>
                    <li>{t('takerExplanation2')}</li>
                  </ul>
                  <p className="text-xs text-foreground">{t('notes')}</p>
                  <ul className="list-disc ml-[18px] space-y-2 text-xs text-muted-foreground leading-4">
                    <li>{t('takerNote1')}</li>
                    <li>{t('takerNote2')}</li>
                  </ul>
                </div>
              </div>

              {/* 最终积分为两者中的较小值 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">{t('finalPoints')}</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-mono text-foreground">
                    R(u) = min(R<sub>maker</sub>(u), R<sub>taker</sub>(u))
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default RebateRules;

