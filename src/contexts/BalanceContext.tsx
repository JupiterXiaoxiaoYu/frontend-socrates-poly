import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMarket } from "./MarketContext";
import { fromUSDCPrecision } from "../lib/calculations";

interface BalanceContextType {
  usdcBalance: number;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider = ({ children }: { children: ReactNode }) => {
  const { positions, playerId, apiClient } = useMarket();
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // 从 Gateway API 加载余额
  const loadBalance = async () => {
    if (!apiClient || !playerId) {
      setIsLoading(false);
      return;
    }

    try {
      const uid = `${playerId[0]}:${playerId[1]}`;
      const balanceData = await apiClient.getBalance(uid, "USDC");
      const available = parseFloat(balanceData.available);
      setUsdcBalance(available);
    } catch (error) {
      // Fallback to positions data
      const usdcPosition = positions.find((p) => p.tokenIdx === "0");
      const fallbackBalance = usdcPosition ? fromUSDCPrecision(usdcPosition.balance) : 0;
      setUsdcBalance(fallbackBalance);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载和定期刷新
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled) return;
      await loadBalance();
    };

    load();

    // 每 5 秒刷新一次
    const interval = setInterval(load, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [apiClient, playerId, positions]);

  // 手动刷新余额
  const refreshBalance = async () => {
    setIsLoading(true);
    await loadBalance();
  };

  return (
    <BalanceContext.Provider value={{ usdcBalance, isLoading, refreshBalance }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error("useBalance must be used within a BalanceProvider");
  }
  return context;
};

