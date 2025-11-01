// WebSocket service for real-time prediction market data
// Handles price feeds, order book updates, trade notifications, and market status changes

import { Market, Order, Trade, OrderBookData, OraclePrice } from '../types/market';

export interface WebSocketMessage {
  type: 'price' | 'orderbook' | 'trade' | 'market' | 'global' | 'error';
  timestamp: number;
  data: any;
}

export interface PriceUpdate {
  assetId: number;
  price: number;
  timestamp: number;
  change24h?: number;
  changePercent24h?: number;
}

export interface OrderBookUpdate {
  marketId: number;
  bids: Array<{ price: number; amount: number; total: number }>;
  asks: Array<{ price: number; amount: number; total: number }>;
  spread: number;
  midPrice: number;
}

export interface TradeUpdate {
  marketId: number;
  tradeId: number;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

export interface MarketUpdate {
  marketId: number;
  status?: number;
  price?: number;
  volume?: number;
  liquidity?: number;
  timeRemaining?: number;
}

export interface GlobalUpdate {
  counter: number;
  totalPlayers: number;
  totalFunds: number;
  activeMarkets: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 5000;
  private isConnecting = false;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private isManualClose = false;

  constructor(url?: string) {
    // Default to WebSocket URL based on API URL
    this.url = url || this.getWebSocketUrl();
  }

  private getWebSocketUrl(): string {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const wsUrl = apiBaseUrl.replace('http', 'ws');
    return `${wsUrl}/ws`;
  }

  // Connection management
  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.isManualClose = false;

    try {
      console.log('Connecting to WebSocket:', this.url);
      this.ws = new WebSocket(this.url);

      await new Promise<void>((resolve, reject) => {
        if (!this.ws) return reject(new Error('WebSocket initialization failed'));

        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        this.ws!.onopen = () => {
          clearTimeout(timeout);
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startPing();
          resolve();
        };

        this.ws!.onclose = (event) => {
          clearTimeout(timeout);
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.stopPing();

          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws!.onerror = (error) => {
          clearTimeout(timeout);
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws!.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      });
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  disconnect(): void {
    this.isManualClose = true;
    this.stopPing();

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    this.subscribers.clear();
  }

  private scheduleReconnect(): void {
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts);
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`);

    setTimeout(() => {
      if (!this.isManualClose) {
        this.reconnectAttempts++;
        this.connect().catch(error => {
          console.error('Reconnect failed:', error);
        });
      }
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Message handling
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      if (message.type === 'pong') {
        // Ping response received
        return;
      }

      if (message.type === 'error') {
        console.error('WebSocket server error:', message.data);
        this.notifySubscribers('error', message.data);
        return;
      }

      // Route message to appropriate subscribers
      this.routeMessage(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private routeMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'price':
        this.notifySubscribers('price', message.data);
        break;
      case 'orderbook':
        this.notifySubscribers(`orderbook:${message.data.marketId}`, message.data);
        break;
      case 'trade':
        this.notifySubscribers(`trade:${message.data.marketId}`, message.data);
        this.notifySubscribers('trade', message.data); // Global trade updates
        break;
      case 'market':
        this.notifySubscribers(`market:${message.data.marketId}`, message.data);
        this.notifySubscribers('market', message.data); // Global market updates
        break;
      case 'global':
        this.notifySubscribers('global', message.data);
        break;
    }
  }

  // Subscription management
  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
      this.sendSubscriptionMessage(channel, 'subscribe');
    }

    this.subscribers.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(channel);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(channel);
          this.sendSubscriptionMessage(channel, 'unsubscribe');
        }
      }
    };
  }

  private sendSubscriptionMessage(channel: string, action: 'subscribe' | 'unsubscribe'): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const [type, ...params] = channel.split(':');

      let message: any = { action, type };

      if (type === 'orderbook' || type === 'trade' || type === 'market') {
        message.marketId = parseInt(params[0]);
      }

      this.ws.send(JSON.stringify(message));
    }
  }

  private notifySubscribers(channel: string, data: any): void {
    const subscribers = this.subscribers.get(channel);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscriber callback for ${channel}:`, error);
        }
      });
    }
  }

  // Public subscription methods
  onPriceUpdate(callback: (update: PriceUpdate) => void): () => void {
    return this.subscribe('price', callback);
  }

  onOrderBookUpdate(marketId: number, callback: (update: OrderBookUpdate) => void): () => void {
    return this.subscribe(`orderbook:${marketId}`, callback);
  }

  onTradeUpdate(marketId: number, callback: (update: TradeUpdate) => void): () => void {
    return this.subscribe(`trade:${marketId}`, callback);
  }

  onAllTrades(callback: (update: TradeUpdate) => void): () => void {
    return this.subscribe('trade', callback);
  }

  onMarketUpdate(marketId: number, callback: (update: MarketUpdate) => void): () => void {
    return this.subscribe(`market:${marketId}`, callback);
  }

  onAllMarkets(callback: (update: MarketUpdate) => void): () => void {
    return this.subscribe('market', callback);
  }

  onGlobalUpdate(callback: (update: GlobalUpdate) => void): () => void {
    return this.subscribe('global', callback);
  }

  onError(callback: (error: any) => void): () => void {
    return this.subscribe('error', callback);
  }

  // Connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  isConnectingStatus(): boolean {
    return this.isConnecting;
  }

  getConnectionState(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (this.isConnecting) return 'connecting';
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'error';
    }
  }

  // Send custom messages
  sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  // Utility methods
  async getConnectionInfo(): Promise<{
    connected: boolean;
    state: string;
    reconnectAttempts: number;
    subscriberCount: number;
    subscriptions: string[];
  }> {
    return {
      connected: this.isConnected(),
      state: this.getConnectionState(),
      reconnectAttempts: this.reconnectAttempts,
      subscriberCount: Array.from(this.subscribers.values()).reduce((sum, set) => sum + set.size, 0),
      subscriptions: Array.from(this.subscribers.keys()),
    };
  }
}

// Mock WebSocket service for development
class MockWebSocketService extends WebSocketService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private mockData: Map<number, any> = new Map();

  constructor() {
    super('mock://websocket');
    console.log('Using mock WebSocket service');
  }

  async connect(): Promise<void> {
    console.log('Mock WebSocket connected');
    this.startMockDataStreams();
  }

  disconnect(): void {
    super.disconnect();
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }

  private startMockDataStreams(): void {
    // Mock price updates
    this.intervals.set('prices', setInterval(() => {
      const priceUpdates: PriceUpdate[] = [
        {
          assetId: 1,
          price: 43500 + (Math.random() - 0.5) * 1000,
          timestamp: Date.now(),
          change24h: (Math.random() - 0.5) * 2000,
          changePercent24h: (Math.random() - 0.5) * 5,
        },
        {
          assetId: 2,
          price: 2200 + (Math.random() - 0.5) * 100,
          timestamp: Date.now(),
          change24h: (Math.random() - 0.5) * 100,
          changePercent24h: (Math.random() - 0.5) * 4,
        },
        {
          assetId: 3,
          price: 98 + (Math.random() - 0.5) * 4,
          timestamp: Date.now(),
          change24h: (Math.random() - 0.5) * 10,
          changePercent24h: (Math.random() - 0.5) * 10,
        },
      ];

      priceUpdates.forEach(update => {
        this.notifySubscribers('price', update);
      });
    }, 5000));

    // Mock global updates
    this.intervals.set('global', setInterval(() => {
      const globalUpdate: GlobalUpdate = {
        counter: Math.floor(Date.now() / 5000),
        totalPlayers: 150 + Math.floor(Math.random() * 20),
        totalFunds: 1000000 + Math.floor(Math.random() * 100000),
        activeMarkets: 6 + Math.floor(Math.random() * 4),
      };

      this.notifySubscribers('global', globalUpdate);
    }, 10000));

    // Mock order book updates for sample markets
    const sampleMarketIds = [1, 2, 3];
    sampleMarketIds.forEach(marketId => {
      this.initializeMockOrderBook(marketId);

      this.intervals.set(`orderbook:${marketId}`, setInterval(() => {
        this.updateMockOrderBook(marketId);
      }, 3000));
    });
  }

  private initializeMockOrderBook(marketId: number): void {
    const basePrice = 0.5 + (Math.random() - 0.5) * 0.2;

    const bids = [];
    const asks = [];

    for (let i = 0; i < 10; i++) {
      const bidPrice = basePrice - (i + 1) * 0.01;
      const askPrice = basePrice + (i + 1) * 0.01;
      const bidAmount = Math.random() * 1000;
      const askAmount = Math.random() * 1000;

      bids.push({
        price: Math.max(0.01, bidPrice),
        amount: bidAmount,
        total: bidAmount * Math.max(0.01, bidPrice),
      });

      asks.push({
        price: Math.min(0.99, askPrice),
        amount: askAmount,
        total: askAmount * Math.min(0.99, askPrice),
      });
    }

    this.mockData.set(marketId, { bids, asks });
  }

  private updateMockOrderBook(marketId: number): void {
    const data = this.mockData.get(marketId);
    if (!data) return;

    // Simulate order book changes
    const shouldAddBid = Math.random() > 0.7;
    const shouldAddAsk = Math.random() > 0.7;

    if (shouldAddBid && data.bids.length < 15) {
      const lastBid = data.bids[data.bids.length - 1];
      data.bids.push({
        price: Math.max(0.01, lastBid.price - 0.01),
        amount: Math.random() * 1000,
        total: 0,
      });
    }

    if (shouldAddAsk && data.asks.length < 15) {
      const lastAsk = data.asks[data.asks.length - 1];
      data.asks.push({
        price: Math.min(0.99, lastAsk.price + 0.01),
        amount: Math.random() * 1000,
        total: 0,
      });
    }

    // Update totals
    let bidTotal = 0;
    data.bids.forEach(bid => {
      bidTotal += bid.amount;
      bid.total = bidTotal;
    });

    let askTotal = 0;
    data.asks.forEach(ask => {
      askTotal += ask.amount;
      ask.total = askTotal;
    });

    const spread = data.asks[0].price - data.bids[0].price;
    const midPrice = (data.bids[0].price + data.asks[0].price) / 2;

    const update: OrderBookUpdate = {
      marketId,
      bids: data.bids,
      asks: data.asks,
      spread,
      midPrice,
    };

    this.notifySubscribers(`orderbook:${marketId}`, update);
  }

  // Override subscription methods for mock
  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }

    this.subscribers.get(channel)!.add(callback);

    return () => {
      const subscribers = this.subscribers.get(channel);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(channel);
        }
      }
    };
  }

  isConnected(): boolean {
    return true; // Mock is always "connected"
  }
}

// Create and export appropriate service instance
const isDevelopment = import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_WS;

export const webSocketService = isDevelopment
  ? new MockWebSocketService()
  : new WebSocketService();

export { WebSocketService, MockWebSocketService };
export default webSocketService;