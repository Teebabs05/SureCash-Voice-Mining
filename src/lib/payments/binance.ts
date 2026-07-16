import "server-only";
import crypto from "crypto";
import { getCredential } from "@/lib/server/credentials";

/**
 * Binance Withdraw API client — used for automatic USDT disbursement on
 * withdrawal requests.
 *
 * Built from solid training knowledge of Binance's long-stable, widely
 * documented API (comparable confidence to Monnify/Korapay/Flutterwave),
 * but NOT verified against a live response — this sandbox's network policy
 * blocks api.binance.com the same way it blocked every other provider's
 * host this session. A wrong assumption fails cleanly (the withdrawal stays
 * PENDING for manual processing) rather than silently misreporting a
 * transfer — which matters more here than anywhere else in this app, since
 * a crypto send has no chargeback path if something ever did go wrong.
 *
 * One structural difference from every other payout provider here: Binance
 * does not push webhooks for withdrawal status. Status has to be polled via
 * getWithdrawStatus() — see the admin "check status" action on crypto
 * withdrawals — rather than arriving via /api/webhooks/*.
 *
 * Also worth confirming before production use: the numeric withdraw-history
 * `status` codes below (0–6) are recalled with moderate confidence, not
 * verified live. If Binance returns a status this code doesn't recognize,
 * treat it as "still processing" (the default case) rather than guessing.
 */

const BASE_URL = "https://api.binance.com";

// Our CryptoNetwork enum -> Binance's network parameter values.
const NETWORK_MAP: Record<string, string> = {
  TRC20: "TRX",
  ERC20: "ETH",
  BEP20: "BSC",
};

async function getCredentials(): Promise<{ apiKey: string; secretKey: string } | null> {
  const apiKey = await getCredential("BINANCE_API_KEY");
  const secretKey = await getCredential("BINANCE_SECRET_KEY");
  return apiKey && secretKey ? { apiKey, secretKey } : null;
}

function sign(query: string, secretKey: string): string {
  return crypto.createHmac("sha256", secretKey).update(query).digest("hex");
}

async function signedRequest(path: string, method: "GET" | "POST", params: Record<string, string>) {
  const creds = await getCredentials();
  if (!creds) throw new Error("Binance is not configured");

  const query = new URLSearchParams({ ...params, timestamp: String(Date.now()) }).toString();
  const signature = sign(query, creds.secretKey);
  const url = `${BASE_URL}${path}?${query}&signature=${signature}`;

  const res = await fetch(url, { method, headers: { "X-MBX-APIKEY": creds.apiKey } });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, data, statusText: res.statusText };
}

export interface BinanceWithdrawResult {
  status: "processing" | "failed";
  withdrawId?: string;
  message?: string;
}

export async function withdrawUsdt(params: {
  network: "TRC20" | "ERC20" | "BEP20";
  address: string;
  amount: number;
  withdrawOrderId: string;
}): Promise<BinanceWithdrawResult> {
  const binanceNetwork = NETWORK_MAP[params.network];
  if (!binanceNetwork) throw new Error(`Unsupported network for Binance withdrawal: ${params.network}`);

  const { ok, data, statusText } = await signedRequest("/sapi/v1/capital/withdraw/apply", "POST", {
    coin: "USDT",
    network: binanceNetwork,
    address: params.address,
    amount: String(params.amount),
    withdrawOrderId: params.withdrawOrderId,
  });

  if (!ok || !data?.id) {
    return { status: "failed", message: data?.msg ?? statusText ?? "Withdrawal request failed" };
  }

  return { status: "processing", withdrawId: data.id };
}

export interface BinanceWithdrawStatus {
  status: "processing" | "completed" | "failed";
  txId?: string;
}

/**
 * Polls Binance's withdraw history for the given client withdrawOrderId
 * (there's no per-withdrawal GET-by-id endpoint — you fetch recent history
 * and find the matching order). Status code mapping is the part of this
 * file with the least confidence; unrecognized codes fall through to
 * "processing" rather than being guessed at as success or failure.
 */
export async function getWithdrawStatus(withdrawOrderId: string): Promise<BinanceWithdrawStatus | null> {
  const { ok, data } = await signedRequest("/sapi/v1/capital/withdraw/history", "GET", { coin: "USDT" });
  if (!ok || !Array.isArray(data)) return null;

  const record = data.find((r: { withdrawOrderId?: string }) => r.withdrawOrderId === withdrawOrderId);
  if (!record) return null;

  const code = Number(record.status);
  if (code === 6) return { status: "completed", txId: record.txId };
  if (code === 3 || code === 5) return { status: "failed" };
  return { status: "processing" };
}

export async function isBinanceConfigured(): Promise<boolean> {
  return Boolean(await getCredentials());
}
