import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

interface DashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Dashboard 弹窗组件
const DashboardDialog = ({ open, onOpenChange }: DashboardDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-full w-full max-w-full md:max-w-md md:h-auto md:max-h-[calc(100vh-120px)] left-0 top-0 md:left-[50%] md:top-[50%] translate-x-0 translate-y-0 md:translate-x-[-50%] md:translate-y-[-50%] overflow-y-auto rounded-none md:rounded-lg p-0 gap-0 border-0 md:border">
        {/* 移动端标题栏 */}
        <div className="sticky top-0 z-10 bg-background border-b border-border md:hidden">
          <div className="flex items-center h-14 px-4">
            <button
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center w-8 h-8 -ml-2"
            >
              <ChevronRight className="w-5 h-5 rotate-180 text-foreground" />
            </button>
            <h2 className="flex-1 text-center text-base font-bold text-foreground pr-8">Dashboard</h2>
          </div>
        </div>

        {/* 桌面端标题 */}
        <DialogHeader className="hidden md:flex p-6 pb-4">
          <DialogTitle className="text-base font-bold">Dashboard</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-4 md:px-6 md:pb-6 md:pt-0">
          {/* Referrals */}
          <Card className="p-4 border border-border bg-card">
            <h3 className="text-base font-bold text-foreground mb-4">Referrals</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Direct Referrals</span>
                <span className="font-bold text-foreground">22</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Indirect Referrals</span>
                <span className="font-bold text-foreground">220</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Referrals</span>
                <span className="font-bold text-foreground">242</span>
              </div>
            </div>
          </Card>

          {/* Trading Volume */}
          <Card className="p-4 border border-border bg-card">
            <h3 className="text-base font-bold text-foreground mb-4">Trading Volume</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Direct Referrals</span>
                <span className="font-bold text-foreground">22 USDC</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Indirect Referrals</span>
                <span className="font-bold text-foreground">220 USDC</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Referrals</span>
                <span className="font-bold text-foreground">242 USDC</span>
              </div>
            </div>
          </Card>

          {/* Fee Rebate */}
          <Card className="p-4 border border-border bg-card">
            <h3 className="text-base font-bold text-foreground mb-4">Fee Rebate</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Direct Referrals</span>
                <span className="font-bold text-foreground">22 USDC</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Indirect Referrals</span>
                <span className="font-bold text-foreground">220 USDC</span>
              </div>
            </div>
          </Card>

          {/* Mining Rebate */}
          <Card className="p-4 border border-border bg-card">
            <h3 className="text-base font-bold text-foreground mb-4">Mining Rebate</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Direct Referrals</span>
                <span className="font-bold text-foreground">22 SOC</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Indirect Referrals</span>
                <span className="font-bold text-foreground">220 SOC</span>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardDialog;

