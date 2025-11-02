# Environment Variables Configuration Guide

## Overview

This project uses **Vite** as the build tool, which requires using `import.meta.env` to access environment variables instead of `process.env`.

## Environment Variable Naming

Vite requires environment variables to have specific prefixes to be exposed to the client:

- `VITE_*` - Standard Vite prefix
- `REACT_APP_*` - Supported for React compatibility (configured in `vite.config.ts`)

## Configuration Files

### 1. Centralized Config: `src/config/api.ts`

All API-related configuration is centralized in this file:

```typescript
export const API_CONFIG = {
  serverUrl: import.meta.env.REACT_APP_URL || "http://localhost:3000",
  privateKey: import.meta.env.REACT_APP_USER_PRIVATE_KEY || "0x1234567890abcdef",
  network: import.meta.env.REACT_APP_NETWORK || "testnet",
  debug: import.meta.env.REACT_APP_DEBUG === "true",
  depositContract: import.meta.env.REACT_APP_DEPOSIT_CONTRACT,
  tokenContract: import.meta.env.REACT_APP_TOKEN_CONTRACT,
  // ... other config
};
```

### 2. Vite Config: `vite.config.ts`

```typescript
export default defineConfig({
  envPrefix: ['VITE_', 'REACT_APP_'], // Support both prefixes
  // ... other config
});
```

## Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
# zkWasm Server Configuration
REACT_APP_URL=http://localhost:3000

# zkWasm RPC URL (used by SDK)
VITE_ZKWASM_RPC_URL=https://rpc.zkwasmhub.com:8090

# Network Configuration
REACT_APP_NETWORK=testnet

# Debug Mode
REACT_APP_DEBUG=false

# User Private Key (development only)
REACT_APP_USER_PRIVATE_KEY=0x1234567890abcdef

# Contract Addresses (required for deposits)
REACT_APP_DEPOSIT_CONTRACT=0x1234567890123456789012345678901234567890
REACT_APP_TOKEN_CONTRACT=0x1234567890123456789012345678901234567890
```

## Usage Patterns

### ✅ Correct Usage

#### 1. Using Centralized Config (Recommended)

```typescript
import { API_CONFIG } from '@/config/api';

// Use the config
const serverUrl = API_CONFIG.serverUrl;
const isDebug = API_CONFIG.debug;
```

#### 2. Direct Access in Components

```typescript
// Access environment variables directly
const apiUrl = import.meta.env.REACT_APP_URL;
const rpcUrl = import.meta.env.VITE_ZKWASM_RPC_URL;
```

#### 3. In main.tsx (SDK Configuration)

```typescript
import { setProviderConfig, setRpcUrl } from 'zkwasm-minirollup-browser';

// Configure before app initialization
setProviderConfig({ type: 'rainbow' });
setRpcUrl(); // Uses VITE_ZKWASM_RPC_URL from .env
```

### ❌ Incorrect Usage

```typescript
// ❌ Don't use process.env (Node.js only)
const apiUrl = process.env.REACT_APP_URL;

// ❌ Don't use require in ES modules
const { API_CONFIG } = require('../config/api');

// ❌ Don't access without prefix
const apiUrl = import.meta.env.API_URL; // Won't work!
```

## File-Specific Usage

### `src/config/api.ts`
```typescript
// Centralized configuration
export const API_CONFIG = {
  serverUrl: import.meta.env.REACT_APP_URL || "http://localhost:3000",
  // ...
};
```

### `src/services/api.ts`
```typescript
// Import from centralized config
import { API_CONFIG } from '../config/api';
export const API_BASE_URL = API_CONFIG.serverUrl;
```

### `src/services/websocket.ts`
```typescript
// Direct access to env variable
private getWebSocketUrl(): string {
  const apiBaseUrl = import.meta.env.REACT_APP_URL || 'http://localhost:3000';
  const wsUrl = apiBaseUrl.replace('http', 'ws');
  return `${wsUrl}/ws`;
}
```

### `src/App.tsx`
```typescript
// Use centralized config
import { API_CONFIG } from './config/api';

const predictionMarketConfig = {
  serverUrl: API_CONFIG.serverUrl,
  privkey: API_CONFIG.privateKey
};
```

### `src/main.tsx`
```typescript
// SDK configuration uses VITE_ prefix
import { setProviderConfig, setRpcUrl } from 'zkwasm-minirollup-browser';

setProviderConfig({ type: 'rainbow' });
setRpcUrl(); // Automatically uses VITE_ZKWASM_RPC_URL
```

## TypeScript Support

To get TypeScript support for environment variables, update `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REACT_APP_URL: string
  readonly REACT_APP_NETWORK: string
  readonly REACT_APP_DEBUG: string
  readonly REACT_APP_USER_PRIVATE_KEY: string
  readonly REACT_APP_DEPOSIT_CONTRACT: string
  readonly REACT_APP_TOKEN_CONTRACT: string
  readonly VITE_ZKWASM_RPC_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## Development vs Production

### Development (.env.development)
```env
REACT_APP_URL=http://localhost:3000
REACT_APP_DEBUG=true
REACT_APP_NETWORK=testnet
```

### Production (.env.production)
```env
REACT_APP_URL=https://api.production.com
REACT_APP_DEBUG=false
REACT_APP_NETWORK=mainnet
```

## Build Commands

```bash
# Development build (uses .env.development)
npm run build:dev

# Production build (uses .env.production)
npm run build

# Development server (uses .env)
npm run dev
```

## Validation

The `src/config/api.ts` includes validation:

```typescript
export const validateConfig = () => {
  const requiredVars = ['serverUrl'];
  const missing = requiredVars.filter(key => !API_CONFIG[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing configuration: ${missing.join(', ')}`);
  }
  
  if (!API_CONFIG.depositContract) {
    console.warn('REACT_APP_DEPOSIT_CONTRACT is not set. Deposit functionality may not work.');
  }
};
```

## Troubleshooting

### Issue: Environment variables are undefined

**Solution:**
1. Make sure variable has `VITE_` or `REACT_APP_` prefix
2. Restart dev server after changing `.env`
3. Check `vite.config.ts` has correct `envPrefix`

### Issue: "require is not defined"

**Solution:**
```typescript
// ❌ Wrong
const { API_CONFIG } = require('../config/api');

// ✅ Correct
import { API_CONFIG } from '../config/api';
```

### Issue: Variables work in dev but not in production

**Solution:**
1. Make sure `.env.production` exists
2. Variables must be set at **build time**, not runtime
3. For runtime config, use a config endpoint instead

## Best Practices

1. **Use Centralized Config**: Import from `src/config/api.ts` instead of accessing `import.meta.env` directly
2. **Never Commit Secrets**: Add `.env` to `.gitignore`
3. **Provide Defaults**: Always provide fallback values
4. **Validate on Startup**: Call `validateConfig()` in `main.tsx`
5. **Use TypeScript**: Define types in `vite-env.d.ts`
6. **Document Variables**: Keep `.env.example` updated

## Security Notes

⚠️ **Important Security Considerations:**

1. **Client-Side Exposure**: All `VITE_*` and `REACT_APP_*` variables are exposed to the client
2. **Never Store Secrets**: Don't put API keys, passwords, or private keys in environment variables
3. **Production Keys**: Use wallet connection for user private keys in production
4. **Contract Addresses**: Safe to expose (they're public on blockchain anyway)

## Migration from process.env

If you're migrating from Create React App or other tools:

```typescript
// Old (CRA)
const apiUrl = process.env.REACT_APP_URL;

// New (Vite)
const apiUrl = import.meta.env.REACT_APP_URL;
```

## References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [zkWasm SDK Configuration](https://github.com/DelphinusLab/zkWasm-minirollup-browser)

