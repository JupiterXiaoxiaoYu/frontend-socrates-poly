/**
 * 份额计算工具
 * 基于 socrates-prediction-mkt 的手续费逻辑
 * 
 * 精度说明：
 * - USDC 精度：100 = 1.00 USDC（2位小数，美分精度）
 * - 价格精度：10000 = 100%（BPS，4位精度）
 */

// 常量定义（与后端一致）
export const PROTOCOL_FEE_BPS = 200;  // 2% = 200 basis points
export const PRICE_PRECISION = 10000;  // 价格精度：10000 = 1.0 (100%)
export const AMOUNT_PRECISION = 100;   // 金额精度：100 = 1.00 USDC（2位小数）
export const MIN_ORDER_AMOUNT_RAW = 100; // 后端最小订单数量（原始值，表示1.00 USDC）
export const MIN_ORDER_AMOUNT_USDC = 1; // 前端显示的最小订单金额（USDC）

export interface ShareCalculationInput {
  price: number;           // 价格（0-1，例如 0.6 = 60%）
  usdcAmount: number;      // 用户想投入的USDC金额
  orderType: 'BUY' | 'SELL';  // 买入还是卖出
  isFeeExempt?: boolean;   // 是否豁免手续费（默认false）
}

export interface ShareCalculationResult {
  shareAmount: number;      // 能得到的份额数量
  actualCost: number;       // 实际本金成本
  feeAmount: number;        // 手续费金额
  totalCost: number;        // 总成本（本金+手续费）
  effectivePrice: number;   // 有效价格（含手续费后的单价，0-1范围）
  rawShareAmount: number;   // 后端使用的原始份额数量
}

/**
 * 计算给定USDC投入能获得多少份额
 */
export function calculateSharesFromUSDC(
  input: ShareCalculationInput
): ShareCalculationResult {
  const { price, usdcAmount, orderType, isFeeExempt = false } = input;

  // 验证输入
  if (price <= 0 || price >= 1) {
    throw new Error('价格必须在 0-1 之间');
  }
  if (usdcAmount <= 0) {
    throw new Error('投入金额必须大于0');
  }

  // 计算单份额的成本价格
  let pricePerShare: number;
  if (orderType === 'BUY') {
    // 买入：价格就是成本
    pricePerShare = price;
  } else {
    // 卖出：成本是互补价格 (1 - price)
    pricePerShare = 1 - price;
  }

  // 计算手续费率
  const feeMultiplier = isFeeExempt 
    ? 1.0 
    : 1 + (PROTOCOL_FEE_BPS / PRICE_PRECISION);

  // 反推份额数量（用户视角的份额数量）
  // total_cost = pricePerShare × amount × feeMultiplier
  // amount = total_cost / (pricePerShare × feeMultiplier)
  const shareAmount = usdcAmount / (pricePerShare * feeMultiplier);

  // 后端需要的原始份额数量（乘以100，2位小数精度）
  const rawShareAmount = Math.floor(shareAmount * AMOUNT_PRECISION);

  // 确保满足最小订单数量
  if (rawShareAmount < MIN_ORDER_AMOUNT_RAW) {
    return {
      shareAmount: 0,
      actualCost: 0,
      feeAmount: 0,
      totalCost: 0,
      effectivePrice: 0,
      rawShareAmount: 0,
    };
  }

  // 根据实际能下单的份额重新计算精确的成本
  const actualShareAmount = rawShareAmount / AMOUNT_PRECISION;
  const actualCost = actualShareAmount * pricePerShare;
  const feeAmount = isFeeExempt ? 0 : actualCost * (PROTOCOL_FEE_BPS / PRICE_PRECISION);
  const totalCost = actualCost + feeAmount;
  const effectivePrice = actualShareAmount > 0 ? totalCost / actualShareAmount : 0;

  return {
    shareAmount: actualShareAmount,
    actualCost,
    feeAmount,
    totalCost,
    effectivePrice,
    rawShareAmount,
  };
}

/**
 * 反向计算：给定想要的份额数量，计算需要多少USDC
 */
export function calculateUSDCFromShares(
  price: number,
  shareAmount: number,
  orderType: 'BUY' | 'SELL',
  isFeeExempt: boolean = false
): ShareCalculationResult {
  // 计算单份额的成本价格
  let pricePerShare: number;
  if (orderType === 'BUY') {
    pricePerShare = price;
  } else {
    pricePerShare = 1 - price;
  }

  // 计算本金
  const actualCost = shareAmount * pricePerShare;

  // 计算手续费
  const feeAmount = isFeeExempt 
    ? 0 
    : actualCost * (PROTOCOL_FEE_BPS / PRICE_PRECISION);

  const totalCost = actualCost + feeAmount;
  const effectivePrice = shareAmount > 0 ? totalCost / shareAmount : 0;
  const rawShareAmount = Math.floor(shareAmount * AMOUNT_PRECISION);

  return {
    shareAmount,
    actualCost,
    feeAmount,
    totalCost,
    effectivePrice,
    rawShareAmount,
  };
}

/**
 * 验证订单金额是否满足最小要求
 */
export function validateOrderAmount(usdcAmount: number): {
  valid: boolean;
  error?: string;
} {
  if (usdcAmount < MIN_ORDER_AMOUNT_USDC) {
    return {
      valid: false,
      error: `最小订单金额为 $${MIN_ORDER_AMOUNT_USDC}`,
    };
  }
  return { valid: true };
}

/**
 * 验证价格是否在有效范围内
 */
export function validatePrice(price: number): {
  valid: boolean;
  error?: string;
} {
  if (price <= 0 || price >= 1) {
    return {
      valid: false,
      error: '价格必须在 0.01 到 0.99 之间',
    };
  }
  return { valid: true };
}

/**
 * 格式化显示结果
 */
export function formatCalculationResult(result: ShareCalculationResult): string {
  return `
份额数量: ${result.shareAmount.toFixed(2)}
本金成本: ${result.actualCost.toFixed(2)} USDC
手续费:   ${result.feeAmount.toFixed(2)} USDC (2%)
总成本:   ${result.totalCost.toFixed(2)} USDC
有效价格: ${(result.effectivePrice * 100).toFixed(2)}% (含手续费)
  `.trim();
}

