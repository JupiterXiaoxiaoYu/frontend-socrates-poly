// 计算工具函数
// 用于价格、费用、时间等计算

// ==================== 常量 ====================

export const TICK_SECONDS = 5;              // 5 秒 = 1 tick
export const GRACE_PERIOD_TICKS = 12;       // 1 分钟
export const PROTOCOL_FEE_BPS = 200;        // 2%
export const PRICE_PRECISION = 10000;       // BPS 精度
export const AMOUNT_PRECISION = 100;        // USDC/份额精度（2位小数: 100=1.00）

// 市场窗口（tick）
export const MARKET_WINDOWS = {
  ONE_MIN: 12,    // 12 ticks = 1 分钟
  THREE_MIN: 36,  // 36 ticks = 3 分钟
  FIVE_MIN: 60,   // 60 ticks = 5 分钟
};

// ==================== 精度转换 ====================

// BPS 转百分比 (5000 -> 50)
export function bpsToPercent(bps: number): number {
  return bps / 100;
}

// 百分比转 BPS (50 -> 5000)
export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}

// USDC 数量转换（链上 -> 显示）(100 -> 1.00)
export function fromUSDCPrecision(amount: string | number): number {
  const num = typeof amount === 'string' ? parseInt(amount) : amount;
  return num / AMOUNT_PRECISION;
}

// USDC 数量转换（显示 -> 链上）(1.00 -> 100)
export function toUSDCPrecision(amount: number): bigint {
  return BigInt(Math.floor(amount * AMOUNT_PRECISION));
}

// 价格转换（链上 -> 显示）(4350000 -> 43500.00)
export function fromPricePrecision(price: string | number): number {
  const num = typeof price === 'string' ? parseInt(price) : price;
  return num / 100;
}

// 价格转换（显示 -> 链上）(43500.00 -> 4350000)
export function toPricePrecision(price: number): bigint {
  return BigInt(Math.floor(price * 100));
}

// ==================== 价格计算 ====================

// 计算购买成本（份额 × 价格）
export function calculateCost(shares: number, priceBps: number): number {
  return (shares * priceBps) / PRICE_PRECISION;
}

// 计算潜在收益（每份 = 1 USDC）
export function calculatePayout(shares: number): number {
  return shares;
}

// 计算手续费
export function calculateFee(amount: number, isFeeExempt: boolean): number {
  if (isFeeExempt) return 0;
  return (amount * PROTOCOL_FEE_BPS) / PRICE_PRECISION;
}

// 根据流动性计算概率
// 根据最新成交价格或成交量计算概率
export function calculateProbabilities(
  priceOrVolume?: number | bigint,
  downVolume?: bigint
): {
  yesChance: number;
  noChance: number;
} {
  // 如果提供了两个参数，使用成交量逻辑
  if (downVolume !== undefined && typeof priceOrVolume === 'bigint') {
    const up = Number(priceOrVolume);
    const down = Number(downVolume);
    const total = up + down;

    if (total === 0) {
      return { yesChance: 50, noChance: 50 };
    }

    return {
      yesChance: (up / total) * 100,
      noChance: (down / total) * 100,
    };
  }

  // 如果只提供一个参数（价格），使用价格逻辑
  if (typeof priceOrVolume === 'number') {
    const yesChance = priceOrVolume;
    const noChance = 100 - priceOrVolume;
    return { yesChance, noChance };
  }

  // 默认 50/50
  return { yesChance: 50, noChance: 50 };
}

// 计算市场总成交量
export function calculateTotalVolume(upVolume: string, downVolume: string): number {
  const up = fromUSDCPrecision(upVolume);
  const down = fromUSDCPrecision(downVolume);
  return up + down;
}

// ==================== 时间计算 ====================

// Tick 转时间戳（毫秒）
export function tickToTimestamp(tick: number, deploymentTime: number): number {
  return deploymentTime + tick * TICK_SECONDS * 1000;
}

// 时间戳转 Tick
export function timestampToTick(timestamp: number, deploymentTime: number): number {
  return Math.floor((timestamp - deploymentTime) / (TICK_SECONDS * 1000));
}

// 计算剩余时间（秒）
export function calculateTimeRemaining(currentTick: number, endTick: number): number {
  const remainingTicks = Math.max(0, endTick - currentTick);
  return remainingTicks * TICK_SECONDS;
}

// 格式化剩余时间 "MM:SS"
export function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 格式化时间 "HH:MM:SS"
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// ==================== Token 索引 ====================

// Token 索引常量
export const TOKEN_USDC = 0;

// 计算市场份额的 token 索引
export function getTokenIdx(marketId: number, direction: 'UP' | 'DOWN'): number {
  // Market 1: UP=1, DOWN=2
  // Market N: UP=N*2-1, DOWN=N*2
  return direction === 'UP' ? marketId * 2 - 1 : marketId * 2;
}

// 从 token 索引反推市场 ID 和方向
export function parseTokenIdx(tokenIdx: number): {
  marketId: number;
  direction: 'UP' | 'DOWN';
} | null {
  if (tokenIdx === 0) return null; // USDC
  
  // tokenIdx 规则：奇数=UP，偶数=DOWN
  // Market 1: UP=1, DOWN=2
  // Market 2: UP=3, DOWN=4
  // Market 82: UP=163, DOWN=164
  // Market 83: UP=165, DOWN=166
  
  if (tokenIdx % 2 === 1) {
    // 奇数 = UP
    const marketId = (tokenIdx - 1) / 2;
    return { marketId, direction: 'UP' };
  } else {
    // 偶数 = DOWN
    const marketId = (tokenIdx - 2) / 2;
    return { marketId, direction: 'DOWN' };
  }
}

// ==================== 数字格式化 ====================

// 格式化数字（带千分位）
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// 格式化货币
export function formatCurrency(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// 格式化百分比
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// 格式化大数字（K/M/B）
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

// ==================== 市场标题生成 ====================

// 生成市场标题（使用当地时区，英文格式，24小时制）
export function generateMarketTitle(
  asset: 'BTC' | 'ETH',
  targetPrice: number,
  startTime: number,
  windowMinutes?: number
): string {
  const price = formatCurrency(targetPrice, 2);
  
  // 如果提供了窗口时间，使用结束时间；否则使用开始时间
  const displayTime = windowMinutes 
    ? startTime + (windowMinutes * 60)
    : startTime;
    
  const time = new Date(displayTime * 1000).toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
    hour12: false,
  });
  
  return `${asset} above ${price} at ${time}?`;
}

// ==================== 市场状态判断 ====================

import { MarketStatus } from '../types/api';

export function getMarketStatusLabel(status: MarketStatus): string {
  const labels = {
    [MarketStatus.Pending]: 'Pending',
    [MarketStatus.Active]: 'Live',
    [MarketStatus.Resolved]: 'Settled',
    [MarketStatus.Closed]: 'Closed',
  };
  return labels[status] || 'Unknown';
}

export function getMarketBadge(status: MarketStatus): string {
  const badges = {
    [MarketStatus.Pending]: 'Pending',
    [MarketStatus.Active]: 'Live',
    [MarketStatus.Resolved]: 'Settled',
    [MarketStatus.Closed]: 'Closed',
  };
  return badges[status] || 'Unknown';
}

// ==================== P&L 计算 ====================

// 计算未实现盈亏
export function calculateUnrealizedPnL(
  shares: number,
  avgPrice: number,
  currentPrice: number
): {
  pnl: number;
  pnlPercent: number;
} {
  const cost = shares * (avgPrice / PRICE_PRECISION);
  const value = shares * (currentPrice / PRICE_PRECISION);
  const pnl = value - cost;
  const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
  
  return { pnl, pnlPercent };
}

// 计算已实现盈亏
export function calculateRealizedPnL(
  shares: number,
  avgCost: number,
  outcome: 'win' | 'lose' | 'tie'
): number {
  if (outcome === 'tie') return 0;
  if (outcome === 'lose') return -avgCost;
  return shares - avgCost; // 每份 = 1 USDC
}
