import { Link } from "react-router-dom";
import { 
  ChevronRight, 
  Wallet, 
  Gift, 
  Settings, 
  Moon, 
  Sun, 
  Copy,
  Store,
  PieChart,
  Award
} from "lucide-react";
import { WalletButton } from "@/components/WalletButton";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNav = ({ isOpen, onClose }: MobileNavProps) => {
  const { t } = useTranslation('common');
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (theme ?? resolvedTheme) === "dark";

  const handleCopyAddress = () => {
    navigator.clipboard.writeText("@Eddy");
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 z-[60] w-80 max-w-[85vw] h-full bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:hidden
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* 个人信息区域 */}
          <div className="flex items-center gap-2 px-4 py-4 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 flex-1">
              {/* 头像 */}
              <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                <span className="text-lg font-bold">L</span>
              </div>
              {/* 用户信息 */}
              <div className="flex-1">
                <p className="text-lg font-bold text-foreground leading-tight">Lily</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-sm text-muted-foreground">@Eddy</p>
                  <button 
                    onClick={handleCopyAddress}
                    className="p-0.5 hover:bg-muted rounded transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
            {/* 右箭头 */}
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 py-2">
            {/* Market */}
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <Store className="w-5 h-5" />
              <span className="flex-1">{t('nav.market')}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>

            {/* Portfolio */}
            <Link
              to="/portfolio"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <PieChart className="w-5 h-5" />
              <span className="flex-1">{t('nav.portfolio')}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>

            {/* Wallet */}
            <Link
              to="/wallet"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <Wallet className="w-5 h-5" />
              <span className="flex-1">{t('nav.wallet')}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>

            {/* Rewards */}
            <Link
              to="/mining"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <Award className="w-5 h-5" />
              <span className="flex-1">{t('nav.rewards')}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>

            {/* Referral */}
            <Link
              to="/referral"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <Gift className="w-5 h-5" />
              <span className="flex-1">{t('nav.referral')}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>

            {/* 分割线 */}
            <div className="my-2 border-t border-border" />

            {/* Settings */}
            <div className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors">
              <Settings className="w-5 h-5" />
              <span className="flex-1">{t('nav.settings')}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* Language */}
            <LanguageSwitcher variant="mobile" />

            {/* Appearance */}
            <div className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground">
              <div className="w-5 h-5 flex items-center justify-center">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <span className="flex-1">{t('nav.appearance')}</span>
              <Switch
                checked={isDark}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </nav>

          {/* 底部连接按钮 */}
          <div className="p-4 border-t border-border">
            <WalletButton />
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNav;
