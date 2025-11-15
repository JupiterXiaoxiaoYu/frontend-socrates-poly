import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Volume2, VolumeX } from "lucide-react";
import { WalletButton } from "@/components/WalletButton";
import MobileNav from "@/components/MobileNav";
import { useSound } from "../contexts";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

const Header = () => {
  const { t } = useTranslation('common');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isEnabled, toggleSound } = useSound();

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
            <Link to="/rewards" className="text-sm font-medium hover:text-gray-300 transition-colors">
              {t('nav.rewards')}
            </Link>
            <Link to="/referral" className="text-sm font-medium hover:text-gray-300 transition-colors">
              {t('nav.referral')}
            </Link>
            <Link to="/wallet" className="text-sm font-medium hover:text-gray-300 transition-colors">
              {t('nav.wallet')}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Sound Toggle Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={toggleSound} className="p-2">
                  {isEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isEnabled ? "Mute new market alerts" : "Enable new market alerts"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Language Switcher - Desktop */}
            <div className="hidden lg:block">
              <LanguageSwitcher variant="desktop" />
            </div>

            <ThemeToggle />
            <WalletButton />
          </div>
        </div>
      </header>

      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
};

export default Header;
