import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";

// 模拟交易量记录数据
const mockVolumeRecords = [
  {
    id: 1,
    date: "2025-06-24",
    maker: 5500.0,
    taker: 5500.0,
  },
  {
    id: 2,
    date: "2025-06-24",
    maker: 5500.0,
    taker: 5500.0,
  },
  {
    id: 3,
    date: "2025-06-24",
    maker: 5500.0,
    taker: 5500.0,
  },
  {
    id: 4,
    date: "2025-06-24",
    maker: 5500.0,
    taker: 5500.0,
  },
  {
    id: 5,
    date: "2025-06-24",
    maker: 5500.0,
    taker: 5500.0,
  },
  {
    id: 6,
    date: "2025-06-24",
    maker: 5500.0,
    taker: 5500.0,
  },
];

const RebateVolumeRecords = () => {
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
          <h1 className="text-xl font-bold text-foreground">{t('volumeRecords')}</h1>
        </div>

        {/* 交易量记录列表 */}
        <div className="space-y-4">
          {mockVolumeRecords.map((record) => (
            <Card key={record.id} className="p-4 border border-border">
              <div className="space-y-3">
                {/* 日期 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('date')}</span>
                  <span className="text-sm font-medium text-foreground">{record.date}</span>
                </div>

                {/* Maker */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('maker')}</span>
                  <span className="text-sm font-semibold text-foreground">
                    ${record.maker.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Taker */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('taker')}</span>
                  <span className="text-sm font-semibold text-foreground">
                    ${record.taker.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default RebateVolumeRecords;

