import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "../contexts/WalletContext";
import { Wallet, ChevronDown, LogOut, Copy, Settings, Gift } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function WalletButton() {
  const { isConnected, isL2Connected, address, l2Account, login, logout, connectL2, ready } = useWallet();
  const navigate = useNavigate();
  const { toast } = useToast();

  // 监听 L2 连接状态变化
  useEffect(() => {
    // Wallet state monitoring
  }, [isConnected, isL2Connected, address, l2Account]);

  const formatAddress = (address: string) => {
    if (!address || typeof address !== "string") return "Invalid Address";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      toast({
        title: "Disconnected",
        description: "Wallet has been disconnected",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect",
        variant: "destructive",
      });
    }
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

  // 如果已连接，显示带下拉菜单的用户头像按钮
  if (isConnected && isReallyL2Connected && displayAddress) {
    // 从地址生成用户名首字母
    const userInitials = displayAddress.substring(2, 4).toUpperCase();

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="font-mono bg-transparent border-0 sm:border border-success text-success hover:border-success hover:text-success gap-2 h-auto sm:h-9 sm:px-3 p-0"
          >
            <Avatar className="h-8 w-8 sm:h-6 sm:w-6">
              <AvatarImage src="" />
              <AvatarFallback className="text-sm sm:text-xs bg-success text-white">{userInitials}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">{formatAddress(displayAddress)}</span>
            <ChevronDown className="h-3 w-3 hidden sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-2">
          {/* User Info Header */}
          <div className="px-3 py-3 mb-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="text-sm bg-success text-white">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground">User</div>
                <div className="font-mono text-xs text-muted-foreground truncate">{formatAddress(displayAddress)}</div>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className="my-2" />

          {/* Navigation Items */}
          <DropdownMenuItem onClick={() => navigate("/wallet")} className="cursor-pointer py-2.5 px-3">
            <Wallet className="h-4 w-4 mr-3" />
            <span>Wallet</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/referral")} className="cursor-pointer py-2.5 px-3">
            <Gift className="h-4 w-4 mr-3" />
            <span>Referral</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer py-2.5 px-3">
            <Settings className="h-4 w-4 mr-3" />
            <span>Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2" />

          {/* Actions */}
          <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer py-2.5 px-3">
            <Copy className="h-4 w-4 mr-3" />
            <span>Copy Address</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDisconnect}
            className="cursor-pointer py-2.5 px-3 text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-3" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // 未连接或未完全连接，显示普通连接按钮
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleWalletClick}
      disabled={!ready}
      className="font-mono bg-transparent border-gray-600 text-white hover:border-gray-300 hover:text-gray-200"
    >
      <Wallet className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">
        {!ready ? "INITIALIZING..." : isConnected ? "CONNECT L2" : "CONNECT WALLET"}
      </span>
      <span className="sm:hidden">{!ready ? "..." : "CONNECT"}</span>
    </Button>
  );
}
