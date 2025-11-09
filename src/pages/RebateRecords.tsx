import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

interface PointsRecord {
  id: string;
  period: string; // Date range like "2025/06/16 00:00 ~ 2025/06/22 23:59 UTC"
  maker: number; // Maker volume
  taker: number; // Taker volume
  pointsEarned: number; // Points earned
}

// Mock data for points records
const mockPointsRecords: PointsRecord[] = [
  {
    id: "1",
    period: "2025/06/16 00:00 ~ 2025/06/22 23:59 UTC",
    maker: 5500.0,
    taker: 5500.0,
    pointsEarned: 223.12,
  },
  {
    id: "2",
    period: "2025/06/09 00:00 ~ 2025/06/15 23:59 UTC",
    maker: 4800.0,
    taker: 5200.0,
    pointsEarned: 198.45,
  },
  {
    id: "3",
    period: "2025/06/02 00:00 ~ 2025/06/08 23:59 UTC",
    maker: 6200.0,
    taker: 5800.0,
    pointsEarned: 245.67,
  },
  {
    id: "4",
    period: "2025/05/26 00:00 ~ 2025/06/01 23:59 UTC",
    maker: 5100.0,
    taker: 4900.0,
    pointsEarned: 201.23,
  },
  {
    id: "5",
    period: "2025/05/19 00:00 ~ 2025/05/25 23:59 UTC",
    maker: 5900.0,
    taker: 6100.0,
    pointsEarned: 238.89,
  },
];

const RebateRecords = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Back button and title */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Points Record</h1>
        </div>

        {/* Records list */}
        <div className="space-y-4">
          {mockPointsRecords.map((record) => (
            <Card key={record.id} className="p-6 border border-border">
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">{record.period}</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Maker</span>
                  <span className="text-base font-semibold text-foreground">
                    ${record.maker.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taker</span>
                  <span className="text-base font-semibold text-foreground">
                    ${record.taker.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Points Earned</span>
                  <span className="text-lg font-bold text-foreground">
                    {record.pointsEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

export default RebateRecords;

