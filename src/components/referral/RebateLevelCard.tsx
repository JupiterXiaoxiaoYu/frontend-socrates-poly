import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

interface RebateLevelCardProps {
  onRulesClick: () => void;
  className?: string;
}

// 返佣等级卡片组件
const RebateLevelCard = ({ onRulesClick, className = "" }: RebateLevelCardProps) => {
  return (
    <Card className={`p-6 mb-4 border border-border ${className}`}>
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
            onClick={onRulesClick}
            className="flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors"
          >
            <span>Rebate Reward Rules</span>
            <ChevronRight className="w-4 h-4" />
            <ChevronRight className="w-4 h-4 -ml-3" />
          </button>
        </div>
      </div>
    </Card>
  );
};

export default RebateLevelCard;

