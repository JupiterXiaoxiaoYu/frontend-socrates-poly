# Deposit & Withdraw Implementation Summary

## Overview

Successfully integrated Deposit and Withdraw functionality using the **zkWasm SDK's built-in methods** from `useWallet()` context.

## Key Changes

### 1. Using SDK's Deposit Method

**Before (Incorrect):**
```typescript
// ❌ Tried to use resolvePidFromProcessingKey (admin only)
await playerClient.depositTo(playerClient.processingKey, amount);
```

**After (Correct):**
```typescript
// ✅ Use SDK's deposit method from useWallet
const { deposit: walletDeposit } = useWallet();

await walletDeposit({
  tokenIndex: 0,  // USDC token index
  amount: amountInEther  // Amount in ether (not wei)
});
```

### 2. MarketContext Implementation

**File:** `src/contexts/MarketContext.tsx`

```typescript
export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get deposit method from SDK's wallet context
  const { l2Account, deposit: walletDeposit } = useWallet();
  
  // Wrap SDK's deposit with our app logic
  const deposit = useCallback(async (amount: bigint) => {
    if (!walletDeposit || !playerId) {
      throw new Error('Please connect wallet first');
    }

    setIsLoading(true);
    try {
      // Convert from precision format (bigint) to ether (number)
      const amountInEther = Number(amount) / 100;
      
      // Use SDK's deposit method
      await walletDeposit({
        tokenIndex: 0, // USDC
        amount: amountInEther
      });
      
      toast({
        title: 'Deposit Successful',
        description: `Successfully deposited ${amountInEther} USDC`,
      });

      // Refresh data
      await Promise.all([
        refreshData(),
        loadUserData()
      ]);
    } catch (error) {
      toast({
        title: 'Deposit Failed',
        description: error instanceof Error ? error.message : 'Failed to deposit',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletDeposit, playerId, refreshData, loadUserData, toast]);
  
  // ... rest of the code
};
```

### 3. Withdraw Implementation

**File:** `src/contexts/MarketContext.tsx`

```typescript
const withdraw = useCallback(async (amount: bigint) => {
  if (!playerClient) {
    throw new Error('API not ready');
  }

  setIsLoading(true);
  try {
    // Use playerClient's withdraw method
    await playerClient.withdraw(amount);
    
    toast({
      title: 'Withdraw Successful',
      description: `Successfully withdrew ${Number(amount) / 100} USDC`,
    });

    // Refresh data
    await Promise.all([
      refreshData(),
      loadUserData()
    ]);
  } catch (error) {
    toast({
      title: 'Withdraw Failed',
      description: error instanceof Error ? error.message : 'Failed to withdraw',
      variant: 'destructive',
    });
    throw error;
  } finally {
    setIsLoading(false);
  }
}, [playerClient, refreshData, loadUserData, toast]);
```

## SDK Integration

### WalletContextType Interface

From `zkwasm-minirollup-browser`:

```typescript
export interface WalletContextType {
  isConnected: boolean;
  isL2Connected: boolean;
  l1Account: any | undefined;
  l2Account: any | undefined;
  playerId: [string, string] | null;
  address: string | undefined;
  chainId: number | undefined;
  connectL1: () => Promise<void>;
  connectL2: () => Promise<void>;
  disconnect: () => Promise<void>;
  setPlayerId: (id: [string, string]) => void;
  deposit: (params: {
    tokenIndex: number;
    amount: number;
  }) => Promise<SerializableTransactionReceipt>;
}
```

### Usage Pattern

```typescript
import { useWallet } from './contexts/WalletContext';

function MyComponent() {
  const { deposit, isL2Connected, playerId } = useWallet();
  
  const handleDeposit = async () => {
    if (!isL2Connected || !playerId) {
      alert('Please connect wallet first');
      return;
    }
    
    try {
      await deposit({
        tokenIndex: 0,  // Token index (0 for USDC)
        amount: 10      // Amount in ether (not wei)
      });
      alert('Deposit successful!');
    } catch (error) {
      alert('Deposit failed: ' + error.message);
    }
  };
  
  return <button onClick={handleDeposit}>Deposit 10 USDC</button>;
}
```

## Components

### DepositDialog Component

**File:** `src/components/DepositDialog.tsx`

**Features:**
- Display current balance
- Input amount with validation
- Quick amount buttons (10, 50, 100, 500)
- Minimum deposit: 1 USDC
- All text in English

### WithdrawDialog Component

**File:** `src/components/WithdrawDialog.tsx`

**Features:**
- Display available balance
- Input amount with validation
- Quick amount buttons (10, 50, 100, 500, Max)
- Minimum withdrawal: 1 USDC
- Balance validation
- All text in English

### Wallet Page Integration

**File:** `src/pages/Wallet.tsx`

```typescript
const Wallet = () => {
  const { positions, playerId, deposit, withdraw } = useMarket();
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle deposit
  const handleDeposit = async (amount: number) => {
    setIsProcessing(true);
    try {
      // Convert to precision format (amount * 100)
      const amountWithPrecision = BigInt(Math.round(amount * 100));
      await deposit(amountWithPrecision);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle withdrawal
  const handleWithdraw = async (amount: number) => {
    setIsProcessing(true);
    try {
      // Convert to precision format (amount * 100)
      const amountWithPrecision = BigInt(Math.round(amount * 100));
      await withdraw(amountWithPrecision);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // ... JSX with dialogs
};
```

## Amount Precision Handling

### Frontend to Backend
```typescript
// User inputs: 100.50 USDC
const userInput = 100.50;

// Convert to precision format for backend
const amountWithPrecision = BigInt(Math.round(userInput * 100));
// Result: 10050n

// Pass to deposit/withdraw
await deposit(amountWithPrecision);
```

### Backend to Frontend
```typescript
// Backend returns: 10050n
const backendAmount = 10050n;

// Convert to display format
const displayAmount = Number(backendAmount) / 100;
// Result: 100.50
```

### SDK Deposit (Special Case)
```typescript
// SDK expects amount in ether (not wei)
const amountInEther = Number(amount) / 100;

await walletDeposit({
  tokenIndex: 0,
  amount: amountInEther  // Direct ether amount
});
```

## Important Notes

### ❌ Don't Use in Frontend
- `resolvePidFromProcessingKey()` - Admin only method
- `depositTo()` - Admin only method for depositing to other players

### ✅ Use Instead
- `useWallet().deposit()` - SDK's deposit method for current user
- `playerClient.withdraw()` - Standard withdraw method

### Why SDK's Deposit?
1. **L1 Integration**: SDK's deposit handles L1 contract interaction
2. **Signature Management**: Automatically manages wallet signatures
3. **Transaction Tracking**: Returns transaction receipt
4. **Error Handling**: Built-in error handling and validation

### Deposit Flow
1. User clicks "Deposit" button
2. Opens DepositDialog
3. User enters amount
4. Calls `walletDeposit()` from SDK
5. SDK interacts with L1 deposit contract
6. User signs transaction in wallet
7. Transaction confirmed on L1
8. Funds deposited to L2 account
9. Refresh user data

### Withdraw Flow
1. User clicks "Withdraw" button
2. Opens WithdrawDialog
3. User enters amount
4. Calls `playerClient.withdraw()`
5. Creates withdraw command
6. Sends transaction to L2
7. Funds withdrawn from L2 account
8. Refresh user data

## Testing Checklist

- [x] Deposit dialog opens and closes
- [x] Withdraw dialog opens and closes
- [x] Amount input validation
- [x] Quick amount buttons work
- [x] "Max" button for withdraw
- [x] Minimum amount validation (1 USDC)
- [x] Balance validation for withdraw
- [x] Wallet connection check
- [x] Loading states
- [x] Success/error toasts
- [x] Data refresh after operations
- [x] All text in English
- [x] Using SDK's deposit method
- [x] Not using resolvePidFromProcessingKey

## Files Modified

1. `src/contexts/MarketContext.tsx` - Added deposit/withdraw methods
2. `src/components/DepositDialog.tsx` - New deposit dialog component
3. `src/components/WithdrawDialog.tsx` - New withdraw dialog component
4. `src/pages/Wallet.tsx` - Integrated dialogs and handlers
5. `src/services/api.ts` - Added comments about admin-only methods

## Dependencies

- `zkwasm-minirollup-browser` - Provides `useWallet()` with deposit method
- `zkwasm-minirollup-rpc` - Provides `PlayerConvention` with withdraw method
- `@/components/ui/*` - Shadcn UI components for dialogs

## Environment Variables

Make sure these are set:
```env
REACT_APP_URL=http://localhost:3000
REACT_APP_DEPOSIT_CONTRACT=0x...
REACT_APP_TOKEN_CONTRACT=0x...
```

## Next Steps

1. Test deposit flow with real wallet
2. Test withdraw flow with real wallet
3. Monitor transaction receipts
4. Add transaction history tracking
5. Consider adding transaction status polling
6. Add more detailed error messages
7. Consider adding transaction fee display

