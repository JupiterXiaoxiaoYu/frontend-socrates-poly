# Troubleshooting Guide

## Common Issues and Solutions

### Issue: "r.getAllMarkets is not a function"

**Symptoms:**
```
PredictionMarketContext: Failed to refresh data: TypeError: r.getAllMarkets is not a function
```

**Root Cause:**
The browser is using a cached version of the old code where `createPredictionMarketAPI` didn't include the `getAllMarkets` method.

**Solutions:**

#### 1. Hard Refresh the Browser (Recommended)
- **Chrome/Edge**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
- **Safari**: `Cmd + Option + R`

#### 2. Clear Browser Cache
1. Open DevTools (`F12`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

#### 3. Clear Vite Cache and Rebuild
```bash
# Stop the dev server
# Delete cache directories
rm -rf node_modules/.vite
rm -rf dist

# Restart dev server
npm run dev
```

#### 4. Clear All Caches (Nuclear Option)
```bash
# Stop the dev server
# Clear all caches
rm -rf node_modules/.vite
rm -rf dist
rm -rf node_modules/.cache

# Reinstall dependencies
npm install

# Restart dev server
npm run dev
```

---

## Issue: Environment Variables Not Loading

**Symptoms:**
- `import.meta.env.REACT_APP_URL` is `undefined`
- API calls fail with wrong URL
- Console shows "Missing configuration" warnings

**Solutions:**

#### 1. Check .env File Exists
```bash
# Make sure .env file exists in project root
ls -la .env
```

#### 2. Verify Environment Variable Names
Environment variables must have correct prefix:
- ✅ `REACT_APP_URL`
- ✅ `VITE_ZKWASM_RPC_URL`
- ❌ `API_URL` (no prefix)

#### 3. Restart Dev Server
Environment variables are loaded at startup. After changing `.env`:
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

#### 4. Check vite.config.ts
Ensure `envPrefix` is configured:
```typescript
export default defineConfig({
  envPrefix: ['VITE_', 'REACT_APP_'],
  // ...
});
```

---

## Issue: "require is not defined"

**Symptoms:**
```
Uncaught ReferenceError: require is not defined
```

**Root Cause:**
Using CommonJS `require()` in ES modules.

**Solution:**
Replace `require` with `import`:

```typescript
// ❌ Wrong
const { API_CONFIG } = require('../config/api');

// ✅ Correct
import { API_CONFIG } from '../config/api';
```

---

## Issue: Deposit Function Not Working

**Symptoms:**
- Deposit button doesn't work
- Console shows "deposit is not a function"
- Error: "Please connect wallet first"

**Solutions:**

#### 1. Check Wallet Connection
```typescript
const { isL2Connected, playerId } = useWallet();

// Both should be true/non-null before depositing
console.log('L2 Connected:', isL2Connected);
console.log('Player ID:', playerId);
```

#### 2. Verify Environment Variables
```env
# Required for deposit functionality
REACT_APP_DEPOSIT_CONTRACT=0x...
REACT_APP_TOKEN_CONTRACT=0x...
```

#### 3. Check SDK Configuration
In `main.tsx`:
```typescript
import { setProviderConfig, setRpcUrl } from 'zkwasm-minirollup-browser';

setProviderConfig({ type: 'rainbow' });
setRpcUrl(); // Uses VITE_ZKWASM_RPC_URL
```

---

## Issue: TypeScript Errors

**Symptoms:**
- Red squiggly lines in IDE
- Build fails with type errors

**Solutions:**

#### 1. Restart TypeScript Server
In VS Code:
1. Press `Ctrl + Shift + P`
2. Type "TypeScript: Restart TS Server"
3. Press Enter

#### 2. Check Type Definitions
Ensure `src/vite-env.d.ts` includes:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REACT_APP_URL: string
  readonly VITE_ZKWASM_RPC_URL: string
  // ... other vars
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

#### 3. Reinstall Dependencies
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

## Issue: Build Fails in Production

**Symptoms:**
- `npm run build` fails
- Production build has errors

**Solutions:**

#### 1. Check Environment Variables
Create `.env.production`:
```env
REACT_APP_URL=https://api.production.com
REACT_APP_NETWORK=mainnet
```

#### 2. Test Production Build Locally
```bash
npm run build
npm run preview
```

#### 3. Check for Console Logs
Remove all `console.log` statements (already done in this project).

---

## Issue: WebSocket Connection Fails

**Symptoms:**
- Real-time updates don't work
- Console shows WebSocket errors

**Solutions:**

#### 1. Check WebSocket URL
```typescript
// Should automatically convert http to ws
const wsUrl = import.meta.env.REACT_APP_URL.replace('http', 'ws');
console.log('WebSocket URL:', wsUrl);
```

#### 2. Verify Server is Running
```bash
# Check if backend is running
curl http://localhost:3000/health
```

#### 3. Check CORS Settings
Backend must allow WebSocket connections from your frontend origin.

---

## Development Tips

### Hot Reload Not Working

**Solution:**
```bash
# Use polling mode (slower but more reliable)
npm run dev:poll
```

### Port Already in Use

**Solution:**
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use different port
vite --port 5174
```

### Slow Build Times

**Solution:**
```bash
# Clear cache
rm -rf node_modules/.vite

# Disable source maps in development
# vite.config.ts
export default defineConfig({
  build: {
    sourcemap: false
  }
});
```

---

## Debugging Tools

### 1. React DevTools
Install React DevTools browser extension to inspect component state.

### 2. Network Tab
Check API calls in browser DevTools Network tab:
- Status codes
- Request/response bodies
- Timing

### 3. Console Logging
Temporarily add logs to debug:
```typescript
console.log('API Config:', API_CONFIG);
console.log('Wallet State:', { isL2Connected, playerId });
console.log('Market Data:', markets);
```

### 4. Vite Debug Mode
```bash
# Run with debug output
DEBUG=vite:* npm run dev
```

---

## Getting Help

If issues persist:

1. **Check Console**: Look for error messages in browser console
2. **Check Network**: Verify API calls are succeeding
3. **Check Environment**: Ensure all environment variables are set
4. **Clear Everything**: Try the "Nuclear Option" above
5. **Restart Everything**: Stop dev server, clear caches, restart

---

## Quick Checklist

Before reporting issues, verify:

- [ ] `.env` file exists with correct variables
- [ ] Dev server restarted after `.env` changes
- [ ] Browser cache cleared (hard refresh)
- [ ] Vite cache cleared (`rm -rf node_modules/.vite`)
- [ ] All dependencies installed (`npm install`)
- [ ] TypeScript server restarted
- [ ] Backend server is running
- [ ] Wallet is connected (for wallet-dependent features)
- [ ] No console errors in browser DevTools
- [ ] Using correct Node.js version (v18+)

---

## Emergency Reset

If nothing works, start fresh:

```bash
# 1. Stop all servers
# 2. Delete everything
rm -rf node_modules
rm -rf dist
rm -rf node_modules/.vite
rm package-lock.json

# 3. Reinstall
npm install

# 4. Clear browser
# - Clear all browser data for localhost
# - Close and reopen browser

# 5. Start fresh
npm run dev
```

