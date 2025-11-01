// Context exports for prediction market integration
export { useWallet } from './WalletContext';
export { useWallet as useWalletContext } from './WalletContext';
export type { WalletContextType } from './WalletContext';

// Market Context
export { MarketProvider, useMarket } from './MarketContext';

// Sound Context
export { SoundProvider, useSound } from './SoundContext';

// 兼容旧的导出
export { MarketProvider as PredictionMarketProvider } from './MarketContext';
export { useMarket as usePredictionMarket } from './MarketContext';