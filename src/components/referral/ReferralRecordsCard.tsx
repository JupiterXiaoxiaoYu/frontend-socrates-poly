import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface ReferralRecord {
  id: string;
  userName: string;
  avatar: string;
  timestamp: string;
}

interface ReferralRecordsCardProps {
  records: ReferralRecord[];
  totalReferrals: number;
  onRecordClick: (record: ReferralRecord) => void;
  onShowAllRecords: () => void;
}

// 推荐记录卡片组件
const ReferralRecordsCard = ({
  records,
  totalReferrals,
  onRecordClick,
  onShowAllRecords,
}: ReferralRecordsCardProps) => {
  const { t } = useTranslation('referral');
  // 渲染记录项
  const renderRecord = (record: ReferralRecord) => (
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
  );

  return (
    <Card className="p-6 mb-4 border border-border">
      <h3 className="text-base font-bold text-foreground mb-2">{t('referralRecords')}</h3>
      <p className="text-sm font-bold text-foreground mb-4">{t('totalReferrals')}: {totalReferrals}</p>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <HelpCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t('noDataYet')}</p>
        </div>
      ) : (
        <div>
          {/* 桌面端：滚动显示所有记录 */}
          <div className="hidden md:block">
            <ScrollArea className="h-[340px] rounded-md pr-4">
              <div className="space-y-0">
                {records.map((record) => renderRecord(record))}
              </div>
            </ScrollArea>
          </div>

          {/* 移动端：只显示3条 + All Records */}
          <div className="md:hidden">
            <div className="space-y-0">
              {records.slice(0, 3).map((record) => renderRecord(record))}
            </div>
            <button
              onClick={onShowAllRecords}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
            >
              <span>{t('allRecords')}</span>
              <ChevronRight className="w-4 h-4" />
              <ChevronRight className="w-4 h-4 -ml-3" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ReferralRecordsCard;

