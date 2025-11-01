// 🚀 使用 zkWasm SDK 提供的统一钱包上下文
// 直接使用SDK的完整功能，无需自定义实现

import { useWalletContext, type WalletContextType } from 'zkwasm-minirollup-browser';

// Re-export SDK的hook，保持项目中的命名约定
export const useWallet = useWalletContext;

// 导出类型定义
export type { WalletContextType };

// 创建一个简单的 WalletContext Provider（虽然主要由 DelphinusReactProvider 处理）
import React, { createContext, useContext } from 'react';

export const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wallet = useWallet();
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
};

// 注意：主要钱包功能由 DelphinusReactProvider 提供