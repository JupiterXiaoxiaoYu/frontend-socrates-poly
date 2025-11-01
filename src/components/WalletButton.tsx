import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { useConnectModal } from "zkwasm-minirollup-browser";
import { Wallet } from "lucide-react";

export function WalletButton() {
  const walletContext = useWallet();
  const { isConnected, isL2Connected, l1Account, connectL2 } = walletContext;
  const { openConnectModal } = useConnectModal();

  const formatAddress = (address: string) => {
    if (!address || typeof address !== 'string') return 'Invalid Address';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleWalletClick = async () => {
    try {
      if (!isConnected) {
        // Open zkWasm connection modal
        openConnectModal?.();
      } else if (!isL2Connected) {
        // Connect L2 layer
        await connectL2();
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {isConnected && l1Account && l1Account.address && (
        <Badge
          variant="secondary"
          className="hidden sm:flex font-mono text-xs bg-white/10 text-white border-white/20"
        >
          {formatAddress(l1Account.address)}
        </Badge>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleWalletClick}
        className={`font-mono border-white text-white bg-white/10 hover:bg-white/20 ${
          isConnected && isL2Connected ? 'border-green-400 text-green-400' : ''
        }`}
      >
        <Wallet className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">
          {isConnected && isL2Connected ? 'CONNECTED' : 'CONNECT WALLET'}
        </span>
        <span className="sm:hidden">CONNECT</span>
      </Button>
    </div>
  );
}