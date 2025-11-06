// 🚀 Privy Wallet Integration with zkWasm L2
import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { L2AccountInfo } from "zkwasm-minirollup-browser/dist/models/L2AccountInfo";

export interface WalletContextType {
  // Privy base state
  isConnected: boolean;
  ready: boolean;
  authenticated: boolean;
  user: any;

  // Account information
  address: string | undefined;
  l1Account: { address: string } | null;
  l2Account: L2AccountInfo | null;

  // L2 connection state
  isL2Connected: boolean;
  l2Balance: bigint;

  // Wallet operations
  login: () => void;
  logout: () => Promise<void>;
  connectL2: () => Promise<void>;
  disconnectL2: () => void;

  // zkWasm specific functions
  signMessage: (message: string) => Promise<string>;
  getL2Nonce: () => Promise<bigint>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { ready, authenticated, user, login, logout: privyLogout } = usePrivy();

  const { wallets } = useWallets();

  // L2 connection state
  const [isL2Connected, setIsL2Connected] = useState(false);
  const [l2Account, setL2Account] = useState<L2AccountInfo | null>(null);
  const [l2Balance, setL2Balance] = useState<bigint>(0n);
  const [l2Nonce, setL2Nonce] = useState<bigint>(0n);
  const [playerId, setPlayerId] = useState<[string, string] | null>(null);

  // Get current active wallet address
  const activeWallet = wallets[0]; // Use first wallet
  const address = activeWallet?.address;

  // Construct l1Account object for backward compatibility
  const l1Account = address ? { address } : null;

  // Connect to zkWasm L2
  const connectL2 = useCallback(async () => {
    if (!activeWallet || !address) {
      throw new Error("Please connect wallet first");
    }

    try {
      console.log("🚀 Starting L2 connection...");

      // 1. Request user signature to prove identity
      // Use app name as message (same as zkWasm SDK does)
      const appName = "Socrates Prediction Market";
      const provider = await activeWallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      console.log("📝 Requesting signature for message:", appName);
      const signature = await signer.signMessage(appName);
      console.log("✅ Signature obtained:", signature.substring(0, 20) + "...");

      // 2. Create L2 account using zkWasm's method
      // Use first 34 characters of signature (0x + 32 hex chars)
      const l2AccountSeed = signature.substring(0, 34);
      console.log("🌱 Creating L2 account with seed:", l2AccountSeed);

      const l2AccountInfo = new L2AccountInfo(l2AccountSeed);
      console.log("🎯 L2 account created!");

      // 3. Get Player ID (PID) from L2 account
      const [pid1, pid2] = l2AccountInfo.getPidArray();
      const playerIdArray: [string, string] = [pid1.toString(), pid2.toString()];

      console.log("🆔 Player ID:", playerIdArray);
      console.log("🔑 Public Key:", l2AccountInfo.toHexStr());

      // 4. Update state
      setL2Account(l2AccountInfo);
      setIsL2Connected(true);
      setPlayerId(playerIdArray);
      setL2Balance(0n); // Initial balance - can be queried from L2 later
      setL2Nonce(0n); // Initial nonce - can be queried from L2 later

      console.log("✅ L2 connected successfully!");
      console.log("   - Public Key:", l2AccountInfo.toHexStr());
      console.log("   - PID:", playerIdArray);
    } catch (error) {
      console.error("❌ L2 connection failed:", error);
      throw error;
    }
  }, [activeWallet, address]);

  // Disconnect L2
  const disconnectL2 = useCallback(() => {
    setIsL2Connected(false);
    setL2Account(null);
    setPlayerId(null);
    setL2Balance(0n);
    setL2Nonce(0n);
  }, []);

  // Enhanced logout function
  const logout = useCallback(async () => {
    disconnectL2();
    await privyLogout();
  }, [privyLogout, disconnectL2]);

  // Sign message
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!activeWallet) {
        throw new Error("No active wallet");
      }

      const provider = await activeWallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      return await signer.signMessage(message);
    },
    [activeWallet]
  );

  // Get L2 Nonce
  const getL2Nonce = useCallback(async (): Promise<bigint> => {
    if (!isL2Connected || !l2Account) {
      throw new Error("L2 not connected");
    }
    // TODO: Get actual nonce from zkWasm L2
    return l2Nonce;
  }, [isL2Connected, l2Account, l2Nonce]);

  // Listen to wallet changes, disconnect L2
  useEffect(() => {
    if (!authenticated || !address) {
      disconnectL2();
    }
  }, [authenticated, address, disconnectL2]);

  const value: WalletContextType = {
    isConnected: authenticated && !!address,
    ready,
    authenticated,
    user,
    address,
    l1Account,
    l2Account,
    isL2Connected,
    l2Balance,
    login,
    logout,
    connectL2,
    disconnectL2,
    signMessage,
    getL2Nonce,
  };

  // Log L2 account info for debugging
  useEffect(() => {
    if (l2Account && playerId) {
      console.log("📊 L2 Account Status:");
      console.log("   - Connected:", isL2Connected);
      console.log("   - Public Key:", l2Account.toHexStr());
      console.log("   - Player ID:", playerId);
      console.log("   - Private Key (first 10 chars):", l2Account.getPrivateKey().substring(0, 10) + "...");
    }
  }, [l2Account, playerId, isL2Connected]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};
