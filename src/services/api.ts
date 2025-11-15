// zkWASM API 客户端
// 参考: backend/socrates-prediction-mkt/ts/src/api.ts

import { PlayerConvention, ZKWasmAppRpc, createCommand } from "zkwasm-minirollup-rpc";
import type {
  Market,
  Order,
  Trade,
  Position,
  FinancialActivity,
  GlobalState,
  PlaceOrderParams,
  CreateMarketParams,
  PlayerId,
} from "../types/api";

// API Base URLs - use centralized config
import { API_CONFIG } from "../config/api";
export const GATEWAY_BASE_URL = API_CONFIG.gatewayBaseUrl;
export const ZKWASM_RPC_URL = API_CONFIG.zkwasmRpcUrl;

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
      if (e instanceof Error && e.message === "PlayerAlreadyExists") {
        return null;
      }
      throw e;
    }
  }

  // Admin 给目标玩家充值 (Admin only - not used in frontend)
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
      params.orderType === "limit_buy"
        ? 0n
        : params.orderType === "limit_sell"
        ? 1n
        : params.orderType === "market_buy"
        ? 2n
        : 3n;

    const directionValue = params.direction === "UP" ? 1n : 0n;

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
  protected resolvePidFromProcessingKey(_processingKey: string): [bigint, bigint] {
    // Note: 这个方法在前端可能不需要使用
    // Player ID 应该从 L2 account 的 pubkey 生成
    // 参考 MarketContext 中的 generatePlayerIdFromL2 方法
    throw new Error(
      "resolvePidFromProcessingKey should not be called in frontend. Use generatePlayerIdFromL2 instead."
    );
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
  async resolveMarket(marketId: bigint, oracleEndTime: bigint, oracleEndPrice: bigint): Promise<any> {
    const nonce = await this.getNonce();
    const pricePair = encodeI64(oracleEndPrice);
    const cmd = createCommand(nonce, BigInt(CMD_RESOLVE_MARKET), [marketId, oracleEndTime, pricePair[0], pricePair[1]]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // 执行撮合
  async executeTrade(params: { buyOrderId: bigint; sellOrderId: bigint; price: bigint; amount: bigint }): Promise<any> {
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
    const cmd = createCommand(nonce, BigInt(CMD_SET_FEE_EXEMPT), [targetPid[0], targetPid[1], enabled ? 1n : 0n]);
    return await this.sendTransactionWithCommand(cmd);
  }
}

// ==================== REST API 客户端 ====================

export class ExchangeAPI {
  private baseUrl: string;

  constructor(baseUrl: string = GATEWAY_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  // ========== 市场相关 ==========

  async getMarkets(): Promise<Market[]> {
    // Gateway: GET /v1/markets/active -> { code: 0, market_ids: string[] }
    const res = await fetch(`${this.baseUrl}/v1/markets/active`);
    if (!res.ok) {
      throw new Error("Failed to fetch active markets");
    }
    const json = await res.json();
    const ids: string[] = Array.isArray(json?.market_ids) ? json.market_ids : [];
    if (ids.length === 0) return [];

    // Fetch each market info and map to frontend Market shape
    const markets = await Promise.all(
      ids.map(async (id) => {
        try {
          const info = await this.getMarket(id);
          return info;
        } catch {
          return null;
        }
      })
    );
    return markets.filter((m): m is Market => m !== null);
  }

  async getMarket(marketId: string): Promise<Market> {
    // Gateway: GET /v1/markets/:market_id -> flat JSON
    const res = await fetch(`${this.baseUrl}/v1/markets/${encodeURIComponent(marketId)}`);
    if (!res.ok) {
      throw new Error("Failed to fetch market");
    }
    const m = await res.json();
    // Map gateway market to frontend Market type
    const mapState = (state: string | undefined): number => {
      switch ((state || "").toUpperCase()) {
        case "ACTIVE":
          return 1;
        case "RESOLVED":
          return 2;
        case "CLOSED":
          return 3;
        case "PENDING":
        default:
          return 0;
      }
    };
    const mapped: Market = {
      marketId: String(m?.market_id ?? marketId),
      assetId: String(m?.asset_id ?? ""),
      status: mapState(m?.state) as any,
      startTick: "0",
      endTick: "0",
      windowTicks: String(m?.window_ticks ?? "0"),
      windowMinutes: Number(m?.duration_minutes ?? 0),
      oracleStartTime: String(m?.start_time ?? "0"),
      oracleStartPrice: String(m?.start_price ?? "0"),
      oracleEndTime: String(m?.resolve_time ?? "0"),
      oracleEndPrice: String(m?.end_price ?? "0"),
      winningOutcome: (m?.outcome ?? 0) as any,
      upMarket: {
        orders: [],
        volume: "0",
        lastOrderId: "",
      },
      downMarket: {
        orders: [],
        volume: "0",
        lastOrderId: "",
      },
      isClosed: mapState(m?.state) === 3,
      isResolved: mapState(m?.state) === 2,
    };
    return mapped;
  }

  // ========== 下单（Gateway） ==========

  async createMarketOrder(
    params: {
      clientOrderId?: string;
      marketId: string;
      side: "BUY" | "SELL";
      direction: "YES" | "NO";
      type: "LIMIT" | "MARKET";
      price?: string; // decimal between 0 and 1 for LIMIT
      amount: string; // shares as decimal
    },
    userId: string
  ): Promise<any> {
    // Generate client_order_id if not provided
    const clientOrderId =
      params.clientOrderId ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

    // Idempotency-Key must be at least 16 characters (gateway requirement)
    // Use client_order_id as base, ensure it's at least 16 chars
    let idempotencyKey = clientOrderId;
    if (idempotencyKey.length < 16) {
      idempotencyKey = `${idempotencyKey}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    const body = {
      client_order_id: clientOrderId,
      market_id: params.marketId,
      side: params.side,
      direction: params.direction,
      type: params.type,
      price: params.price ?? "",
      amount: params.amount,
    };

    const res = await fetch(`${this.baseUrl}/v1/market/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.message || "Failed to create market order");
    }
    return json;
  }

  // ========== 订单相关 ==========

  async getOrders(marketId: string): Promise<Order[]> {
    void marketId;
    // Not available yet via gateway per-market; return empty to avoid breaking UI
    // TODO: add /v1/markets/:market_id/orders when backend supports it
    return [];
  }

  // ========== 余额 ==========

  async getBalance(userId: string, currency: string = "USDT"): Promise<{ available: string; frozen: string }> {
    const res = await fetch(`${this.baseUrl}/v1/balance?currency=${encodeURIComponent(currency)}`, {
      headers: {
        "X-User-ID": userId,
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.message || "Failed to fetch balance");
    }
    return {
      available: String(json?.available ?? "0"),
      frozen: String(json?.frozen ?? "0"),
    };
  }

  // ========== 成交相关 ==========

  async getTrades(marketId: string): Promise<Trade[]> {
    void marketId;
    // Not available yet via gateway per-market; return empty to avoid breaking UI
    // TODO: add /v1/markets/:market_id/trades when backend supports it
    return [];
  }

  async getTradeHistory(marketId: string): Promise<Trade[]> {
    void marketId;
    return [];
  }

  // ========== 持仓相关 ==========

  async getPositions(_pid: PlayerId): Promise<Position[]> {
    // Gateway expects user_id, not pid. Frontend needs a user_id source to call:
    //   GET /v1/users/:user_id/positions
    // Mark as unsupported until user_id wiring is decided.
    throw new Error("Positions endpoint requires user_id via gateway; PID is not supported.");
  }

  // 查询玩家订单
  async getPlayerOrders(
    _pid: PlayerId,
    _options?: {
      status?: 0 | 1 | 2;
      marketId?: string;
      limit?: number;
    }
  ): Promise<Order[]> {
    throw new Error("Player orders not supported via gateway without user_id; use /v1/orders with auth.");
  }

  // 查询玩家所有成交记录
  async getPlayerTrades(_pid: PlayerId, _limit = 100): Promise<Trade[]> {
    throw new Error("Player trades not supported via gateway without user_id; use /v1/trades with auth.");
  }

  // ========== 财务活动 ==========

  async getFinancialActivity(_pid: PlayerId, _limit = 100): Promise<FinancialActivity[]> {
    return [];
  }

  async getDeposits(_pid: PlayerId, _limit = 50): Promise<any[]> {
    return [];
  }

  async getWithdrawals(_pid: PlayerId, _limit = 50): Promise<any[]> {
    return [];
  }

  async getClaims(_pid: PlayerId, _limit = 50): Promise<any[]> {
    return [];
  }

  // ========== 全局状态 ==========

  async getGlobalState(): Promise<GlobalState> {
    // Not supported on gateway; caller should catch and ignore.
    throw new Error("Global state not supported on gateway");
  }
}

// ==================== 工厂函数 ====================

export function createPlayerClient(privateKey: string, rpcUrl?: string): ExchangePlayer {
  const rpc = new ZKWasmAppRpc(rpcUrl || ZKWASM_RPC_URL);
  return new ExchangePlayer(privateKey, rpc);
}

export function createAdminClient(privateKey: string, rpcUrl?: string): ExchangeAdmin {
  const rpc = new ZKWasmAppRpc(rpcUrl || ZKWASM_RPC_URL);
  return new ExchangeAdmin(privateKey, rpc);
}

export function createAPIClient(baseUrl?: string): ExchangeAPI {
  return new ExchangeAPI(baseUrl || GATEWAY_BASE_URL);
}

// ==================== 兼容旧的导出名称 ====================

// Combined API interface for PredictionMarketContext compatibility
export interface PredictionMarketAPI {
  // Player methods
  register: () => Promise<any>;
  withdraw: (amount: bigint) => Promise<any>;
  placeOrder: (params: PlaceOrderParams) => Promise<any>;
  cancelOrder: (orderId: bigint) => Promise<any>;
  claim: (marketId: bigint) => Promise<any>;
  getNonce: () => Promise<bigint>;

  // REST API methods
  getAllMarkets: () => Promise<Market[]>;

  // RPC instance
  rpc: ZKWasmAppRpc;
}

// Create combined API client with both player and REST capabilities
export function createPredictionMarketAPI(params: { serverUrl: string; privkey: string }): PredictionMarketAPI {
  // Ignore params.serverUrl for RPC; use configured zkWasm RPC URL instead
  const rpc = new ZKWasmAppRpc(ZKWASM_RPC_URL);
  const playerClient = new ExchangePlayer(params.privkey, rpc);
  const restClient = new ExchangeAPI(GATEWAY_BASE_URL);

  // Create combined API object
  const combinedAPI: PredictionMarketAPI = {
    // Player methods
    register: () => playerClient.register(),
    // Backward-compat alias
    // @ts-expect-error untyped consumer may call installPlayer()
    installPlayer: () => playerClient.register(),
    withdraw: (amount: bigint) => playerClient.withdraw(amount),
    placeOrder: (params: PlaceOrderParams) => playerClient.placeOrder(params),
    cancelOrder: (orderId: bigint) => playerClient.cancelOrder(orderId),
    claim: (marketId: bigint) => playerClient.claim(marketId),
    getNonce: () => playerClient.getNonce(),

    // REST API methods
    getAllMarkets: () => restClient.getMarkets(),

    // RPC instance
    rpc: rpc,
  };

  return combinedAPI;
}

export const createRESTAPI = createAPIClient;
