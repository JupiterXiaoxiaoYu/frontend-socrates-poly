// Context exports for prediction market integration
export { useWallet } from './WalletContext';
export { useWallet as useWalletContext } from './WalletContext';
export { WalletContext, WalletProvider } from './WalletContext';
export type { WalletContextType } from './WalletContext';

export {
    PredictionMarketProvider,
    usePredictionMarket,
    useMarkets,
    useUserPortfolio,
    useMarketOperations
} from './PredictionMarketContext';
export { PredictionMarketContext } from './PredictionMarketContext';
export type { PredictionMarketContextType } from './PredictionMarketContext';