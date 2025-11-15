import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DashboardButtonProps {
  onClick: () => void;
  className?: string;
}

// Dashboard 按钮组件
const DashboardButton = ({ onClick, className = "" }: DashboardButtonProps) => {
  const { t } = useTranslation('referral');
  return (
    <Card
      className={`p-4 mb-4 border border-border cursor-pointer hover:bg-muted/50 transition-colors ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-base font-bold text-foreground">{t('dashboard')}</span>
        <div className="flex items-center text-muted-foreground">
          <ChevronRight className="w-5 h-5" />
          <ChevronRight className="w-5 h-5 -ml-2" />
        </div>
      </div>
    </Card>
  );
};

export default DashboardButton;

