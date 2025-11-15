import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";

// 模拟积分记录数据
const mockPointsHistory = [
  {
    id: 1,
    period: "2025/06/16 00:00 ~ 2025/06/22 23:59 UTC",
    maker: 5500.0,
    taker: 5500.0,
    points: 123.12,
  },
  {
    id: 2,
    period: "2025/06/16 00:00 ~ 2025/06/22 23:59 UTC",
    maker: 5500.0,
    taker: 5500.0,
    points: 123.12,
  },
  {
    id: 3,
    period: "2025/06/16 00:00 ~ 2025/06/22 23:59 UTC",
    maker: 5500.0,
    taker: 5500.0,
    points: 123.12,
  },
  {
    id: 4,
    period: "2025/06/16 00:00 ~ 2025/06/22 23:59 UTC",
    maker: 5500.0,
    taker: 5500.0,
    points: 123.12,
  },
];

const RebatePointsHistory = () => {
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
          <h1 className="text-xl font-bold text-foreground">{t('pointsHistory')}</h1>
        </div>

        {/* 积分记录列表 */}
        <div className="space-y-4">
          {mockPointsHistory.map((record) => (
            <Card key={record.id} className="p-4 border border-border">
              <div className="space-y-3">
                {/* 时间周期 */}
                <div className="text-sm text-muted-foreground">{record.period}</div>

                {/* Maker 和 Taker */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('maker')}</span>
                  <span className="text-sm font-semibold text-foreground">
                    ${record.maker.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('taker')}</span>
                  <span className="text-sm font-semibold text-foreground">
                    ${record.taker.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* 获得积分 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('pointsEarned')}</span>
                  <span className="text-base font-bold text-foreground">{record.points.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default RebatePointsHistory;

