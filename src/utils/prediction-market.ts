import type { MarketData, OrderData, PositionData, PriceInfo, OrderType } from '../types/prediction-market';

// MARK: - Price and Probability Calculations

/**
 * Convert price from basis points to decimal (0-1)
 * @param priceInBasisPoints Price in basis points (0-10000)
 * @returns Price as decimal (0-1)
 */
export const basisPointsToDecimal = (priceInBasisPoints: number | bigint): number => {
    return Number(priceInBasisPoints) / 10000;
};

/**
 * Convert price from decimal (0-1) to basis points
 * @param priceDecimal Price as decimal (0-1)
 * @returns Price in basis points (0-10000)
 */
export const decimalToBasisPoints = (priceDecimal: number): number => {
    return Math.round(priceDecimal * 10000);
};

/**
 * Calculate probabilities from order book
 * @param orders Array of orders
 * @returns Object with probability1 and probability2
 */
export const calculateProbabilitiesFromOrders = (orders: OrderData[]): { probability1: number; probability2: number } => {
    if (!orders || orders.length === 0) {
        return { probability1: 0.5, probability2: 0.5 };
    }

    const yesOrders = orders.filter(order => order.orderType === 'YES');
    const noOrders = orders.filter(order => order.orderType === 'NO');

    // Calculate total volume for each side
    const yesVolume = yesOrders.reduce((sum, order) => {
        const amount = parseFloat(order.remainingAmount);
        const price = parseFloat(order.price);
        return sum + (amount * price);
    }, 0);

    const noVolume = noOrders.reduce((sum, order) => {
        const amount = parseFloat(order.remainingAmount);
        const price = parseFloat(order.price);
        return sum + (amount * price);
    }, 0);

    const totalVolume = yesVolume + noVolume;

    if (totalVolume === 0) {
        return { probability1: 0.5, probability2: 0.5 };
    }

    const probability1 = yesVolume / totalVolume;
    const probability2 = noVolume / totalVolume;

    return { probability1, probability2 };
};

/**
 * Calculate probabilities from market liquidity
 * @param totalLiquidity Total liquidity in the market
 * @param outcome1Liquidity Liquidity for outcome 1
 * @returns Object with probability1 and probability2
 */
export const calculateProbabilitiesFromLiquidity = (
    totalLiquidity: bigint,
    outcome1Liquidity: bigint
): { probability1: number; probability2: number } => {
    if (totalLiquidity === 0n) {
        return { probability1: 0.5, probability2: 0.5 };
    }

    const probability1 = Number(outcome1Liquidity) / Number(totalLiquidity);
    const probability2 = 1 - probability1;

    return { probability1, probability2 };
};

/**
 * Calculate potential return for an order
 * @param amount Order amount
 * @param price Order price in basis points
 * @param orderType Order type (YES/NO)
 * @returns Potential return amount
 */
export const calculatePotentialReturn = (
    amount: number,
    price: number,
    orderType: OrderType
): number => {
    const priceDecimal = basisPointsToDecimal(price);

    if (orderType === 'YES') {
        // YES orders: If outcome 1 happens, you get 1.0 per unit, otherwise 0
        return amount * (1 / priceDecimal);
    } else {
        // NO orders: If outcome 2 happens, you get 1.0 per unit, otherwise 0
        return amount * (1 / (1 - priceDecimal));
    }
};

/**
 * Calculate implied probability from price
 * @param price Order price in basis points
 * @param orderType Order type (YES/NO)
 * @returns Implied probability (0-1)
 */
export const calculateImpliedProbability = (price: number, orderType: OrderType): number => {
    const priceDecimal = basisPointsToDecimal(price);
    return orderType === 'YES' ? priceDecimal : 1 - priceDecimal;
};

/**
 * Calculate price from probability
 * @param probability Probability (0-1)
 * @param orderType Order type (YES/NO)
 * @returns Price in basis points
 */
export const calculatePriceFromProbability = (probability: number, orderType: OrderType): number => {
    const clampedProbability = Math.max(0.0001, Math.min(0.9999, probability));

    if (orderType === 'YES') {
        return decimalToBasisPoints(clampedProbability);
    } else {
        return decimalToBasisPoints(1 - clampedProbability);
    }
};

// MARK: - Time and Status Calculations

/**
 * Calculate time remaining for a market
 * @param endTime End time timestamp
 * @param currentTime Current time timestamp (default: now)
 * @returns Object with time remaining in various units
 */
export const calculateTimeRemaining = (endTime: string, currentTime?: number) => {
    const end = parseInt(endTime);
    const current = currentTime || Math.floor(Date.now() / 1000);
    const remaining = Math.max(0, end - current);

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    return {
        totalSeconds: remaining,
        days,
        hours,
        minutes,
        seconds,
        isExpired: remaining === 0,
        formatted: `${days}d ${hours}h ${minutes}m`
    };
};

/**
 * Get market status based on time and resolution
 * @param market Market data
 * @param currentTime Current time timestamp (default: now)
 * @returns Market status
 */
export const getMarketStatus = (
    market: MarketData,
    currentTime?: number
): MarketData['status'] => {
    const current = currentTime || Math.floor(Date.now() / 1000);
    const endTime = parseInt(market.endTime);

    if (market.resolvedOutcome && market.resolvedOutcome > 0) {
        return 'RESOLVED';
    }

    if (current >= endTime) {
        return 'CLOSED';
    }

    if (market.status === 'PENDING') {
        return 'PENDING';
    }

    return 'ACTIVE';
};

/**
 * Check if a market is active for trading
 * @param market Market data
 * @param currentTime Current time timestamp (default: now)
 * @returns Boolean indicating if market is active
 */
export const isMarketActive = (market: MarketData, currentTime?: number): boolean => {
    const status = getMarketStatus(market, currentTime);
    return status === 'ACTIVE';
};

// MARK: - Order and Position Calculations

/**
 * Calculate average price for multiple orders
 * @param orders Array of orders
 * @returns Average price in basis points
 */
export const calculateAveragePrice = (orders: OrderData[]): number => {
    if (!orders || orders.length === 0) {
        return 0;
    }

    const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.amount), 0);
    const totalValue = orders.reduce((sum, order) => {
        const amount = parseFloat(order.amount);
        const price = parseFloat(order.price);
        return sum + (amount * price);
    }, 0);

    return totalAmount > 0 ? totalValue / totalAmount : 0;
};

/**
 * Calculate position PnL
 * @param position Position data
 * @param currentPrice1 Current price for outcome 1 in basis points
 * @param currentPrice2 Current price for outcome 2 in basis points
 * @returns PnL object with absolute and percentage values
 */
export const calculatePositionPnL = (
    position: PositionData,
    currentPrice1: number,
    currentPrice2: number
): { pnl: number; pnlPercent: number } => {
    const outcome1Amount = parseFloat(position.outcome1Amount);
    const outcome2Amount = parseFloat(position.outcome2Amount);

    // Current value of position
    const currentValue = (outcome1Amount * basisPointsToDecimal(currentPrice1)) +
                        (outcome2Amount * basisPointsToDecimal(currentPrice2));

    // Initial value (what was paid to acquire the position)
    const initialValue = parseFloat(position.totalValue);

    const pnl = currentValue - initialValue;
    const pnlPercent = initialValue > 0 ? (pnl / initialValue) * 100 : 0;

    return { pnl, pnlPercent };
};

/**
 * Calculate slippage for an order
 * @param orderSize Size of the order
 * @param orderBook Order book data
 * @param orderType Order type (YES/NO)
 * @returns Slippage percentage
 */
export const calculateSlippage = (
    orderSize: number,
    orderBook: OrderData[],
    orderType: OrderType
): number => {
    const matchingOrders = orderBook
        .filter(order => order.orderType !== orderType) // Opposite side orders
        .filter(order => order.status === 'OPEN')
        .sort((a, b) => {
            if (orderType === 'YES') {
                // For YES orders, we buy NO orders (sorted by price ascending)
                return parseFloat(a.price) - parseFloat(b.price);
            } else {
                // For NO orders, we buy YES orders (sorted by price descending)
                return parseFloat(b.price) - parseFloat(a.price);
            }
        });

    let remainingSize = orderSize;
    let totalCost = 0;
    let weightedPrice = 0;

    for (const order of matchingOrders) {
        if (remainingSize <= 0) break;

        const availableAmount = parseFloat(order.remainingAmount);
        const fillAmount = Math.min(remainingSize, availableAmount);
        const price = parseFloat(order.price);

        totalCost += fillAmount * price;
        remainingSize -= fillAmount;
    }

    if (totalCost === 0 || orderSize === 0) {
        return 0;
    }

    const averagePrice = totalCost / orderSize;
    const bestPrice = matchingOrders.length > 0 ? parseFloat(matchingOrders[0].price) : averagePrice;

    // Slippage is the difference between best price and average execution price
    const slippage = Math.abs((averagePrice - bestPrice) / bestPrice) * 100;

    return slippage;
};

// MARK: - Utility Functions

/**
 * Format price for display
 * @param priceInBasisPoints Price in basis points
 * @param includePercentage Whether to include percentage symbol
 * @returns Formatted price string
 */
export const formatPrice = (priceInBasisPoints: number, includePercentage = true): string => {
    const decimal = basisPointsToDecimal(priceInBasisPoints);
    const percentage = decimal * 100;

    if (percentage < 0.01) {
        return includePercentage ? `${percentage.toFixed(4)}%` : `${decimal.toFixed(6)}`;
    } else if (percentage < 1) {
        return includePercentage ? `${percentage.toFixed(2)}%` : `${decimal.toFixed(4)}`;
    } else {
        return includePercentage ? `${percentage.toFixed(1)}%` : `${decimal.toFixed(2)}`;
    }
};

/**
 * Format amount with appropriate units
 * @param amount Amount to format
 * @param decimals Number of decimal places
 * @returns Formatted amount string
 */
export const formatAmount = (amount: number | string, decimals = 2): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (num === 0) {
        return '0';
    }

    if (num < 0.01) {
        return num.toExponential(2);
    } else if (num < 1) {
        return num.toFixed(4);
    } else if (num < 1000) {
        return num.toFixed(decimals);
    } else if (num < 1000000) {
        return `${(num / 1000).toFixed(decimals)}K`;
    } else if (num < 1000000000) {
        return `${(num / 1000000).toFixed(decimals)}M`;
    } else {
        return `${(num / 1000000000).toFixed(decimals)}B`;
    }
};

/**
 * Format timestamp to readable date
 * @param timestamp Timestamp in seconds
 * @param includeTime Whether to include time
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp: string | number, includeTime = true): string => {
    const date = new Date(parseInt(timestamp.toString()) * 1000);

    if (includeTime) {
        return date.toLocaleString();
    } else {
        return date.toLocaleDateString();
    }
};

/**
 * Validate market question
 * @param question Market question
 * @returns Validation result
 */
export const validateMarketQuestion = (question: string): { isValid: boolean; error?: string } => {
    if (!question || question.trim().length === 0) {
        return { isValid: false, error: 'Question is required' };
    }

    if (question.length > 280) {
        return { isValid: false, error: 'Question must be 280 characters or less' };
    }

    // Check if question is likely binary (yes/no)
    const binaryIndicators = ['will', 'are', 'is', 'did', 'do', 'can', 'should', '?'];
    const isLikelyBinary = binaryIndicators.some(indicator =>
        question.toLowerCase().includes(indicator)
    );

    if (!isLikelyBinary && !question.includes('?')) {
        return { isValid: false, error: 'Question should be phrased as a yes/no question' };
    }

    return { isValid: true };
};

/**
 * Validate order amount
 * @param amount Order amount
 * @param userBalance User's available balance
 * @param price Order price in basis points
 * @returns Validation result
 */
export const validateOrderAmount = (
    amount: number,
    userBalance: number,
    price: number
): { isValid: boolean; error?: string; maxAmount?: number } => {
    if (amount <= 0) {
        return { isValid: false, error: 'Amount must be greater than 0' };
    }

    const requiredBalance = (amount * basisPointsToDecimal(price));

    if (requiredBalance > userBalance) {
        const maxAmount = userBalance / basisPointsToDecimal(price);
        return {
            isValid: false,
            error: `Insufficient balance. Maximum amount: ${formatAmount(maxAmount)}`,
            maxAmount
        };
    }

    return { isValid: true };
};

/**
 * Calculate break-even price for a position
 * @param outcome1Amount Amount of outcome 1 tokens
 * @param outcome2Amount Amount of outcome 2 tokens
 * @param totalCost Total cost to acquire position
 * @returns Break-even price in basis points
 */
export const calculateBreakEvenPrice = (
    outcome1Amount: number,
    outcome2Amount: number,
    totalCost: number
): number => {
    if (outcome1Amount + outcome2Amount === 0) {
        return 5000; // 50% as default
    }

    // Break-even price where the position value equals cost
    // outcome1Amount * price + outcome2Amount * (1 - price) = totalCost
    // outcome1Amount * price + outcome2Amount - outcome2Amount * price = totalCost
    // price * (outcome1Amount - outcome2Amount) = totalCost - outcome2Amount
    // price = (totalCost - outcome2Amount) / (outcome1Amount - outcome2Amount)

    const numerator = totalCost - outcome2Amount;
    const denominator = outcome1Amount - outcome2Amount;

    if (Math.abs(denominator) < 0.0001) {
        return 5000; // Avoid division by very small numbers
    }

    const breakEvenPrice = numerator / denominator;
    const clampedPrice = Math.max(0, Math.min(1, breakEvenPrice));

    return decimalToBasisPoints(clampedPrice);
};

/**
 * Generate market ID for new markets
 * @param timestamp Current timestamp
 * @param creator Creator address
 * @returns Generated market ID
 */
export const generateMarketId = (timestamp: number, creator: string): string => {
    const combined = `${timestamp}-${creator.slice(0, 8)}`;
    return Buffer.from(combined).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
};

/**
 * Sort markets by various criteria
 * @param markets Array of markets
 * @param sortBy Sort criteria
 * @param sortOrder Sort order
 * @returns Sorted markets array
 */
export const sortMarkets = (
    markets: MarketData[],
    sortBy: 'endTime' | 'createdTime' | 'totalVolume' | 'probability1',
    sortOrder: 'asc' | 'desc' = 'desc'
): MarketData[] => {
    return [...markets].sort((a, b) => {
        let aValue: number;
        let bValue: number;

        switch (sortBy) {
            case 'endTime':
                aValue = parseInt(a.endTime);
                bValue = parseInt(b.endTime);
                break;
            case 'createdTime':
                aValue = parseInt(a.createdTime);
                bValue = parseInt(b.createdTime);
                break;
            case 'totalVolume':
                aValue = parseFloat(a.totalVolume);
                bValue = parseFloat(b.totalVolume);
                break;
            case 'probability1':
                aValue = a.probability1;
                bValue = b.probability1;
                break;
            default:
                return 0;
        }

        const comparison = aValue - bValue;
        return sortOrder === 'asc' ? comparison : -comparison;
    });
};

/**
 * Filter markets by status
 * @param markets Array of markets
 * @param status Status to filter by
 * @returns Filtered markets array
 */
export const filterMarketsByStatus = (
    markets: MarketData[],
    status: MarketData['status'] | 'ALL'
): MarketData[] => {
    if (status === 'ALL') {
        return markets;
    }
    return markets.filter(market => market.status === status);
};

// MARK: - Risk Management

/**
 * Calculate position size based on risk tolerance
 * @param userBalance User's available balance
 * @param riskTolerance Risk tolerance as percentage (0-1)
 * @param confidence Confidence level (0-1)
 * @returns Recommended position size
 */
export const calculatePositionSize = (
    userBalance: number,
    riskTolerance: number,
    confidence: number
): number => {
    // Kelly criterion inspired position sizing
    const expectedValue = (confidence * 1) - ((1 - confidence) * 1);
    const kellyFraction = expectedValue / 1; // Simplified Kelly

    // Apply risk tolerance
    const adjustedKelly = kellyFraction * riskTolerance;

    // Limit to reasonable bounds (0-25% of balance)
    const maxPositionSize = userBalance * 0.25;
    const recommendedSize = userBalance * Math.max(0, Math.min(0.25, adjustedKelly));

    return Math.min(recommendedSize, maxPositionSize);
};

/**
 * Calculate portfolio concentration risk
 * @param positions Array of user positions
 * @returns Concentration risk metrics
 */
export const calculateConcentrationRisk = (positions: PositionData[]) => {
    if (positions.length === 0) {
        return { maxConcentration: 0, numPositions: 0, isDiversified: true };
    }

    const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.totalValue), 0);
    const positionValues = positions.map(pos => parseFloat(pos.totalValue));

    const maxConcentration = Math.max(...positionValues) / totalValue;
    const numPositions = positions.length;
    const isDiversified = numPositions >= 3 && maxConcentration < 0.5;

    return {
        maxConcentration,
        numPositions,
        isDiversified,
        recommendation: maxConcentration > 0.7 ? 'High concentration risk' :
                     maxConcentration > 0.5 ? 'Moderate concentration risk' :
                     'Well diversified'
    };
};