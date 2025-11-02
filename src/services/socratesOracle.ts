export interface PriceData {
  symbol: string;
  price: string;
  timestamp: string;
  unix_time: number;
  sources: string[];
  weights: Record<string, number>;
  individual_prices: Record<string, string>;
  data_age_seconds: number;
}

export interface PriceHistoryData {
  symbol: string;
  start_time: number;
  end_time: number;
  data_points: number;
  prices: Array<{
    price: string;
    unix_time: number;
  }>;
}

export interface ExchangeStatus {
  name: string;
  connected: boolean;
  last_update: string;
  last_price: string;
  update_count: number;
  error_count: number;
  last_error: string;
}

class SocratesOracleService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, (data: PriceData) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private readonly baseUrl = 'https://api-oracle-test.socrateschain.org';
  private readonly wsUrl = 'wss://api-oracle-test.socrateschain.org/ws';
  private isConnecting = false;
  private lastPriceUpdate: Map<string, number> = new Map();

  // WebSocket connection
  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;

          // Subscribe to BTC/USD by default
          this.subscribe('BTC/USD');

          // Set up heartbeat
          this.startHeartbeat();

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          this.isConnecting = false;
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'price_update':
          this.handlePriceUpdate(message);
          break;
        case 'pong':
          // Handle pong response
          break;
        default:
          // Unknown message type
          break;
      }
    } catch (error) {
      // Silently handle parse errors
    }
  }

  private handlePriceUpdate(message: any): void {
    const priceData: PriceData = message.data;
    const symbol = priceData.symbol;

    // Prevent duplicate updates
    const lastUpdate = this.lastPriceUpdate.get(symbol);
    if (lastUpdate && priceData.unix_time <= lastUpdate) {
      return;
    }

    this.lastPriceUpdate.set(symbol, priceData.unix_time);

    // Notify subscribers
    const callback = this.subscribers.get(symbol);
    if (callback) {
      callback(priceData);
    }
  }

  private startHeartbeat(): void {
    setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 60000);

      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }

  // Subscribe to price updates
  subscribe(symbol: string, callback?: (data: PriceData) => void): void {
    if (callback) {
      this.subscribers.set(symbol, callback);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        symbol: symbol
      }));
    } else {
      // Connect if not connected
      this.connect();
    }
  }

  // Enhanced subscribe method with async support
  async subscribeToPriceUpdates(symbol: string, callback: (data: PriceData) => void, interval?: number): Promise<() => void> {
    return new Promise((resolve, reject) => {
      try {
        this.subscribe(symbol, callback);
        resolve(() => this.unsubscribe(symbol));
      } catch (error) {
        reject(error);
      }
    });
  }

  // Unsubscribe from price updates
  unsubscribe(symbol: string): void {
    this.subscribers.delete(symbol);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        symbol: symbol
      }));
    }
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
    this.lastPriceUpdate.clear();
  }

  // HTTP API methods
  async getLatestPrice(symbol: string = 'BTC/USD'): Promise<PriceData> {
    const response = await fetch(`${this.baseUrl}/api/v1/price/latest?symbol=${encodeURIComponent(symbol)}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch latest price: ${response.statusText}`);
    }

    return response.json();
  }

  async getPriceHistory(symbol: string = 'BTC/USD', timestamp?: number): Promise<PriceHistoryData> {
    const url = timestamp
      ? `${this.baseUrl}/api/v1/price/history?symbol=${encodeURIComponent(symbol)}&timestamp=${timestamp}`
      : `${this.baseUrl}/api/v1/price/history?symbol=${encodeURIComponent(symbol)}&timestamp=${Math.floor(Date.now() / 1000)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch price history: ${response.statusText}`);
    }

    return response.json();
  }

  async getAveragePrice(symbol: string = 'BTC/USD', period: string = '5m'): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/price/average?symbol=${encodeURIComponent(symbol)}&period=${period}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch average price: ${response.statusText}`);
    }

    return response.json();
  }

  async getSupportedSymbols(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/symbols`);

    if (!response.ok) {
      throw new Error(`Failed to fetch supported symbols: ${response.statusText}`);
    }

    const data = await response.json();
    return data.symbols;
  }

  async getExchangeStatus(): Promise<Record<string, ExchangeStatus>> {
    const response = await fetch(`${this.baseUrl}/api/v1/status`);

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange status: ${response.statusText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Singleton instance
export const socratesOracleService = new SocratesOracleService();

// Auto-connect when service is imported
setTimeout(() => {
  socratesOracleService.connect().catch(console.error);
}, 100);