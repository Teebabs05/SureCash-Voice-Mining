import "server-only";
import { getCredential } from "@/lib/server/credentials";
import type {
  VtuProviderAdapter,
  VtuPurchaseResult,
  VtuPurchaseStatus,
  VtuVariation,
  VtuCustomerInfo,
} from "@/lib/payments/vtu-provider";

/**
 * VTU.ng API v2 client — confirmed against VTU.ng's own published docs
 * (vtu.ng/api/), not training-knowledge guesswork like some of the payment
 * gateway clients in this codebase were.
 *
 * Auth is JWT, not a static API key: POST /jwt-auth/v1/token with a
 * username+password returns a token valid 7 days, and only the latest
 * token issued stays valid (generating a new one invalidates older ones).
 * That's a real risk if multiple server processes each cache their own
 * token independently - authRequest retries once with a fresh token on a
 * 403, to ride out one process's login invalidating another's cached token.
 *
 * Deliberately does NOT lean on VTU.ng's webhook to confirm purchase
 * completion: their own docs say the "completed" webhook event "only
 * [fires] when triggered manually by an administrator" on VTU.ng's side,
 * not for routine automatic completions. Every purchase call here reads
 * its own response status; requeryOrder is the fallback for anything left
 * in an in-flight state.
 */

const BASE_URL = "https://vtu.ng/wp-json";
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // refresh well under the 7-day expiry

let cachedToken: { token: string; fetchedAt: number } | null = null;

async function login(): Promise<string> {
  const username = await getCredential("VTU_NG_USERNAME");
  const password = await getCredential("VTU_NG_PASSWORD");
  if (!username || !password) throw new Error("VTU.ng is not configured");

  const res = await fetch(`${BASE_URL}/jwt-auth/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.token) {
    throw new Error(data?.message ?? "VTU.ng authentication failed");
  }
  cachedToken = { token: data.token, fetchedAt: Date.now() };
  return data.token;
}

async function getToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && Date.now() - cachedToken.fetchedAt < TOKEN_MAX_AGE_MS) {
    return cachedToken.token;
  }
  return login();
}

async function authRequest(method: "GET" | "POST", path: string, body?: Record<string, unknown>): Promise<unknown> {
  let token = await getToken();

  const doFetch = async (t: string) =>
    fetch(`${BASE_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch(token);
  if (res.status === 403) {
    // Could be an invalidated token (another process logged in and minted a
    // newer one) rather than a real permissions problem - one retry with a
    // freshly issued token before giving up.
    token = await getToken(true);
    res = await doFetch(token);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error((data as { message?: string } | null)?.message ?? res.statusText ?? "VTU.ng request failed");
  }
  return data;
}

function mapStatus(raw: string): VtuPurchaseStatus {
  switch (raw) {
    case "completed-api":
      return "completed";
    case "refunded":
      return "refunded";
    case "processing-api":
    case "queued-api":
    case "initiated-api":
    case "pending":
    case "on-hold":
      return "processing";
    default:
      // "cancelled", "failed", or anything unrecognized - treated as failed
      // rather than silently assumed in-flight (the exact mistake that left
      // Korapay withdrawals stuck in PROCESSING forever).
      return "failed";
  }
}

function toPurchaseResult(response: unknown): VtuPurchaseResult {
  const data = (response as { data?: Record<string, unknown> })?.data ?? {};
  const message = (response as { message?: string })?.message;
  return {
    status: mapStatus(String(data.status ?? "")),
    providerOrderId: data.order_id != null ? String(data.order_id) : undefined,
    amountCharged: data.amount_charged != null ? Number(data.amount_charged) : undefined,
    token: data.token != null ? String(data.token) : undefined,
    units: data.units != null ? String(data.units) : undefined,
    message,
    raw: response,
  };
}

function toVariations(response: unknown): VtuVariation[] {
  const list = (response as { data?: unknown[] })?.data;
  if (!Array.isArray(list)) return [];
  return list.map((v) => {
    const item = v as Record<string, unknown>;
    return {
      variationId: String(item.variation_id),
      serviceId: String(item.service_id),
      serviceName: String(item.service_name),
      label: String(item.data_plan ?? item.package_bouquet ?? ""),
      price: Number(item.price),
      available: item.availability === "Available",
    };
  });
}

function toCustomerInfo(response: unknown): VtuCustomerInfo {
  const data = (response as { data?: Record<string, unknown> })?.data ?? {};
  return {
    name: String(data.customer_name ?? ""),
    address: data.customer_address != null ? String(data.customer_address) : undefined,
    currentBouquet: data.current_bouquet != null ? String(data.current_bouquet) : undefined,
    renewalAmount: data.renewal_amount != null ? Number(data.renewal_amount) : undefined,
    dueDate: data.due_date != null ? String(data.due_date) : undefined,
    minAmount: data.min_purchase_amount != null ? Number(data.min_purchase_amount) : undefined,
    maxAmount: data.max_purchase_amount != null ? Number(data.max_purchase_amount) : undefined,
  };
}

export class VtuNgProvider implements VtuProviderAdapter {
  name = "VTU_NG" as const;

  async buyAirtime(params: { reference: string; phone: string; network: string; amount: number }): Promise<VtuPurchaseResult> {
    const res = await authRequest("POST", "/api/v2/airtime", {
      request_id: params.reference,
      phone: params.phone,
      service_id: params.network,
      amount: params.amount,
    });
    return toPurchaseResult(res);
  }

  async listDataVariations(network?: string): Promise<VtuVariation[]> {
    const path = network ? `/api/v2/variations/data?service_id=${encodeURIComponent(network)}` : "/api/v2/variations/data";
    const res = await fetch(`${BASE_URL}${path}`);
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) return [];
    return toVariations(data);
  }

  async buyData(params: { reference: string; phone: string; network: string; variationId: string }): Promise<VtuPurchaseResult> {
    const res = await authRequest("POST", "/api/v2/data", {
      request_id: params.reference,
      phone: params.phone,
      service_id: params.network,
      variation_id: params.variationId,
    });
    return toPurchaseResult(res);
  }

  async verifyElectricityCustomer(params: { meterNumber: string; disco: string; meterType: "prepaid" | "postpaid" }): Promise<VtuCustomerInfo> {
    const res = await authRequest("POST", "/api/v2/verify-customer", {
      customer_id: params.meterNumber,
      service_id: params.disco,
      variation_id: params.meterType,
    });
    return toCustomerInfo(res);
  }

  async buyElectricity(params: {
    reference: string;
    meterNumber: string;
    disco: string;
    meterType: "prepaid" | "postpaid";
    amount: number;
  }): Promise<VtuPurchaseResult> {
    const res = await authRequest("POST", "/api/v2/electricity", {
      request_id: params.reference,
      customer_id: params.meterNumber,
      service_id: params.disco,
      variation_id: params.meterType,
      amount: params.amount,
    });
    return toPurchaseResult(res);
  }

  async listCableVariations(provider?: string): Promise<VtuVariation[]> {
    const path = provider ? `/api/v2/variations/tv?service_id=${encodeURIComponent(provider)}` : "/api/v2/variations/tv";
    const res = await fetch(`${BASE_URL}${path}`);
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) return [];
    return toVariations(data);
  }

  async verifyCableCustomer(params: { smartcardNumber: string; provider: string }): Promise<VtuCustomerInfo> {
    const res = await authRequest("POST", "/api/v2/verify-customer", {
      customer_id: params.smartcardNumber,
      service_id: params.provider,
    });
    return toCustomerInfo(res);
  }

  async buyCableTv(params: { reference: string; smartcardNumber: string; provider: string; variationId: string }): Promise<VtuPurchaseResult> {
    const res = await authRequest("POST", "/api/v2/tv", {
      request_id: params.reference,
      customer_id: params.smartcardNumber,
      service_id: params.provider,
      variation_id: params.variationId,
      subscription_type: "change",
    });
    return toPurchaseResult(res);
  }

  async requeryOrder(reference: string): Promise<VtuPurchaseResult | null> {
    try {
      const res = await authRequest("POST", "/api/v2/requery", { request_id: reference });
      return toPurchaseResult(res);
    } catch (error) {
      if (error instanceof Error && /not found/i.test(error.message)) return null;
      throw error;
    }
  }
}

export async function isVtuNgConfigured(): Promise<boolean> {
  const username = await getCredential("VTU_NG_USERNAME");
  const password = await getCredential("VTU_NG_PASSWORD");
  return Boolean(username && password);
}
