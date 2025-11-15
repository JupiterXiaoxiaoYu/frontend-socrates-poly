import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface RebateRecord {
  id: string;
  userName: string;
  avatar: string;
  timestamp: string;
  amount: string;
  currency: string;
  ratio: string;
}

interface RebateRecordsCardProps {
  feeRebateRecords: RebateRecord[];
  miningRebateRecords: RebateRecord[];
  activeTab: "fee" | "mining";
  onTabChange: (tab: "fee" | "mining") => void;
  onShowAllRecords: () => void;
}

// 返佣记录卡片组件
const RebateRecordsCard = ({
  feeRebateRecords,
  miningRebateRecords,
  activeTab,
  onTabChange,
  onShowAllRecords,
}: RebateRecordsCardProps) => {
  const { t } = useTranslation('referral');
  // 渲染记录列表
  const renderRecordList = (records: RebateRecord[], isMobile: boolean = false) => {
    const displayRecords = isMobile ? records.slice(0, 3) : records;

    return (
      <div className="space-y-0">
        {displayRecords.map((record) => (
          <div
            key={record.id}
            className="flex items-center justify-between py-3 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <img
                src={record.avatar}
                alt={record.userName}
                className="w-11 h-11 rounded-full bg-muted"
              />
              <div>
                <p className="text-sm font-bold text-foreground">{record.userName}</p>
                <p className="text-xs text-muted-foreground">{record.timestamp}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-foreground">
                {record.amount} {record.currency}
              </p>
              <p className="text-xs text-muted-foreground">{t('ratio')} {record.ratio}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 空状态组件
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <HelpCircle className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{t('noDataYet')}</p>
    </div>
  );

  return (
    <Card className="p-6 mb-4 border border-border">
      <h3 className="text-base font-bold text-foreground mb-4">{t('rebateRecords')}</h3>

      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as "fee" | "mining")} className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-border rounded-none mb-4">
          <TabsTrigger
            value="fee"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
          >
            {t('feeRebate')}
          </TabsTrigger>
          <TabsTrigger
            value="mining"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
          >
            {t('miningRebate')}
          </TabsTrigger>
        </TabsList>

        {/* Fee Rebate Tab */}
        <TabsContent value="fee" className="mt-0">
          {feeRebateRecords.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              {/* 桌面端：滚动显示所有记录 */}
              <div className="hidden md:block">
                <ScrollArea className="h-[340px] rounded-md pr-4">
                  {renderRecordList(feeRebateRecords)}
                </ScrollArea>
              </div>

              {/* 移动端：只显示3条 + All Records */}
              <div className="md:hidden">
                {renderRecordList(feeRebateRecords, true)}
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
        </TabsContent>

        {/* Mining Rebate Tab */}
        <TabsContent value="mining" className="mt-0">
          {miningRebateRecords.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              {/* 桌面端：滚动显示所有记录 */}
              <div className="hidden md:block">
                <ScrollArea className="h-[340px] rounded-md pr-4">
                  {renderRecordList(miningRebateRecords)}
                </ScrollArea>
              </div>

              {/* 移动端：只显示3条 + All Records */}
              <div className="md:hidden">
                {renderRecordList(miningRebateRecords, true)}
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
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default RebateRecordsCard;

