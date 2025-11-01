// Service exports for prediction market integration
export {
    PredictionMarketAPI,
    createPredictionMarketAPI
} from './api';
export type { PredictionMarketAPI as IPredictionMarketAPI } from '../types/prediction-market';

// Oracle API exports
export {
    SocratesOracleClient,
    oracleClient
} from './oracle-api';
export type {
    OraclePriceResponse,
    OraclePriceUpdate,
    ExchangeStatus,
    OracleConfig
} from './oracle-api';