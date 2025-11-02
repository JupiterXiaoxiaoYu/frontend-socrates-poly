/**
 * Socrates Chain Oracle Price API Client
 *
 * 提供比特币价格数据的获取和实时更新功能
 * API文档: https://api-oracle-test.socrateschain.org/docs/swagger.html
 */

export interface OraclePriceResponse {
  symbol: string;
  price: string;
  timestamp: string;
  unix_time: number;
  sources: string[];
  weights: Record<string, number>;
  individual_prices: Record<string, string>;
  data_age_seconds: number;
}

export interface OraclePriceUpdate {
  type: "price_update";
  symbol: string;
  data: OraclePriceResponse;
}

export interface ExchangeStatus {
  name: string;
  connected: boolean;
  last_update: string;
  last_price: string;
  update_count: number;
  error_count: number;
  last_error?: string;
}

export interface OracleConfig {
  baseUrl?: string;
  wsUrl?: string;
  symbol?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class SocratesOracleClient {
  private config: Required<OracleConfig>;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private subscribers: Map<string, ((data: OraclePriceUpdate) => void)> = new Map();
  private statusCallbacks: ((status: 'connected' | 'disconnected' | 'error') => void)[] = [];

  constructor(config: OracleConfig = {}) {
    this.config = {
      baseUrl: 'https://api-oracle-test.socrateschain.org',
      wsUrl: 'wss://api-oracle-test.socrateschain.org/ws',
      symbol: 'BTC/USD',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...config
    };
  }

  /**
   * 获取最新价格
   */
  async getLatestPrice(symbol: string = this.config.symbol): Promise<OraclePriceResponse> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/price/latest?symbol=${encodeURIComponent(symbol)}`);

    if (!response.ok) {
      throw new Error(`Oracle API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Oracle API error: ${data.error || 'Unknown error'}`);
    }

    return data.data;
  }

  /**
   * 获取价格历史（60秒）
   */
  async getPriceHistory(symbol: string = this.config.symbol): Promise<OraclePriceResponse[]> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/price/history?symbol=${encodeURIComponent(symbol)}`);

    if (!response.ok) {
      throw new Error(`Oracle API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Oracle API error: ${data.error || 'Unknown error'}`);
    }

    return data.data || [];
  }

  /**
   * 获取平均价格
   */
  async getAveragePrice(symbol: string = this.config.symbol): Promise<OraclePriceResponse> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/price/average?symbol=${encodeURIComponent(symbol)}`);

    if (!response.ok) {
      throw new Error(`Oracle API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Oracle API error: ${data.error || 'Unknown error'}`);
    }

    return data.data;
  }

  /**
   * 获取支持的交易对
   */
  async getSupportedSymbols(): Promise<string[]> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/symbols`);

    if (!response.ok) {
      throw new Error(`Oracle API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Oracle API error: ${data.error || 'Unknown error'}`);
    }

    return data.data || [];
  }

  /**
   * 获取交易所状态
   */
  async getExchangeStatus(): Promise<ExchangeStatus[]> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/status`);

    if (!response.ok) {
      throw new Error(`Oracle API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Oracle API error: ${data.error || 'Unknown error'}`);
    }

    return data.data || [];
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.config.baseUrl}/health`);

    if (!response.ok) {
      throw new Error(`Oracle API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 连接WebSocket进行实时价格订阅
   */
  connectWebSocket(symbol: string = this.config.symbol): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(this.config.wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;

      // 订阅价格更新
      this.ws?.send(JSON.stringify({
        action: 'subscribe',
        symbol: symbol
      }));

      this.statusCallbacks.forEach(callback => callback('connected'));
    };

    this.ws.onmessage = (event) => {
      try {
        const data: OraclePriceUpdate = JSON.parse(event.data);

        if (data.type === 'price_update') {
          // 通知所有订阅者
          this.subscribers.forEach(callback => callback(data));
        }
      } catch (error) {
        // Silently handle parse errors
      }
    };

    this.ws.onclose = (event) => {
      this.statusCallbacks.forEach(callback => callback('disconnected'));

      // 自动重连
      if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.reconnectAttempts++;

        setTimeout(() => {
          this.connectWebSocket(symbol);
        }, this.config.reconnectInterval);
      } else {
        this.statusCallbacks.forEach(callback => callback('error'));
      }
    };

    this.ws.onerror = (error) => {
      this.statusCallbacks.forEach(callback => callback('error'));
    };
  }

  /**
   * 断开WebSocket连接
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      // 取消订阅
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        symbol: this.config.symbol
      }));

      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 订阅价格更新
   */
  subscribe(id: string, callback: (data: OraclePriceUpdate) => void): void {
    this.subscribers.set(id, callback);
  }

  /**
   * 取消订阅
   */
  unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  /**
   * 订阅连接状态变化
   */
  onStatusChange(callback: (status: 'connected' | 'disconnected' | 'error') => void): void {
    this.statusCallbacks.push(callback);
  }

  /**
   * 取消状态订阅
   */
  offStatusChange(callback: (status: 'connected' | 'disconnected' | 'error') => void): void {
    const index = this.statusCallbacks.indexOf(callback);
    if (index > -1) {
      this.statusCallbacks.splice(index, 1);
    }
  }

  /**
   * 获取连接状态
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 格式化价格显示
   */
  static formatPrice(price: string | number, decimals: number = 2): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numPrice);
  }

  /**
   * 计算价格变化百分比
   */
  static calculatePriceChange(currentPrice: number, previousPrice: number): {
    change: number;
    changePercent: number;
    direction: 'up' | 'down' | 'same';
  } {
    const change = currentPrice - previousPrice;
    const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

    return {
      change,
      changePercent,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
    };
  }
}

// 创建默认实例
export const oracleClient = new SocratesOracleClient();

// 导出类型
export type { OraclePriceResponse, OraclePriceUpdate, ExchangeStatus };