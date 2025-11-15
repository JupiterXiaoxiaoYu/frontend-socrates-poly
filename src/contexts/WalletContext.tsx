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

  // Deposit to L2 (interact with L1 contract)
  deposit: (params: { tokenIndex: number; amount: number }) => Promise<any>;
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
      // 1. Request user signature to prove identity
      const appName = "Socrates Prediction Market";
      const provider = await activeWallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      const signature = await signer.signMessage(appName);

      // 2. Create L2 account using zkWasm's method
      const l2AccountSeed = signature.substring(0, 34);
      const l2AccountInfo = new L2AccountInfo(l2AccountSeed);

      // 3. Get Player ID (PID) from L2 account
      // Derive Player ID (PID) if needed by downstream contexts
      l2AccountInfo.getPidArray();

      // 4. Update state
      setL2Account(l2AccountInfo);
      setIsL2Connected(true);
      setL2Balance(0n);
      setL2Nonce(0n);
    } catch (error) {
      console.error("❌ L2 connection failed:", error);
      throw error;
    }
  }, [activeWallet, address]);

  // Disconnect L2
  const disconnectL2 = useCallback(() => {
    setIsL2Connected(false);
    setL2Account(null);
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
    return l2Nonce;
  }, [isL2Connected, l2Account, l2Nonce]);

  // Deposit to L2 (interact with L1 deposit contract on BSC)
  const deposit = useCallback(
    async (params: { tokenIndex: number; amount: number }): Promise<any> => {
      if (!activeWallet || !address) {
        throw new Error("Please connect wallet first");
      }
      if (!l2Account) {
        throw new Error("Please connect L2 first");
      }
      try {
        // Get provider and signer from Privy wallet
        const provider = await activeWallet.getEthereumProvider();
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();

        // Get deposit contract address from env
        const depositContractAddress = import.meta.env.REACT_APP_DEPOSIT_CONTRACT;
        if (!depositContractAddress) {
          throw new Error("Deposit contract address not configured");
        }

        // Minimal ERC20 ABI for approve
        const erc20Abi = [
          "function approve(address spender, uint256 amount) returns (bool)",
          "function allowance(address owner, address spender) view returns (uint256)",
        ];

        // Deposit contract ABI (simplified)
        const depositAbi = ["function deposit(uint256 tokenIndex, uint256 amount, bytes32 l2Account) payable"];

        // Get token contract address
        const tokenContractAddress = import.meta.env.REACT_APP_TOKEN_CONTRACT;
        if (!tokenContractAddress) {
          throw new Error("Token contract address not configured");
        }

        // Convert amount to wei (assuming USDC with 6 decimals)
        const amountInWei = ethers.parseUnits(params.amount.toString(), 6);

        // 1. Approve token spending
        const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, signer);
        const approveTx = await tokenContract.approve(depositContractAddress, amountInWei);
        await approveTx.wait();

        // 2. Call deposit on contract
        const depositContract = new ethers.Contract(depositContractAddress, depositAbi, signer);
        const l2AccountBytes32 = l2Account.toHexStr();
        const depositTx = await depositContract.deposit(params.tokenIndex, amountInWei, l2AccountBytes32);
        const receipt = await depositTx.wait();
        return receipt;
      } catch (error) {
        console.error("❌ Deposit failed:", error);
        throw error;
      }
    },
    [activeWallet, address, l2Account]
  );

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
    deposit,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};
