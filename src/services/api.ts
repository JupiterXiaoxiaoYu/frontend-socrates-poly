// Prediction Market API Service
// Following the exact patterns from reference projects
// Extends PlayerConvention from zkwasm-minirollup-rpc

import { createCommand, createWithdrawCommand, PlayerConvention, ZKWasmAppRpc, LeHexBN } from "zkwasm-minirollup-rpc";
import { PrivateKey, bnToHexLe } from "delphinus-curves/src/altjubjub";

// Backend command constants (match backend exactly)
const INSTALL_PLAYER = 1;
const DEPOSIT = 2;
const WITHDRAW = 3;
const PLACE_ORDER = 4;
const CANCEL_ORDER = 5;
const CLAIM = 6;
const CREATE_MARKET = 7;
const CLOSE_MARKET = 8;
const EXECUTE_TRADE = 9;
const RESOLVE_MARKET = 10;
const SET_FEE_EXEMPT = 11;

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Main API class extending PlayerConvention
export class PredictionMarketAPI extends PlayerConvention {
  private privkey: string;
  private rpc: ZKWasmAppRpc;

  constructor(config: { serverUrl: string; privkey: string }) {
    const rpc = new ZKWasmAppRpc(config.serverUrl);
    super(config.privkey, rpc, BigInt(DEPOSIT), BigInt(WITHDRAW));
    this.privkey = config.privkey;
    this.rpc = rpc;
    this.processingKey = config.privkey;
  }

  protected async sendTransactionWithCommand(cmd: BigUint64Array) {
    try {
      let result = await this.rpc.sendTransaction(cmd, this.processingKey);
      return result;
    } catch (e) {
      if (e instanceof Error) {
        console.log(e.message);
      }
      throw e;
    }
  }

  // Player Registration
  async installPlayer() {
    try {
      let cmd = createCommand(0n, BigInt(INSTALL_PLAYER), []);
      return await this.sendTransactionWithCommand(cmd);
    } catch (e) {
      if (e instanceof Error && e.message === "PlayerAlreadyExist") {
        console.log("Player already exists, skipping installation");
        return null;
      }
      throw e;
    }
  }

  // Deposit to target player (admin operation)
  async depositTo(targetProcessingKey: string, amount: bigint) {
    let nonce = await this.getNonce();
    const targetPid = this.resolvePidFromProcessingKey(targetProcessingKey);
    let cmd = createCommand(nonce, BigInt(DEPOSIT), [targetPid[0], targetPid[1], amount]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // Withdraw tokens
  async withdrawTokens(tokenId: bigint, amount: bigint, address: string) {
    let nonce = await this.getNonce();
    const cmd = createWithdrawCommand(nonce, BigInt(WITHDRAW), address, tokenId, amount);
    return await this.sendTransactionWithCommand(cmd);
  }

  // Place order (all types)
  async placeOrder(marketId: bigint, orderType: number, price: bigint, amount: bigint) {
    let nonce = await this.getNonce();
    let cmd = createCommand(nonce, BigInt(PLACE_ORDER), [marketId, BigInt(orderType), price, amount]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // Cancel order
  async cancelOrder(orderId: bigint) {
    let nonce = await this.getNonce();
    let cmd = createCommand(nonce, BigInt(CANCEL_ORDER), [orderId]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // Claim winnings
  async claim(marketId: bigint) {
    let nonce = await this.getNonce();
    let cmd = createCommand(nonce, BigInt(CLAIM), [marketId]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // Admin: Create market pair
  async createMarketPair(params: {
    assetId: bigint;
    startTick: bigint;
    endTick: bigint;
    oracleStartTime: bigint;
    oracleStartPrice: bigint;
  }) {
    let nonce = await this.getNonce();
    const pricePair = this.encodeI64(params.oracleStartPrice);
    let cmd = createCommand(nonce, BigInt(CREATE_MARKET), [
      params.assetId,
      params.startTick,
      params.endTick,
      params.oracleStartTime,
      pricePair[0],
      pricePair[1],
    ]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // Admin: Close market
  async closeMarket(marketId: bigint) {
    let nonce = await this.getNonce();
    let cmd = createCommand(nonce, BigInt(CLOSE_MARKET), [marketId]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // Admin: Resolve market
  async resolveMarket(marketId: bigint, oracleEndTime: bigint, oracleEndPrice: bigint) {
    let nonce = await this.getNonce();
    const pricePair = this.encodeI64(oracleEndPrice);
    let cmd = createCommand(nonce, BigInt(RESOLVE_MARKET), [marketId, oracleEndTime, pricePair[0], pricePair[1]]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // Admin: Execute trade
  async executeTrade(params: { buyOrderId: bigint; sellOrderId: bigint; price: bigint; amount: bigint }) {
    let nonce = await this.getNonce();
    let cmd = createCommand(nonce, BigInt(EXECUTE_TRADE), [
      params.buyOrderId,
      params.sellOrderId,
      params.price,
      params.amount,
    ]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // Admin: Set fee exempt
  async setFeeExempt(targetProcessingKey: string, enabled: boolean) {
    let nonce = await this.getNonce();
    const targetPid = this.resolvePidFromProcessingKey(targetProcessingKey);
    let cmd = createCommand(nonce, BigInt(SET_FEE_EXEMPT), [targetPid[0], targetPid[1], enabled ? 1n : 0n]);
    return await this.sendTransactionWithCommand(cmd);
  }

  // Query methods
  async queryState(): Promise<any> {
    const response = await this.rpc.queryState(this.privkey);
    return response?.data ? JSON.parse(response.data) : null;
  }

  async queryData(endpoint: string): Promise<any> {
    return await this.rpc.queryData(endpoint);
  }

  // Market data methods
  async getAllMarkets(): Promise<any[]> {
    try {
      const marketsData = await this.rpc.queryData('/data/markets');
      return marketsData || [];
    } catch (error) {
      console.error('Failed to fetch markets:', error);
      return [];
    }
  }

  async getMarket(marketId: string): Promise<any> {
    try {
      return await this.rpc.queryData(`/data/market/${marketId}`);
    } catch (error) {
      console.error('Failed to fetch market:', error);
      return null;
    }
  }

  async getMarketOrders(marketId: string): Promise<any[]> {
    try {
      const ordersData = await this.rpc.queryData(`/data/market/${marketId}/orders`);
      return ordersData || [];
    } catch (error) {
      console.error('Failed to fetch market orders:', error);
      return [];
    }
  }

  async getMarketTrades(marketId: string): Promise<any[]> {
    try {
      const tradesData = await this.rpc.queryData(`/data/market/${marketId}/trades`);
      return tradesData || [];
    } catch (error) {
      console.error('Failed to fetch market trades:', error);
      return [];
    }
  }

  async getUserPositions(pid1: string, pid2: string): Promise<any[]> {
    try {
      const positionsData = await this.rpc.queryData(`/data/player/${pid1}/${pid2}/positions`);
      return positionsData || [];
    } catch (error) {
      console.error('Failed to fetch user positions:', error);
      return [];
    }
  }

  async getUserStats(pid1: string, pid2: string): Promise<any> {
    try {
      return await this.rpc.queryData(`/data/player/${pid1}/${pid2}/stats`);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      return null;
    }
  }

  async getUserTransactionHistory(pid1: string, pid2: string): Promise<any[]> {
    try {
      const historyData = await this.rpc.queryData(`/data/player/${pid1}/${pid2}/history`);
      return historyData || [];
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      return [];
    }
  }

  async getGlobalState(): Promise<any> {
    try {
      return await this.rpc.queryData('/data/state');
    } catch (error) {
      console.error('Failed to fetch global state:', error);
      return null;
    }
  }

  // Helper methods
  protected resolvePidFromProcessingKey(processingKey: string): [bigint, bigint] {
    try {
      // Extract public key from private key using delphinus-curves
      const pkey = PrivateKey.fromString(processingKey);
      const pubkey = pkey.publicKey.key.x.v;

      // Convert to little-endian hex format
      const leHexBN = new LeHexBN(bnToHexLe(pubkey));
      const pkeyArray = leHexBN.toU64Array();

      if (pkeyArray.length < 3) {
        throw new Error("Invalid processing key - insufficient data");
      }

      // Use indices [1] and [2] (NOT [0] and [1])
      // This matches the zkWasm backend convention
      return [BigInt(pkeyArray[1]), BigInt(pkeyArray[2])];
    } catch (error) {
      console.error("Error resolving PID from processing key:", error);
      throw new Error("Invalid processing key");
    }
  }

  private encodeI64(value: bigint): [bigint, bigint] {
    const signed = BigInt.asIntN(64, value);
    const high = (signed >> 32n) & 0xffffffffn;
    const low = signed & 0xffffffffn;
    return [high, low];
  }
}

// REST API for querying data (separate from blockchain operations)
export class PredictionMarketRESTAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getMarkets(): Promise<ApiResponse<any[]>> {
    return this.request('/data/markets');
  }

  async getMarket(marketId: string): Promise<ApiResponse<any>> {
    return this.request(`/data/market/${marketId}`);
  }

  async getOrders(marketId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/data/market/${marketId}/orders`);
  }

  async getTrades(marketId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/data/market/${marketId}/trades`);
  }

  async getTradeHistory(marketId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/data/market/${marketId}/trade-history`);
  }

  async getPositions(pid1: string, pid2: string): Promise<ApiResponse<any[]>> {
    return this.request(`/data/player/${pid1}/${pid2}/positions`);
  }

  async getState(): Promise<ApiResponse<any>> {
    return this.request('/data/state');
  }
}

// Factory function
export function createPredictionMarketAPI(config: { serverUrl: string; privkey: string }) {
  return new PredictionMarketAPI(config);
}

export function createRESTAPI(baseUrl?: string) {
  return new PredictionMarketRESTAPI(baseUrl);
}

// Export types
export type { PredictionMarketAPI };
export { PredictionMarketRESTAPI as RESTAPI };