// zkWASM API 客户端
// 参考: backend/socrates-prediction-mkt/ts/src/api.ts

import { PlayerConvention, ZKWasmAppRpc, createCommand } from 'zkwasm-minirollup-rpc';
import type {
  ApiResponse,
  Market,
  Order,
  Trade,
  Position,
  FinancialActivity,
  GlobalState,
  PlaceOrderParams,
  CreateMarketParams,
  PlayerId,
} from '../types/api';

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// 命令常量（与后端对应）
const CMD_TICK = 0;
const CMD_REGISTER = 1;
const CMD_DEPOSIT = 2;
const CMD_WITHDRAW = 3;
const CMD_PLACE_ORDER = 4;
const CMD_CANCEL_ORDER = 5;
const CMD_CLAIM = 6;
const CMD_CREATE_MARKET = 7;
const CMD_CLOSE_MARKET = 8;
const CMD_EXECUTE_TRADE = 9;
const CMD_RESOLVE_MARKET = 10;
const CMD_SET_FEE_EXEMPT = 11;

// 辅助函数：编码 i64 为两个 u32
function encodeI64(value: bigint): [bigint, bigint] {
  const signed = BigInt.asIntN(64, value);
  const high = (signed >> 32n) & 0xffffffffn;
  const low = signed & 0xffffffffn;
  return [high, low];
}

// ==================== 玩家客户端 ====================

export class ExchangePlayer extends PlayerConvention {
  public rpc: ZKWasmAppRpc;

  constructor(privateKey: string, rpc: ZKWasmAppRpc) {
    super(privateKey, rpc, BigInt(CMD_DEPOSIT), BigInt(CMD_WITHDRAW));
    this.rpc = rpc;
  }

  protected async sendTransactionWithCommand(cmd: BigUint64Array) {
    try {
      return await this.rpc.sendTransaction(cmd, this.processingKey);
    } catch (error) {
      throw error;
    }
  }

  // 注册玩家（幂等操作）
  async register(): Promise<any> {
    try {
      const cmd = createCommand(0n, BigInt(CMD_REGISTER), []);
      return await this.sendTransactionWithCommand(cmd);
    } catch (e) {
      if (e instanceof Error && e.message === 'PlayerAlreadyExists') {
        return null;
      }
      throw e;
    }
  }

  // Admin 给目标玩家充值
  async depositTo(targetProcessingKey: string, amount: bigint): Promise<any> {
    const nonce = await this.getNonce();
    const targetPid = this.resolvePidFromProcessingKey(targetProcessingKey);
    const cmd = createCommand(nonce, BigInt(CMD_DEPOSIT), [targetPid[0], targetPid[1], amount]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // 提现
  async withdraw(amount: bigint): Promise<any> {
    const nonce = await this.getNonce();
    const cmd = createCommand(nonce, BigInt(CMD_WITHDRAW), [amount]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // 下单
  async placeOrder(params: PlaceOrderParams): Promise<any> {
    const nonce = await this.getNonce();
    
    const typeValue =
      params.orderType === 'limit_buy' ? 0n :
      params.orderType === 'limit_sell' ? 1n :
      params.orderType === 'market_buy' ? 2n : 3n;
    
    const directionValue = params.direction === 'UP' ? 1n : 0n;

    const cmd = createCommand(nonce, BigInt(CMD_PLACE_ORDER), [
      params.marketId,
      directionValue,
      typeValue,
      params.price,
      params.amount,
    ]);
    
    return await this.sendTransactionWithCommand(cmd);
  }

  // 撤单
  async cancelOrder(orderId: bigint): Promise<any> {
    const nonce = await this.getNonce();
    const cmd = createCommand(nonce, BigInt(CMD_CANCEL_ORDER), [orderId]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // Claim 收益
  async claim(marketId: bigint): Promise<any> {
    const nonce = await this.getNonce();
    const cmd = createCommand(nonce, BigInt(CMD_CLAIM), [marketId]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // 从 processingKey 解析 Player ID
  protected resolvePidFromProcessingKey(processingKey: string): [bigint, bigint] {
    // Note: 这个方法在前端可能不需要使用
    // Player ID 应该从 L2 account 的 pubkey 生成
    // 参考 MarketContext 中的 generatePlayerIdFromL2 方法
    throw new Error('resolvePidFromProcessingKey should not be called in frontend. Use generatePlayerIdFromL2 instead.');
  }
}

// ==================== 管理员客户端 ====================

export class ExchangeAdmin extends ExchangePlayer {
  // 推进时间
  async tick(): Promise<any> {
    const nonce = await this.getNonce();
    const cmd = createCommand(nonce, BigInt(CMD_TICK), []);
    return await this.sendTransactionWithCommand(cmd);
  }

  // 创建市场
  async createMarket(params: CreateMarketParams): Promise<any> {
    const nonce = await this.getNonce();
    const pricePair = encodeI64(params.oracleStartPrice);
    const cmd = createCommand(nonce, BigInt(CMD_CREATE_MARKET), [
      params.assetId,
      params.startTick,
      params.endTick,
      params.oracleStartTime,
      pricePair[0],
      pricePair[1],
    ]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // 关闭市场
  async closeMarket(marketId: bigint): Promise<any> {
    const nonce = await this.getNonce();
    const cmd = createCommand(nonce, BigInt(CMD_CLOSE_MARKET), [marketId]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // 解析市场
  async resolveMarket(
    marketId: bigint,
    oracleEndTime: bigint,
    oracleEndPrice: bigint
  ): Promise<any> {
    const nonce = await this.getNonce();
    const pricePair = encodeI64(oracleEndPrice);
    const cmd = createCommand(nonce, BigInt(CMD_RESOLVE_MARKET), [
      marketId,
      oracleEndTime,
      pricePair[0],
      pricePair[1],
    ]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // 执行撮合
  async executeTrade(params: {
    buyOrderId: bigint;
    sellOrderId: bigint;
    price: bigint;
    amount: bigint;
  }): Promise<any> {
    const nonce = await this.getNonce();
    const cmd = createCommand(nonce, BigInt(CMD_EXECUTE_TRADE), [
      params.buyOrderId,
      params.sellOrderId,
      params.price,
      params.amount,
    ]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // 设置费用豁免
  async setFeeExempt(targetProcessingKey: string, enabled: boolean): Promise<any> {
    const nonce = await this.getNonce();
    const targetPid = this.resolvePidFromProcessingKey(targetProcessingKey);
    const cmd = createCommand(nonce, BigInt(CMD_SET_FEE_EXEMPT), [
      targetPid[0],
      targetPid[1],
      enabled ? 1n : 0n,
    ]);
    return await this.sendTransactionWithCommand(cmd);
  }
}

// ==================== REST API 客户端 ====================

export class ExchangeAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // ========== 市场相关 ==========

  async getMarkets(): Promise<Market[]> {
    const response = await fetch(`${this.baseUrl}/data/markets`);
    const body: ApiResponse<Market[]> = await response.json();
    if (!body.success) {
      throw new Error(body.error || 'Failed to fetch markets');
    }
    return body.data || [];
  }

  async getMarket(marketId: string): Promise<Market> {
    const response = await fetch(`${this.baseUrl}/data/market/${marketId}`);
    const body: ApiResponse<Market> = await response.json();
    if (!body.success) {
      throw new Error(body.error || 'Failed to fetch market');
    }
    if (!body.data) {
      throw new Error('Market not found');
    }
    return body.data;
  }

  // ========== 订单相关 ==========

  async getOrders(marketId: string): Promise<Order[]> {
    const response = await fetch(`${this.baseUrl}/data/market/${marketId}/orders`);
    const body: ApiResponse<Order[]> = await response.json();
    if (!body.success) {
      throw new Error(body.error || 'Failed to fetch orders');
    }
    return body.data || [];
  }

  // ========== 成交相关 ==========

  async getTrades(marketId: string): Promise<Trade[]> {
    const response = await fetch(`${this.baseUrl}/data/market/${marketId}/trades`);
    const body: ApiResponse<Trade[]> = await response.json();
    if (!body.success) {
      throw new Error(body.error || 'Failed to fetch trades');
    }
    return body.data || [];
  }

  async getTradeHistory(marketId: string): Promise<Trade[]> {
    const response = await fetch(`${this.baseUrl}/data/market/${marketId}/trade-history`);
    const body: ApiResponse<Trade[]> = await response.json();
    if (!body.success) {
      throw new Error(body.error || 'Failed to fetch trade history');
    }
    return body.data || [];
  }

  // ========== 持仓相关 ==========

  async getPositions(pid: PlayerId): Promise<Position[]> {
    const [pid1, pid2] = pid.map((v: string) => v.toString());
    const response = await fetch(`${this.baseUrl}/data/player/${pid1}/${pid2}/positions`);
    const body: ApiResponse<Position[]> = await response.json();
    if (!body.success) {
      throw new Error(body.error || 'Failed to fetch positions');
    }
    return body.data || [];
  }

  // 查询玩家订单
  async getPlayerOrders(
    pid: PlayerId,
    options?: {
      status?: 0 | 1 | 2;
      marketId?: string;
      limit?: number;
    }
  ): Promise<Order[]> {
    const [pid1, pid2] = pid.map((v: string) => v.toString());
    const params = new URLSearchParams();
    
    if (options?.status !== undefined) {
      params.append('status', options.status.toString());
    }
    if (options?.marketId) {
      params.append('marketId', options.marketId);
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }

    const url = `${this.baseUrl}/data/player/${pid1}/${pid2}/orders?${params}`;
    const response = await fetch(url);
    const body: ApiResponse<Order[]> = await response.json();
    
    if (!body.success) {
      throw new Error(body.error || 'Failed to fetch player orders');
    }
    return body.data || [];
  }

  // 查询玩家所有成交记录
  async getPlayerTrades(pid: PlayerId, limit = 100): Promise<Trade[]> {
    const [pid1, pid2] = pid.map((v: string) => v.toString());
    const url = `${this.baseUrl}/data/player/${pid1}/${pid2}/trades?limit=${limit}`;
    const response = await fetch(url);
    const body: ApiResponse<Trade[]> = await response.json();
    
    if (!body.success) {
      throw new Error(body.error || 'Failed to fetch player trades');
    }
    return body.data || [];
  }

  // ========== 财务活动 ==========

  async getFinancialActivity(pid: PlayerId, limit = 100): Promise<FinancialActivity[]> {
    const [pid1, pid2] = pid.map((v: string) => v.toString());
    const response = await fetch(
      `${this.baseUrl}/data/player/${pid1}/${pid2}/financial-activity?limit=${limit}`
    );
    const body: ApiResponse<FinancialActivity[]> = await response.json();
    if (!body.success) {
      throw new Error(body.error || 'Failed to fetch financial activity');
    }
    return body.data || [];
  }

  async getDeposits(pid: PlayerId, limit = 50): Promise<any[]> {
    const [pid1, pid2] = pid.map((v: string) => v.toString());
    const response = await fetch(
      `${this.baseUrl}/data/player/${pid1}/${pid2}/deposits?limit=${limit}`
    );
    const body: ApiResponse<any[]> = await response.json();
    if (!body.success) {
      throw new Error(body.error || 'Failed to fetch deposits');
    }
    return body.data || [];
  }

  async getWithdrawals(pid: PlayerId, limit = 50): Promise<any[]> {
    const [pid1, pid2] = pid.map((v: string) => v.toString());
    const response = await fetch(
      `${this.baseUrl}/data/player/${pid1}/${pid2}/withdrawals?limit=${limit}`
    );
    const body: ApiResponse<any[]> = await response.json();
    if (!body.success) {
      throw new Error(body.error || 'Failed to fetch withdrawals');
    }
    return body.data || [];
  }

  async getClaims(pid: PlayerId, limit = 50): Promise<any[]> {
    const [pid1, pid2] = pid.map((v: string) => v.toString());
    const response = await fetch(
      `${this.baseUrl}/data/player/${pid1}/${pid2}/claims?limit=${limit}`
    );
    const body: ApiResponse<any[]> = await response.json();
    if (!body.success) {
      throw new Error(body.error || 'Failed to fetch claims');
    }
    return body.data || [];
  }

  // ========== 全局状态 ==========

  async getGlobalState(): Promise<GlobalState> {
    const response = await fetch(`${this.baseUrl}/data/state`);
    const body: ApiResponse<GlobalState> = await response.json();
    if (!body.success) {
      throw new Error(body.error || 'Failed to fetch global state');
    }
    if (!body.data) {
      throw new Error('Global state not found');
    }
    return body.data;
  }
}

// ==================== 工厂函数 ====================

export function createPlayerClient(privateKey: string, rpcUrl?: string): ExchangePlayer {
  const rpc = new ZKWasmAppRpc(rpcUrl || API_BASE_URL);
  return new ExchangePlayer(privateKey, rpc);
}

export function createAdminClient(privateKey: string, rpcUrl?: string): ExchangeAdmin {
  const rpc = new ZKWasmAppRpc(rpcUrl || API_BASE_URL);
  return new ExchangeAdmin(privateKey, rpc);
}

export function createAPIClient(baseUrl?: string): ExchangeAPI {
  return new ExchangeAPI(baseUrl || API_BASE_URL);
}

// ==================== 兼容旧的导出名称 ====================

// 为了兼容 PredictionMarketContext，添加旧的导出名称
export const createPredictionMarketAPI = createPlayerClient;
export const createRESTAPI = createAPIClient;
export { ExchangePlayer as PredictionMarketAPI };
