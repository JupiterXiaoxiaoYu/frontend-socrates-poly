import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight } from "lucide-react";
import { ReferralRecord } from "./ReferralRecordsCard";

interface ReferralRecordsDialogProps {
  open: boolean;
  selectedUser: ReferralRecord | null;
  records: ReferralRecord[];
  onOpenChange: (open: boolean) => void;
  onRecordClick: (record: ReferralRecord) => void;
}

// 推荐记录详情弹窗组件（动态内容切换）
const ReferralRecordsDialog = ({
  open,
  selectedUser,
  records,
  onOpenChange,
  onRecordClick,
}: ReferralRecordsDialogProps) => {
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
            <h2 className="flex-1 text-center text-base font-bold text-foreground pr-8">
              {selectedUser?.userName}'s Referral Records
            </h2>
          </div>
        </div>

        {/* 桌面端标题 */}
        <DialogHeader className="hidden md:flex md:mb-4 p-6 pb-4">
          <div className="flex items-center gap-3">
            <img
              src={selectedUser?.avatar || ""}
              alt={selectedUser?.userName || ""}
              className="w-10 h-10 rounded-full bg-muted"
            />
            <DialogTitle className="text-base font-bold">
              {selectedUser?.userName}'s Referral Records
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-4 md:px-6 md:pb-6 md:pt-0">
          <p className="text-sm font-bold text-foreground mb-4">Total referrals: 20</p>

          <div className="space-y-0">
            {records.slice(0, 5).map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onRecordClick(record)}
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

export default ReferralRecordsDialog;

