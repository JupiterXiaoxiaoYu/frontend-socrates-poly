import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ClaimableCardProps {
  onClaim: (type: "fee" | "mining", amount: number) => void;
  className?: string;
}

// 可领取卡片组件
const ClaimableCard = ({ onClaim, className = "" }: ClaimableCardProps) => {
  return (
    <Card className={`p-6 mb-4 border border-border ${className}`}>
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
              onClick={() => onClaim("fee", 220.32)}
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
              onClick={() => onClaim("mining", 9.32)}
            >
              Claim
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ClaimableCard;

