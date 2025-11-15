import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, DollarSign } from "lucide-react";
import { WalletButton } from "@/components/WalletButton";
import MobileNav from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";
import { useTranslation } from "react-i18next";
import { useMarket } from "../contexts";
import { fromUSDCPrecision } from "../lib/calculations";

const Header = () => {
  const { t } = useTranslation('common');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { positions } = useMarket();

  // 计算 USDC 余额
  const usdcBalance = useMemo(() => {
    const usdcPosition = positions.find((p) => p.tokenIdx === "0");
    return usdcPosition ? fromUSDCPrecision(usdcPosition.balance) : 0;
  }, [positions]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-black text-white">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <Link to="/" className="flex items-center">
              <img 
                src="/hori/Socrates Logo horizontal - white.svg" 
                alt="Socrates" 
                className="h-8 w-auto"
              />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-gray-300 transition-colors">
              {t('nav.market')}
            </Link>
            <Link to="/portfolio" className="text-sm font-medium hover:text-gray-300 transition-colors">
              {t('nav.portfolio')}
            </Link>
            <Link to="/mining" className="text-sm font-medium hover:text-gray-300 transition-colors">
              {t('nav.rewards')}
            </Link>
            <Link to="/referral" className="text-sm font-medium hover:text-gray-300 transition-colors">
              {t('nav.referral')}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Cash Display */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-md border border-white/10">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 leading-none mb-0.5">Cash</span>
                <span className="text-sm font-semibold text-white leading-none">
                  ${usdcBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Deposit Button - 仅在桌面端显示 */}
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/wallet")}
              className="hidden md:inline-flex bg-white text-black hover:bg-gray-200 font-semibold"
            >
              Deposit
            </Button>

            {/* Theme Toggle - 仅在桌面端显示 */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
};

export default Header;
