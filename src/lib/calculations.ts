import { PRICE_PRECISION, PROTOCOL_FEE_BPS } from './constants';

/**
 * Convert BPS (basis points) to percentage
 */
export function bpsToPercent(bps: number): number {
  return bps / 100;
}

/**
 * Convert percentage to BPS
 */
export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}

/**
 * Calculate cost for buying shares at a given price
 */
export function calculateCost(shares: number, priceBps: number): number {
  return (shares * priceBps) / PRICE_PRECISION;
}

/**
 * Calculate potential payout for winning shares
 */
export function calculatePayout(shares: number): number {
  return shares; // Each winning share = $1
}

/**
 * Calculate protocol fee
 */
export function calculateFee(amount: number, isFeeExempt: boolean): number {
  if (isFeeExempt) return 0;
  return (amount * PROTOCOL_FEE_BPS) / PRICE_PRECISION;
}

/**
 * Calculate shares received for a given dollar amount at current price
 */
export function calculateShares(dollarAmount: number, priceBps: number): number {
  if (priceBps === 0) return 0;
  return (dollarAmount * PRICE_PRECISION) / priceBps;
}

/**
 * Calculate yes/no probabilities from order book
 */
export function calculateProbabilities(yesPrice: number): {
  yesChance: number;
  noChance: number;
} {
  const yesChance = bpsToPercent(yesPrice);
  const noChance = 100 - yesChance;
  return { yesChance, noChance };
}

/**
 * Calculate unrealized P&L for a position
 */
export function calculateUnrealizedPnL(
  shares: number,
  avgPrice: number,
  currentPrice: number
): {
  pnl: number;
  pnlPercent: number;
} {
  const cost = calculateCost(shares, avgPrice);
  const currentValue = calculateCost(shares, currentPrice);
  const pnl = currentValue - cost;
  const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
  
  return { pnl, pnlPercent };
}

/**
 * Calculate total portfolio value
 */
export function calculatePortfolioValue(
  cash: number,
  positions: Array<{ shares: number; currentPrice: number }>
): number {
  const positionsValue = positions.reduce((total, pos) => {
    return total + calculateCost(pos.shares, pos.currentPrice);
  }, 0);
  
  return cash + positionsValue;
}

/**
 * Calculate slippage for market orders
 */
export function calculateSlippage(
  amount: number,
  orderBook: Array<{ price: number; amount: number }>
): number {
  let remainingAmount = amount;
  let totalCost = 0;
  
  for (const level of orderBook) {
    const fillAmount = Math.min(remainingAmount, level.amount);
    totalCost += calculateCost(fillAmount, level.price);
    remainingAmount -= fillAmount;
    
    if (remainingAmount <= 0) break;
  }
  
  if (remainingAmount > 0) {
    // Not enough liquidity
    return Infinity;
  }
  
  const avgPrice = (totalCost / amount) * PRICE_PRECISION;
  const firstPrice = orderBook[0]?.price || 0;
  
  return Math.abs(avgPrice - firstPrice) / firstPrice * 100;
}
