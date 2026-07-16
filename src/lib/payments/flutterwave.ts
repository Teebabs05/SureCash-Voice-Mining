import "server-only";
import { getCredential } from "@/lib/server/credentials";

/**
 * Flutterwave (v3 API) client.
 *
 * Higher confidence than Monnify/Korapay/BillStack/PayVessel — Flutterwave
 * is one of the largest, most stable, most widely-documented African
 * payment gateways, on par with Paystack itself — but still not verified
 * against a live response: this sandbox's network policy blocks
 * api.flutterwave.com the same way it blocked every other provider's host
 * this session. A wrong assumption fails cleanly (falls back to manual
 * processing) rather than silently misreporting money movement.
 *
 * One detail worth calling out because it's easy to implement wrong:
 * Flutterwave's webhook "signature" isn't an HMAC — it's a static secret
 * hash string you set in the dashboard, which they echo back verbatim in
 * the `verif-hash` header for you to compare with plain string equality.
 */

const BASE_URL = "https://api.flutterwave.com/v3";

function getSecretKey(): Promise<string | null> {
  return getCredential("FLUTTERWAVE_SECRET_KEY");
}

function headers(key: string) {
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export interface FlutterwaveInitResult {
  paymentLink: string;
  reference: string;
}

export async function initializePayment(params: {
  amount: number;
  email: string;
  name: string;
  reference: string;
}): Promise<FlutterwaveInitResult> {
  const key = await getSecretKey();
  if (!key) throw new Error("Flutterwave is not configured");

  const res = await fetch(`${BASE_URL}/payments`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({
      tx_ref: params.reference,
      amount: params.amount,
      currency: "NGN",
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet/deposit`,
      customer: { email: params.email, name: params.name },
      customizations: { title: "SureCash Mining wallet funding" },
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.data?.link) {
    throw new Error(`Flutterwave payment init failed: ${data?.message ?? res.statusText}`);
  }

  return { paymentLink: data.data.link, reference: params.reference };
}

export async function verifyPayment(reference: string): Promise<{ status: "success" | "failed" | "pending"; amount: number }> {
  const key = await getSecretKey();
  if (!key) throw new Error("Flutterwave is not configured");

  const res = await fetch(`${BASE_URL}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`, {
    headers: headers(key),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.data) {
    throw new Error(`Flutterwave verify failed: ${data?.message ?? res.statusText}`);
  }

  const raw = String(data.data.status ?? "").toLowerCase();
  const status = raw === "successful" ? "success" : raw === "failed" ? "failed" : "pending";
  return { status, amount: Number(data.data.amount ?? 0) };
}

export interface FlutterwaveTransferResult {
  status: "success" | "pending" | "failed";
  reference?: string;
  message?: string;
}

export async function initiateTransfer(params: {
  bankCode: string;
  accountNumber: string;
  amount: number;
  reference: string;
  narration: string;
}): Promise<FlutterwaveTransferResult> {
  const key = await getSecretKey();
  if (!key) throw new Error("Flutterwave is not configured");

  const res = await fetch(`${BASE_URL}/transfers`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({
      account_bank: params.bankCode,
      account_number: params.accountNumber,
      amount: params.amount,
      narration: params.narration,
      currency: "NGN",
      reference: params.reference,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.data) {
    return { status: "failed", message: data?.message ?? res.statusText ?? "Transfer request failed" };
  }

  const raw = String(data.data.status ?? "").toUpperCase();
  const status = raw === "SUCCESSFUL" ? "success" : raw === "FAILED" ? "failed" : "pending";
  return { status, reference: data.data.reference ?? params.reference };
}

export async function isFlutterwaveConfigured(): Promise<boolean> {
  return Boolean(await getSecretKey());
}

/**
 * Flutterwave doesn't HMAC-sign webhooks — it just echoes back the static
 * secret hash you configured in your dashboard (FLUTTERWAVE_WEBHOOK_HASH),
 * in the `verif-hash` header, for a plain string comparison.
 */
export async function verifyWebhookSignature(signature: string | null): Promise<boolean> {
  const expected = await getCredential("FLUTTERWAVE_WEBHOOK_HASH");
  if (!expected || !signature) return false;
  return signature === expected;
}
