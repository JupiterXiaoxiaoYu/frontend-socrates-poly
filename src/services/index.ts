// Service exports for prediction market integration
export {
    ExchangePlayer,
    ExchangeAdmin,
    ExchangeAPI,
    createPlayerClient,
    createAdminClient,
    createAPIClient,
    API_BASE_URL
} from './api';

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