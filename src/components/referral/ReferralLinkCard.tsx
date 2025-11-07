import { Card } from "@/components/ui/card";
import { Copy } from "lucide-react";

interface ReferralLinkCardProps {
  onCopy: (text: string, label: string) => void;
  className?: string;
}

// 推荐链接和推荐码卡片组件
const ReferralLinkCard = ({ onCopy, className = "" }: ReferralLinkCardProps) => {
  return (
    <Card className={`p-6 mb-4 border border-border ${className}`}>
      <h3 className="text-base font-bold text-foreground mb-4">Referral</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Referral link */}
        <div className="bg-muted rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Referral link</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Soc……92VA</span>
            <button
              onClick={() => onCopy("https://socrates.com/ref/92VA", "Referral link")}
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
              onClick={() => onCopy("AKV392VA", "Referral code")}
              className="text-foreground hover:text-muted-foreground transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ReferralLinkCard;

