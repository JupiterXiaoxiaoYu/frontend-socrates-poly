import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency values
export function formatCurrency(value: number | string, decimals: number = 2): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
}

// Format percentage values
export function formatPercent(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Format time remaining
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Closed';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Format time from timestamp
export function formatTime(timestamp: number | string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) :
                typeof timestamp === 'number' ? new Date(timestamp * 1000) :
                timestamp;
  return date.toLocaleTimeString();
}

// Format date from timestamp
export function formatDate(timestamp: number | string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) :
                typeof timestamp === 'number' ? new Date(timestamp * 1000) :
                timestamp;
  return date.toLocaleDateString();
}

// Format number with commas
export function formatNumber(value: number | string, decimals: number = 2): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
}

// Format large numbers (K, M, B)
export function formatLargeNumber(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (numValue >= 1e9) {
    return `${(numValue / 1e9).toFixed(1)}B`;
  } else if (numValue >= 1e6) {
    return `${(numValue / 1e6).toFixed(1)}M`;
  } else if (numValue >= 1e3) {
    return `${(numValue / 1e3).toFixed(1)}K`;
  } else {
    return formatNumber(numValue);
  }
}

// Truncate address for display
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// Calculate percentage change
export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Convert timestamp to relative time
export function getRelativeTime(timestamp: number | string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) :
                typeof timestamp === 'number' ? new Date(timestamp * 1000) :
                timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date);
  }
}
