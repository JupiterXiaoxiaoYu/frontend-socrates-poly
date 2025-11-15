// Context exports for prediction market integration
export { WalletProvider, useWallet } from "./WalletContext";
export type { WalletContextType } from "./WalletContext";

// 保留原有的 PredictionMarketContext（钱包依赖它！）
export {
  PredictionMarketProvider,
  usePredictionMarket,
  useMarkets,
  useUserPortfolio,
  useMarketOperations,
} from "./PredictionMarketContext";
export { PredictionMarketContext } from "./PredictionMarketContext";
// export type { PredictionMarketContextType } from "./PredictionMarketContext";

// 新的 Market Context（用于新 API 集成）
export { MarketProvider, useMarket } from "./MarketContext";

// Sound Context
export { SoundProvider, useSound } from "./SoundContext";
