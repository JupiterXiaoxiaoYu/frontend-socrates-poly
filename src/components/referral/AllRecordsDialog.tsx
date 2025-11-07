import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, HelpCircle } from "lucide-react";
import { RebateRecord } from "./RebateRecordsCard";
import { ReferralRecord } from "./ReferralRecordsCard";

interface AllRebateRecordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: "fee" | "mining";
  onTabChange: (tab: "fee" | "mining") => void;
  feeRebateRecords: RebateRecord[];
  miningRebateRecords: RebateRecord[];
}

interface AllReferralRecordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  records: ReferralRecord[];
  totalReferrals: number;
  onRecordClick: (record: ReferralRecord) => void;
}

// 全部返佣记录页面（移动端全屏）
export const AllRebateRecordsDialog = ({
  open,
  onOpenChange,
  activeTab,
  onTabChange,
  feeRebateRecords,
  miningRebateRecords,
}: AllRebateRecordsDialogProps) => {
  const renderRecords = (records: RebateRecord[]) => {
    if (records.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <HelpCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-0">
        {records.map((record) => (
          <div
            key={record.id}
            className="flex items-center justify-between py-3 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <img src={record.avatar} alt={record.userName} className="w-11 h-11 rounded-full bg-muted" />
              <div>
                <p className="text-sm font-bold text-foreground">{record.userName}</p>
                <p className="text-xs text-muted-foreground">{record.timestamp}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-foreground">
                {record.amount} {record.currency}
              </p>
              <p className="text-xs text-muted-foreground">Ratio {record.ratio}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-full w-full max-w-full left-0 top-0 translate-x-0 translate-y-0 overflow-y-auto rounded-none p-0 gap-0 border-0">
        {/* 标题栏 */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center h-14 px-4">
            <button onClick={() => onOpenChange(false)} className="flex items-center justify-center w-8 h-8 -ml-2">
              <ChevronRight className="w-5 h-5 rotate-180 text-foreground" />
            </button>
            <h2 className="flex-1 text-center text-base font-bold text-foreground pr-8">Rebate Records</h2>
          </div>
        </div>

        <div className="p-4">
          <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as "fee" | "mining")} className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-border rounded-none mb-4">
              <TabsTrigger
                value="fee"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
              >
                Fee Rebate
              </TabsTrigger>
              <TabsTrigger
                value="mining"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
              >
                Mining Rebate
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fee" className="mt-0">
              {renderRecords(feeRebateRecords)}
            </TabsContent>

            <TabsContent value="mining" className="mt-0">
              {renderRecords(miningRebateRecords)}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 全部推荐记录页面（移动端全屏）
export const AllReferralRecordsDialog = ({
  open,
  onOpenChange,
  records,
  totalReferrals,
  onRecordClick,
}: AllReferralRecordsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-full w-full max-w-full left-0 top-0 translate-x-0 translate-y-0 overflow-y-auto rounded-none p-0 gap-0 border-0">
        {/* 标题栏 */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center h-14 px-4">
            <button onClick={() => onOpenChange(false)} className="flex items-center justify-center w-8 h-8 -ml-2">
              <ChevronRight className="w-5 h-5 rotate-180 text-foreground" />
            </button>
            <h2 className="flex-1 text-center text-base font-bold text-foreground pr-8">Referral Records</h2>
          </div>
        </div>

        <div className="p-4">
          <p className="text-sm font-bold text-foreground mb-4">Total referrals: {totalReferrals}</p>

          <div className="space-y-0">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  onOpenChange(false);
                  onRecordClick(record);
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <img src={record.avatar} alt={record.userName} className="w-11 h-11 rounded-full bg-muted" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{record.userName}</p>
                    <p className="text-xs text-muted-foreground">{record.timestamp}</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

