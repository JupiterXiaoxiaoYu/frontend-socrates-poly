/**
 * Format number with specified decimal places
 */
export function formatNumber(
  value: number,
  options?: {
    decimals?: number;
    prefix?: string;
    suffix?: string;
    compact?: boolean;
  }
): string {
  const { decimals = 2, prefix = '', suffix = '', compact = false } = options || {};
  
  if (compact && Math.abs(value) >= 1000) {
    return formatCompactNumber(value, decimals) + suffix;
  }
  
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return `${prefix}${formatted}${suffix}`;
}

/**
 * Format number in compact notation (1.2M, 1.5K, etc.)
 */
export function formatCompactNumber(value: number, decimals: number = 1): string {
  const absValue = Math.abs(value);
  
  if (absValue >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(decimals) + 'B';
  }
  if (absValue >= 1_000_000) {
    return (value / 1_000_000).toFixed(decimals) + 'M';
  }
  if (absValue >= 1_000) {
    return (value / 1_000).toFixed(decimals) + 'K';
  }
  
  return value.toFixed(decimals);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return formatNumber(value, { decimals, suffix: '%' });
}

/**
 * Format currency (USD)
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return formatNumber(value, { decimals, prefix: '$' });
}

/**
 * Format BPS as percentage
 */
export function formatBPS(bps: number): string {
  return formatPercent(bps / 100);
}

/**
 * Format timestamp as relative time (e.g., "2m ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Format date as readable string
 */
export function formatDate(timestamp: number, includeTime: boolean = true): string {
  const date = new Date(timestamp);
  
  if (includeTime) {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format countdown time (MM:SS)
 */
export function formatCountdown(seconds: number): string {
  if (seconds < 0) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format countdown with units
 */
export function formatCountdownVerbose(seconds: number): string {
  if (seconds < 0) return 'Expired';
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (mins < 60) {
    return `${mins}m ${secs}s`;
  }
  
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  
  return `${hours}h ${remainingMins}m`;
}

/**
 * Truncate address (0x1234...5678)
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
