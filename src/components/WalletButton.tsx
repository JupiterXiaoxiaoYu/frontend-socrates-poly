import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "../contexts/WalletContext";
import { Wallet } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useEffect } from "react";

export function WalletButton() {
  const { isConnected, isL2Connected, address, l2Account, login, logout, connectL2, ready } = useWallet();

  const { toast } = useToast();

  // 监听 L2 连接状态变化
  useEffect(() => {
    // Wallet state monitoring
  }, [isConnected, isL2Connected, address, l2Account]);

  const formatAddress = (address: string) => {
    if (!address || typeof address !== "string") return "Invalid Address";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleWalletClick = async () => {
    if (!ready) {
      toast({
        title: "Please Wait",
        description: "Wallet is initializing...",
      });
      return;
    }

    try {
      if (!isConnected) {
        // Open Privy login modal
        login();
      } else if (!isL2Connected) {
        // Connect L2 layer
        toast({
          title: "Connecting...",
          description: "Please sign the message to connect to the prediction market L2",
        });
        await connectL2();
        toast({
          title: "Connected!",
          description: "Successfully connected to the prediction market",
        });
      } else {
        // Already fully connected, show disconnect option
        await logout();
        toast({
          title: "Disconnected",
          description: "Wallet has been disconnected",
        });
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Connection failed, please try again",
        variant: "destructive",
      });
    }
  };

  // 显示地址
  const displayAddress = address;

  // 检查是否真正连接：有 address 说明 L1 已连接，有 l2Account 说明 L2 已连接
  const isReallyL2Connected = isL2Connected && !!l2Account;

  return (
    <div className="flex items-center gap-3">
      {/* 显示 L1 地址 */}
      {isConnected && displayAddress && (
        <Badge
          variant="secondary"
          className="hidden sm:flex font-mono text-xs bg-gray-800 text-gray-100 border border-gray-700"
        >
          {formatAddress(displayAddress)}
        </Badge>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleWalletClick}
        disabled={!ready}
        className={`font-mono bg-transparent border-gray-600 text-white hover:border-gray-300 hover:text-gray-200 ${
          isConnected && isReallyL2Connected ? "border-success text-success hover:text-success" : ""
        }`}
      >
        <Wallet className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">
          {!ready
            ? "INITIALIZING..."
            : isConnected && isReallyL2Connected
            ? "CONNECTED"
            : isConnected
            ? "CONNECT L2"
            : "CONNECT WALLET"}
        </span>
        <span className="sm:hidden">{!ready ? "..." : isConnected && isReallyL2Connected ? "OK" : "CONNECT"}</span>
      </Button>
    </div>
  );
}
