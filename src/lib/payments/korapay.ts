import "server-only";
import crypto from "crypto";
import { getCredential } from "@/lib/server/credentials";

/**
 * Korapay client.
 *
 * Best-effort, same standing as the Monnify integration: built from training
 * knowledge of Korapay's public API rather than a verified live response —
 * this sandbox's network policy blocks api.korapay.com the same way it
 * blocked api.monnify.com/api.ng.termii.com/billstack.co. A wrong endpoint
 * or field name fails cleanly (falls back to manual processing / a clear
 * error) rather than silently misreporting money movement.
 *
 * Specific things worth double-checking against your Korapay dashboard/docs
 * before trusting this with real traffic:
 *   - Korapay hashes only the `data` portion of the webhook payload (not the
 *     full raw body) with HMAC-SHA256 using the secret key, sent in an
 *     `x-korapay-signature` header — this differs from Paystack/Monnify,
 *     which sign the whole body, so it's easy to get wrong.
 *   - The disbursement request shape (nested `destination.bank_account`).
 */

const BASE_URL = "https://api.korapay.com";

function getSecretKey(): Promise<string | null> {
  return getCredential("KORAPAY_SECRET_KEY");
}

function headers(key: string) {
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export interface KorapayInitResult {
  checkoutUrl: string;
  reference: string;
}

export async function initializeCharge(params: {
  amount: number;
  email: string;
  name: string;
  reference: string;
}): Promise<KorapayInitResult> {
  const key = await getSecretKey();
  if (!key) throw new Error("Korapay is not configured");

  const res = await fetch(`${BASE_URL}/merchant/api/v1/charges/initialize`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({
      amount: params.amount,
      currency: "NGN",
      reference: params.reference,
      narration: "SureCash Mining wallet funding",
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/korapay`,
      customer: { name: params.name, email: params.email },
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.data?.checkout_url) {
    throw new Error(`Korapay charge init failed: ${data?.message ?? res.statusText}`);
  }

  return { checkoutUrl: data.data.checkout_url, reference: data.data.reference ?? params.reference };
}

export async function verifyCharge(reference: string): Promise<{ status: "success" | "failed" | "pending"; amount: number }> {
  const key = await getSecretKey();
  if (!key) throw new Error("Korapay is not configured");

  const res = await fetch(`${BASE_URL}/merchant/api/v1/charges/${encodeURIComponent(reference)}`, {
    headers: headers(key),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.data) {
    throw new Error(`Korapay charge verify failed: ${data?.message ?? res.statusText}`);
  }

  const raw = String(data.data.status ?? "").toLowerCase();
  const status = raw === "success" ? "success" : raw === "failed" ? "failed" : "pending";
  return { status, amount: Number(data.data.amount ?? 0) };
}

export interface KorapayTransferResult {
  status: "success" | "pending" | "failed";
  reference?: string;
  message?: string;
}

export async function initiateTransfer(params: {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  email: string;
  amount: number;
  reference: string;
  narration: string;
}): Promise<KorapayTransferResult> {
  const key = await getSecretKey();
  if (!key) throw new Error("Korapay is not configured");

  const res = await fetch(`${BASE_URL}/merchant/api/v1/transactions/disburse`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({
      reference: params.reference,
      destination: {
        type: "bank_account",
        amount: params.amount,
        currency: "NGN",
        narration: params.narration,
        bank_account: { bank: params.bankCode, account: params.accountNumber },
        customer: { name: params.accountName, email: params.email },
      },
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.data) {
    return { status: "failed", message: data?.message ?? res.statusText ?? "Transfer request failed" };
  }

  const raw = String(data.data.status ?? "").toLowerCase();
  const status = raw === "success" ? "success" : raw === "failed" ? "failed" : "pending";
  return { status, reference: data.data.reference ?? params.reference };
}

export async function isKorapayConfigured(): Promise<boolean> {
  return Boolean(await getSecretKey());
}

export interface BankListEntry {
  code: string;
  name: string;
}

/** Best-effort, same standing as the rest of this file - unverified against a live response. */
export async function listBanks(): Promise<BankListEntry[]> {
  const key = await getSecretKey();
  if (!key) return [];

  const res = await fetch(`${BASE_URL}/merchant/api/v1/misc/banks`, { headers: headers(key) });
  const data = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(data?.data)) {
    console.error("[korapay:listBanks] unexpected response", res.status, JSON.stringify(data));
    return [];
  }

  return data.data.map((b: { code: string; name: string }) => ({ code: b.code, name: b.name }));
}

/** Same call as listBanks, but returns the raw response for admin diagnostics. */
export async function debugListBanks() {
  const key = await getSecretKey();
  if (!key) return { ok: false, status: 0, body: { error: "Korapay is not configured" } };

  const res = await fetch(`${BASE_URL}/merchant/api/v1/misc/banks`, { headers: headers(key) });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

/** Best-effort, same standing as the rest of this file - unverified against a live response. */
export async function resolveBankAccount(bankCode: string, accountNumber: string): Promise<string | null> {
  const key = await getSecretKey();
  if (!key) return null;

  const res = await fetch(`${BASE_URL}/merchant/api/v1/misc/banks/resolve`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({ bank: bankCode, account: accountNumber }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.data?.account_name) {
    // Logged (not just swallowed) so a real failure reason from Korapay -
    // wrong bank code, unsupported bank, auth issue, etc. - shows up in the
    // app's server logs instead of just silently falling back to manual
    // review with no way to tell why.
    console.error(
      "[korapay:resolveBankAccount] failed",
      JSON.stringify({ bankCode, status: res.status, body: data })
    );
    return null;
  }
  return data.data.account_name as string;
}

/** Same call as resolveBankAccount, but returns the raw response for admin diagnostics. */
export async function debugResolveBankAccount(bankCode: string, accountNumber: string) {
  const key = await getSecretKey();
  if (!key) return { ok: false, status: 0, request: { bank: bankCode, account: accountNumber }, body: { error: "Korapay is not configured" } };

  const res = await fetch(`${BASE_URL}/merchant/api/v1/misc/banks/resolve`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({ bank: bankCode, account: accountNumber }),
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, request: { bank: bankCode, account: accountNumber }, body };
}

/**
 * Korapay's documented quirk (per training knowledge, unconfirmed live):
 * the signature is computed over JSON.stringify(payload.data), not the raw
 * request body — different from Paystack/Monnify, which sign the whole
 * body. Verify this against a real webhook delivery before relying on it.
 */
export async function verifyWebhookSignature(payload: { data?: unknown }, signature: string | null): Promise<boolean> {
  const key = await getSecretKey();
  if (!key || !signature || !payload?.data) return false;

  const expected = crypto.createHmac("sha256", key).update(JSON.stringify(payload.data)).digest("hex");
  return expected === signature;
}
