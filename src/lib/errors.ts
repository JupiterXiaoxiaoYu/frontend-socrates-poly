import { ERROR_MESSAGES } from './constants';

export class MarketError extends Error {
  constructor(
    public code: number,
    message?: string
  ) {
    super(message || ERROR_MESSAGES[code] || 'Unknown error');
    this.name = 'MarketError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof MarketError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

export function handleApiError(error: unknown): void {
  console.error('API Error:', error);
  
  // You can add error reporting service here (e.g., Sentry)
  
  const message = getErrorMessage(error);
  
  // Display error toast
  // This will be called from components that have access to toast
  return message as any;
}
