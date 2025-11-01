import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { WalletButton } from "@/components/WalletButton";
import MobileNav from "@/components/MobileNav";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-black text-white">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:bg-white/10 p-2"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-lg font-bold">?</span>
              </div>
              <span className="text-xl font-bold">socrates</span>
            </Link>
          </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-white/70 transition-colors">
            Market
          </Link>
          <Link to="/portfolio" className="text-sm font-medium hover:text-white/70 transition-colors">
            Portfolio
          </Link>
          <Link to="/rewards" className="text-sm font-medium hover:text-white/70 transition-colors">
            Rewards
          </Link>
          <Link to="/wallet" className="text-sm font-medium hover:text-white/70 transition-colors">
            Wallet
          </Link>
        </nav>

          <div className="flex items-center gap-3">
            <WalletButton />
          </div>
        </div>
      </header>

      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};

export default Header;
