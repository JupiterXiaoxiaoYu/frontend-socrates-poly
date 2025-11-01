// API 集成测试示例
// 在组件中使用 API 的示例代码

import React, { useEffect } from 'react';
import { useMarket } from '../contexts';
import { formatCurrency, formatPercent, calculateProbabilities, fromUSDCPrecision } from '../lib/calculations';

// ==================== 示例 1: 显示市场列表 ====================

export function MarketListExample() {
  const { markets, globalState, isLoading } = useMarket();

  if (isLoading) {
    return <div>Loading markets...</div>;
  }

  return (
    <div>
      <h2>Active Markets</h2>
      <p>Current Tick: {globalState?.counter || 'Loading...'}</p>
      
      {markets.map((market) => {
        // 计算概率
        const upVolume = BigInt(market.upMarket.volume || '0');
        const downVolume = BigInt(market.downMarket.volume || '0');
        const { yesChance, noChance } = calculateProbabilities(upVolume, downVolume);
        
        // 计算总成交量
        const totalVolume = fromUSDCPrecision(market.upMarket.volume) + fromUSDCPrecision(market.downMarket.volume);
        
        return (
          <div key={market.marketId} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
            <h3>Market #{market.marketId}</h3>
            <p>Status: {market.status}</p>
            <p>Window: {market.windowMinutes} minutes</p>
            <p>Target Price: {formatCurrency(parseInt(market.oracleStartPrice) / 100)}</p>
            <p>YES Chance: {formatPercent(yesChance)}</p>
            <p>NO Chance: {formatPercent(noChance)}</p>
            <p>Total Volume: {formatCurrency(totalVolume)}</p>
          </div>
        );
      })}
    </div>
  );
}

// ==================== 示例 2: 下单 ====================

export function PlaceOrderExample() {
  const { placeOrder, isLoading } = useMarket();

  const handlePlaceOrder = async () => {
    try {
      await placeOrder({
        marketId: 1n,
        direction: 'UP',
        orderType: 'market_buy',
        price: 0n, // 市价单价格无意义
        amount: BigInt(10 * 1e6), // 10 USDC
      });
      console.log('Order placed successfully!');
    } catch (error) {
      console.error('Failed to place order:', error);
    }
  };

  return (
    <div>
      <h2>Place Order</h2>
      <button onClick={handlePlaceOrder} disabled={isLoading}>
        {isLoading ? 'Placing...' : 'Buy 10 USDC UP'}
      </button>
    </div>
  );
}

// ==================== 示例 3: 显示用户持仓 ====================

export function UserPositionsExample() {
  const { positions, markets, playerId } = useMarket();

  if (!playerId) {
    return <div>Please connect wallet and install player</div>;
  }

  // 筛选出份额持仓（排除 USDC）
  const sharePositions = positions.filter((p) => p.tokenIdx !== '0');

  // 筛选出 USDC 持仓
  const usdcPosition = positions.find((p) => p.tokenIdx === '0');
  const availableUSDC = usdcPosition ? fromUSDCPrecision(usdcPosition.balance) : 0;
  const lockedUSDC = usdcPosition ? fromUSDCPrecision(usdcPosition.lockBalance) : 0;

  return (
    <div>
      <h2>Your Positions</h2>
      
      <div>
        <h3>USDC Balance</h3>
        <p>Available: {formatCurrency(availableUSDC)}</p>
        <p>Locked: {formatCurrency(lockedUSDC)}</p>
        <p>Total: {formatCurrency(availableUSDC + lockedUSDC)}</p>
      </div>

      <h3>Market Positions</h3>
      {sharePositions.map((position) => {
        const tokenIdx = parseInt(position.tokenIdx);
        const marketId = Math.floor(tokenIdx / 2);
        const direction = tokenIdx % 2 === 1 ? 'UP' : 'DOWN';
        const shares = fromUSDCPrecision(position.balance);
        
        // 查找对应市场
        const market = markets.find((m) => m.marketId === marketId.toString());

        return (
          <div key={position.tokenIdx} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
            <h4>Market #{marketId} - {direction}</h4>
            <p>Shares: {shares.toFixed(2)}</p>
            {market && <p>Market Status: {market.status}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ==================== 示例 4: 实时数据更新 ====================

export function RealTimeDataExample() {
  const { markets, globalState, refreshData } = useMarket();
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  // 数据更新时记录时间
  useEffect(() => {
    setLastUpdate(new Date());
  }, [markets, globalState]);

  return (
    <div>
      <h2>Real-Time Data</h2>
      <p>Last Update: {lastUpdate.toLocaleTimeString()}</p>
      <p>Current Tick: {globalState?.counter || 'N/A'}</p>
      <p>Total Markets: {markets.length}</p>
      
      <button onClick={() => refreshData()}>
        Refresh Now
      </button>
      
      <p style={{ fontSize: '12px', color: '#666' }}>
        Note: Data auto-refreshes every 5 seconds
      </p>
    </div>
  );
}

// ==================== 示例 5: Claim 收益 ====================

export function ClaimExample() {
  const { claim, markets, isLoading } = useMarket();

  // 找到已解析的市场
  const resolvedMarkets = markets.filter((m) => m.status === 2); // RESOLVED

  const handleClaim = async (marketId: string) => {
    try {
      await claim(BigInt(marketId));
      console.log(`Claimed from market ${marketId}`);
    } catch (error) {
      console.error('Failed to claim:', error);
    }
  };

  if (resolvedMarkets.length === 0) {
    return <div>No resolved markets to claim from</div>;
  }

  return (
    <div>
      <h2>Claim Winnings</h2>
      {resolvedMarkets.map((market) => (
        <div key={market.marketId} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <h3>Market #{market.marketId}</h3>
          <p>Winning Outcome: {market.winningOutcome === 1 ? 'UP' : market.winningOutcome === 0 ? 'DOWN' : 'TIE'}</p>
          <button onClick={() => handleClaim(market.marketId)} disabled={isLoading}>
            {isLoading ? 'Claiming...' : 'Claim'}
          </button>
        </div>
      ))}
    </div>
  );
}

