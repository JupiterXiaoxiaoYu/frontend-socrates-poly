# zkWASM Prediction Market Frontend Integration

This document provides a comprehensive guide to the zkWASM prediction market frontend integration built according to the reference patterns from the launchpad projects.

## Overview

The integration provides a complete TypeScript-based frontend solution for interacting with zkWASM prediction markets, including:

- **Wallet Management**: Seamless integration with zkWASM SDK for wallet connections
- **API Layer**: Complete backend command implementation with all 11 prediction market commands
- **State Management**: React Context-based state management with real-time polling
- **Type Safety**: Full TypeScript coverage for all data structures and operations
- **Utilities**: Comprehensive calculation and validation utilities

## Architecture

### File Structure

```
src/
├── contexts/
│   ├── WalletContext.tsx          # zkWASM wallet context wrapper
│   ├── PredictionMarketContext.tsx # Main state management
│   └── index.ts                   # Context exports
├── services/
│   ├── api.ts                     # PredictionMarketAPI class
│   └── index.ts                   # Service exports
├── types/
│   ├── prediction-market.ts       # Type definitions
│   └── index.ts                   # Type exports
├── utils/
│   ├── prediction-market.ts       # Utility functions
│   └── index.ts                   # Utility exports
├── components/
│   └── PredictionMarketExample.tsx # Example implementation
└── App.tsx                        # Updated with providers
```

### Core Components

#### 1. WalletContext (`contexts/WalletContext.tsx`)
- Re-exports zkWASM SDK's `useWalletContext` as `useWallet`
- Provides seamless wallet integration without additional wrapper logic
- Follows reference pattern from launchpad projects

#### 2. PredictionMarketAPI (`services/api.ts`)
Extends `PlayerConvention` with all backend commands:

```typescript
// Backend Commands (1-11)
- INSTALL_PLAYER = 1
- DEPOSIT = 2
- WITHDRAW = 3
- PLACE_ORDER = 4
- CANCEL_ORDER = 5
- CLAIM = 6
- CREATE_MARKET = 7
- CLOSE_MARKET = 8
- EXECUTE_TRADE = 9
- RESOLVE_MARKET = 10
- SET_FEE_EXEMPT = 11
```

#### 3. PredictionMarketContext (`contexts/PredictionMarketContext.tsx`)
- Manages application state with React Context
- Implements real-time polling (5-second intervals)
- Handles wallet connection/disconnection logic
- Provides error handling and transaction states
- Fallback mode for public data access

#### 4. Types (`types/prediction-market.ts`)
Complete TypeScript definitions for:
- Market data structures
- Order and trade data
- User positions and stats
- Transaction history
- API interfaces and validation types

## Setup Instructions

### 1. Install Dependencies

```bash
npm install zkwasm-minirollup-browser zkwasm-minirollup-rpc delphinus-curves
```

### 2. Configure Vite

The `vite.config.ts` includes necessary polyfills for zkWASM:

```typescript
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
      include: ['crypto', 'stream', 'buffer', 'process', 'util', 'fs', 'path', 'os', 'url']
    })
  ],
  define: {
    global: 'globalThis',
    'global.Buffer': 'global.Buffer',
    'global.process': 'global.process',
  },
  optimizeDeps: {
    include: [
      'zkwasm-minirollup-browser',
      'zkwasm-minirollup-rpc',
      'delphinus-curves'
    ]
  }
});
```

### 3. Wrap App with Providers

```tsx
// App.tsx
import { DelphinusReactProvider } from 'zkwasm-minirollup-browser';
import { PredictionMarketProvider } from './contexts';

const predictionMarketConfig = {
  serverUrl: import.meta.env.VITE_SERVER_URL || "http://localhost:3000",
  privkey: import.meta.env.VITE_PRIVATE_KEY
};

const App = () => (
  <DelphinusReactProvider config={zkwasmConfig}>
    <PredictionMarketProvider config={predictionMarketConfig}>
      {/* Your app content */}
    </PredictionMarketProvider>
  </DelphinusReactProvider>
);
```

## Usage Examples

### Basic Usage

```tsx
import { usePredictionMarket } from './contexts';

function MyComponent() {
  const {
    isConnected,
    markets,
    loading,
    error,
    placeOrder,
    createMarket
  } = usePredictionMarket();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {markets.map(market => (
        <div key={market.marketId}>
          <h3>{market.question}</h3>
          <p>YES: {market.probability1.toFixed(2)}%</p>
          <p>NO: {market.probability2.toFixed(2)}%</p>
        </div>
      ))}
    </div>
  );
}
```

### Specialized Hooks

```tsx
import { useMarkets, useUserPortfolio, useMarketOperations } from './contexts';

// For market data
const { markets, getMarket } = useMarkets();

// For user portfolio
const { positions, stats } = useUserPortfolio();

// For market operations
const { placeOrder, claimWinnings } = useMarketOperations();
```

### Creating a Market

```tsx
const handleCreateMarket = async () => {
  try {
    await createMarket({
      question: "Will Bitcoin reach $100k by end of 2024?",
      outcome1: "Yes",
      outcome2: "No",
      endTimeOffset: 86400n * 30, // 30 days
      fee: 100n // 1% fee
    });
    console.log("Market created successfully");
  } catch (error) {
    console.error("Failed to create market:", error);
  }
};
```

### Placing an Order

```tsx
const handlePlaceOrder = async () => {
  try {
    await placeOrder({
      marketId: BigInt(marketId),
      orderType: 'YES',
      outcome: 1,
      amount: BigInt(1000), // 1000 points
      price: BigInt(5000)   // 50% probability
    });
    console.log("Order placed successfully");
  } catch (error) {
    console.error("Failed to place order:", error);
  }
};
```

## Utility Functions

### Price Calculations

```tsx
import {
  basisPointsToDecimal,
  decimalToBasisPoints,
  calculatePotentialReturn,
  formatPrice
} from './utils';

const priceDecimal = basisPointsToDecimal(5000); // 0.5
const priceBasisPoints = decimalToBasisPoints(0.5); // 5000
const potentialReturn = calculatePotentialReturn(1000, 5000, 'YES');
const formattedPrice = formatPrice(5000); // "50.0%"
```

### Time Calculations

```tsx
import { calculateTimeRemaining, isMarketActive } from './utils';

const timeRemaining = calculateTimeRemaining(market.endTime);
const isActive = isMarketActive(market);
console.log(`Ends in: ${timeRemaining.formatted}`);
```

## Configuration

### Environment Variables

Create `.env` file:

```env
VITE_SERVER_URL=http://localhost:3000
VITE_PRIVATE_KEY=your_private_key_here
```

### Backend API Endpoints

The integration expects these REST API endpoints:

- `GET /data/markets` - All markets
- `GET /data/market/:id` - Single market
- `GET /data/market/:id/orders` - Market orders
- `GET /data/market/:id/trades` - Market trades
- `GET /data/market/:id/trade-history` - Trade history
- `GET /data/player/:pid1/:pid2/positions` - User positions
- `GET /data/state` - Global state

## Error Handling

The integration provides comprehensive error handling:

```tsx
const { transactionState, error } = usePredictionMarket();

if (transactionState.status === 'ERROR') {
  console.error("Transaction failed:", transactionState.error);
}

if (error) {
  console.error("General error:", error);
}
```

Common error patterns are automatically translated to user-friendly messages:

- `"InvalidOrderAmount"` → "Invalid order amount. Please ensure..."
- `"InsufficientBalance"` → "Insufficient balance. Please deposit..."
- `"MarketNotActive"` → "This market is not currently active..."

## State Management

The context provides real-time state updates:

```tsx
const {
  markets,           // All markets (updates every 5s)
  userPositions,     // User's positions
  userStats,         // User statistics
  globalState,       // Global market state
  loading,           // Loading state
  transactionState   // Current transaction status
} = usePredictionMarket();
```

## Features

### ✅ Implemented

- ✅ Full zkWASM wallet integration
- ✅ All 11 backend commands implemented
- ✅ Real-time data polling (5-second intervals)
- ✅ Comprehensive TypeScript types
- ✅ Error handling with user-friendly messages
- ✅ Fallback mode for public data
- ✅ Price and probability calculations
- ✅ Time-based market status updates
- ✅ Transaction state management
- ✅ Position tracking and PnL calculations
- ✅ Validation utilities

### 🚀 Advanced Features

- 🚀 Slippage calculations
- 🚀 Risk management utilities
- 🚀 Portfolio concentration analysis
- 🚀 Market creation and resolution
- 🚀 Order book management
- 🚀 Claim winnings functionality

## Testing

The example component `PredictionMarketExample.tsx` demonstrates all features and can be used for testing:

```tsx
import PredictionMarketExample from './components/PredictionMarketExample';

function App() {
  return (
    <DelphinusReactProvider config={zkwasmConfig}>
      <PredictionMarketProvider config={predictionMarketConfig}>
        <PredictionMarketExample />
      </PredictionMarketProvider>
    </DelphinusReactProvider>
  );
}
```

## Troubleshooting

### Common Issues

1. **"L2 account not available"**
   - Ensure wallet is connected and logged into L2
   - Check network configuration

2. **"Player not installed"**
   - Auto-installation should handle this
   - Check backend connectivity

3. **API initialization failures**
   - Verify server URL is correct
   - Check CORS settings on backend

4. **Type errors**
   - Ensure all dependencies are installed
   - Check TypeScript configuration

### Debug Mode

Enable console logging by setting:

```tsx
const predictionMarketConfig = {
  serverUrl: "http://localhost:3000",
  privkey: undefined, // Use fallback mode for debugging
  debug: true // Add debug logging if needed
};
```

## Best Practices

1. **Error Boundaries**: Wrap components in error boundaries
2. **Loading States**: Always show loading states during operations
3. **Transaction Feedback**: Provide clear feedback for all transactions
4. **Validation**: Use provided validation utilities
5. **Type Safety**: Leverage TypeScript types throughout
6. **Polling**: Be mindful of polling frequency and data usage

## Contributing

When extending the integration:

1. Follow established patterns from reference projects
2. Maintain TypeScript type coverage
3. Add comprehensive error handling
4. Update utility functions as needed
5. Document new features and APIs

## Support

For issues related to:
- **zkWASM SDK**: Refer to official documentation
- **Backend Integration**: Check API endpoint compatibility
- **Frontend Integration**: Review this documentation and example code