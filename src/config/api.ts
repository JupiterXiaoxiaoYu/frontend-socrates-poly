// API Configuration for Prediction Market

export const API_CONFIG = {
  // Gateway base URL (all market REST endpoints) — prefer VITE_API_BASE_URL
  gatewayBaseUrl:
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.REACT_APP_API_URL ||
    import.meta.env.REACT_APP_URL ||
    "http://localhost:8080",

  // zkWasm RPC URL (player install, tx submit, etc.)
  // If VITE_ZKWASM_RPC_URL is not set, default to public zkWasm RPC.
  zkwasmRpcUrl: import.meta.env.VITE_ZKWASM_RPC_URL || "https://rpc.socrates.zkwasm.ai",

  // User private key (in production this should come from wallet connection)
  privateKey: import.meta.env.REACT_APP_USER_PRIVATE_KEY || "0x1234567890abcdef",

  // Network configuration
  network: import.meta.env.REACT_APP_NETWORK || "testnet",

  // Debug mode
  debug: import.meta.env.REACT_APP_DEBUG === "true",

  // Contract addresses
  depositContract: import.meta.env.REACT_APP_DEPOSIT_CONTRACT,
  tokenContract: import.meta.env.REACT_APP_TOKEN_CONTRACT,

  // Default values
  defaults: {
    // Refresh intervals (in milliseconds)
    dataRefreshInterval: 30000, // 30 seconds
    transactionPollInterval: 5000, // 5 seconds

    // Pagination
    ordersPerPage: 20,
    tradesPerPage: 20,
    transactionsPerPage: 20,
  },
};

// Validation functions
export const validateConfig = () => {
  const requiredVars = ["gatewayBaseUrl", "zkwasmRpcUrl"];
  const missing = requiredVars.filter((key) => !API_CONFIG[key as keyof typeof API_CONFIG]);

  if (missing.length > 0) {
    console.warn(`Missing configuration: ${missing.join(", ")}`);
  }

  // Warn if deposit/token contracts are not set
  if (!API_CONFIG.depositContract) {
    console.warn("REACT_APP_DEPOSIT_CONTRACT is not set. Deposit functionality may not work.");
  }

  if (!API_CONFIG.tokenContract) {
    console.warn("REACT_APP_TOKEN_CONTRACT is not set. Token operations may not work.");
  }
};

// Helper to get configuration with validation
export const getConfig = () => {
  validateConfig();
  return API_CONFIG;
};

// Log configuration on load (only in development)
if (API_CONFIG.debug) {
  console.log("API Configuration:", {
    gatewayBaseUrl: API_CONFIG.gatewayBaseUrl,
    zkwasmRpcUrl: API_CONFIG.zkwasmRpcUrl,
    network: API_CONFIG.network,
    hasDepositContract: !!API_CONFIG.depositContract,
    hasTokenContract: !!API_CONFIG.tokenContract,
  });
}

export default API_CONFIG;
