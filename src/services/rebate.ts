// Rebate System REST 客户端
// 基于 rebate_system 的 API: /api/rebate/summary, /api/rebate/records, /api/rebate/claim
// 通过环境变量配置：
// - VITE_REBATE_BASE_URL (如 http://127.0.0.1:8000)
// - VITE_REBATE_USER_ID  (开发期用于 X-User-Id，生产建议后端基于鉴权获取)

export type RebateType = "fee" | "mining";

export interface RebateSummary {
  pending_fee: string;
  pending_mining: string;
  claimed_fee: string;
  claimed_mining: string;
  level?: string | null;
  tier1_rate?: string | null;
  tier2_rate?: string | null;
}

export interface RebateRecord {
  id: number;
  user_id: number;
  from_user_id: number;
  rebate_type: "fee" | "mining";
  amount: string;
  rebate_rate: string;
  status: "pending" | "claimed";
  transaction_id?: number | null;
  mining_id?: number | null;
  tier_level?: number | null;
}

export interface ClaimResult {
  user_id: number;
  rebate_type: RebateType;
  claimed_amount: string;
  record_count: number;
  tx_hash?: string | null;
}

const BASE_URL = import.meta.env.VITE_REBATE_BASE_URL || "";
const DEV_USER_ID = import.meta.env.VITE_REBATE_USER_ID || "1";

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-User-Id": DEV_USER_ID,
  };
}

export async function getRebateSummary(): Promise<RebateSummary> {
  const resp = await fetch(`${BASE_URL}/api/rebate/summary`, {
    headers: authHeaders(),
  });
  if (!resp.ok) {
    throw new Error(`Failed to load summary: ${resp.status}`);
  }
  return resp.json();
}

export async function getRebateRecords(params?: { page?: number; size?: number }): Promise<RebateRecord[]> {
  const page = params?.page ?? 1;
  const size = params?.size ?? 20;
  const resp = await fetch(`${BASE_URL}/api/rebate/records?page=${page}&size=${size}`, {
    headers: authHeaders(),
  });
  if (!resp.ok) {
    throw new Error(`Failed to load records: ${resp.status}`);
  }
  return resp.json();
}

export async function claimRebate(type: RebateType): Promise<ClaimResult> {
  const resp = await fetch(`${BASE_URL}/api/rebate/claim`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ rebate_type: type }),
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    // 后端 400 时 body.detail 为错误信息
    const msg = body?.detail || `Claim failed: ${resp.status}`;
    throw new Error(msg);
  }
  return body as ClaimResult;
}
