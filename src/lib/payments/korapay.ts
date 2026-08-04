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
 *   - The post-checkout redirect field name (`redirect_url`) - if Korapay
 *     actually expects something else, the checkout will still succeed and
 *     the webhook will still credit the wallet, but the user will be left
 *     stranded on Korapay's own success page instead of coming back here.
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
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?deposit=${params.reference}`,
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

export interface KorapayTransferStatus {
  status: "success" | "failed" | "pending" | "processing";
  message?: string;
}

/**
 * Polls a single (non-bulk) transfer's status by the `reference` this app
 * assigned it when calling initiateTransfer above — confirmed against
 * Korapay's "Fetch Payout Transaction" guide (GET .../transactions/:reference,
 * same {status,message,data:{status,message,...}} envelope as the bulk
 * endpoints in this file). Manual fallback for when the transfer.success/
 * transfer.failed webhook (see /api/webhooks/korapay) doesn't arrive or
 * doesn't validate — same role as getBulkPayoutPayouts for batches, and
 * getWithdrawStatus in binance.ts for USDT.
 */
export async function getTransferStatus(reference: string): Promise<KorapayTransferStatus | null> {
  const key = await getSecretKey();
  if (!key) return null;

  const res = await fetch(`${BASE_URL}/merchant/api/v1/transactions/${encodeURIComponent(reference)}`, {
    headers: headers(key),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.data) return null;

  const raw = String(data.data.status ?? "").toLowerCase();
  const status: KorapayTransferStatus["status"] =
    raw === "success" || raw === "failed" || raw === "processing" ? raw : "pending";
  return { status, message: data.data.message };
}

/**
 * Bulk payouts — unlike the rest of this file, this section is confirmed
 * against Korapay's actual published docs (developers.korapay.com/docs/
 * bulk-payouts-via-api), not just training knowledge. Field names
 * (bank_code/account_number, the batch_reference/payouts[] request shape,
 * the {status,message,data} response envelope) are taken directly from
 * that page's documented request/response examples.
 *
 * Constraint that shapes how this is used: a batch must contain between 2
 * and 50 payouts — there is no single-item bulk call. That's why this is
 * wired up as an admin "pay several pending withdrawals at once" action
 * (see /api/admin/withdrawals/bulk-pay-korapay) rather than folding it
 * into the existing per-withdrawal attemptAutomaticPayout flow, which
 * fires immediately after a single withdrawal is created.
 */
export interface KorapayBulkPayoutItem {
  reference: string;
  amount: number;
  narration: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  email: string;
}

export interface KorapayBulkPayoutResult {
  status: "pending" | "failed";
  message?: string;
}

export async function initiateBulkPayout(params: {
  batchReference: string;
  payouts: KorapayBulkPayoutItem[];
}): Promise<KorapayBulkPayoutResult> {
  const key = await getSecretKey();
  if (!key) throw new Error("Korapay is not configured");

  const res = await fetch(`${BASE_URL}/merchant/api/v1/transactions/disburse/bulk`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({
      batch_reference: params.batchReference,
      currency: "NGN",
      // Korapay's own transfer fee defaults to being deducted from the
      // recipient's side (merchant_bears_cost defaults to false) - this app
      // already computes and deducts its own withdrawal fee up front, so
      // without this the user would be shorted a second, invisible fee on
      // top of the amount already shown to them in the app.
      merchant_bears_cost: true,
      payouts: params.payouts.map((p) => ({
        reference: p.reference,
        amount: p.amount,
        type: "bank_account",
        narration: p.narration,
        bank_account: { bank_code: p.bankCode, account_number: p.accountNumber },
        customer: { name: p.accountName, email: p.email },
      })),
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.data) {
    return { status: "failed", message: data?.message ?? res.statusText ?? "Bulk payout request failed" };
  }

  const raw = String(data.data.status ?? "").toLowerCase();
  return { status: raw === "failed" ? "failed" : "pending" };
}

export interface KorapayBulkPayoutStatus {
  status: "pending" | "failed" | "complete";
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  processingTransactions: number;
}

export async function getBulkPayoutStatus(batchReference: string): Promise<KorapayBulkPayoutStatus | null> {
  const key = await getSecretKey();
  if (!key) return null;

  const res = await fetch(`${BASE_URL}/merchant/api/v1/transactions/bulk/${encodeURIComponent(batchReference)}`, {
    headers: headers(key),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.data) return null;

  const raw = String(data.data.status ?? "").toLowerCase();
  return {
    status: raw === "complete" ? "complete" : raw === "failed" ? "failed" : "pending",
    successfulTransactions: Number(data.data.successfulTransactions ?? 0),
    failedTransactions: Number(data.data.failedTransactions ?? 0),
    pendingTransactions: Number(data.data.pendingTransactions ?? 0),
    processingTransactions: Number(data.data.processingTransactions ?? 0),
  };
}

export interface KorapayBatchPayoutEntry {
  reference: string;
  status: "success" | "failed" | "pending" | "processing";
  message?: string;
}

/**
 * Per-payout statuses within a batch — used to reconcile individual
 * Withdrawal rows by their `reference`.
 *
 * Two Korapay docs sources disagree on this path: the dedicated "Bulk
 * Payouts via API" guide says `/bulk/:batch_reference/payouts` (plural,
 * matches the array response it documents), while the general Postman-style
 * API reference shows `/bulk/:bulk_reference/payout` (singular) for what
 * looks like the same call. Going with the guide's plural form here since
 * it's dedicated to this exact feature and its path matches its own
 * documented array response — but this is the one endpoint in this file
 * worth a live test call against before relying on it in production.
 */
export async function getBulkPayoutPayouts(batchReference: string): Promise<KorapayBatchPayoutEntry[]> {
  const key = await getSecretKey();
  if (!key) return [];

  const res = await fetch(`${BASE_URL}/merchant/api/v1/transactions/bulk/${encodeURIComponent(batchReference)}/payouts`, {
    headers: headers(key),
  });
  const data = await res.json().catch(() => null);
  const list = data?.data?.data;
  if (!res.ok || !Array.isArray(list)) return [];

  return list.map((p: { reference: string; status: string; message?: string }) => {
    const raw = String(p.status ?? "").toLowerCase();
    const status: KorapayBatchPayoutEntry["status"] =
      raw === "success" || raw === "failed" || raw === "processing" ? raw : "pending";
    return { reference: p.reference, status, message: p.message };
  });
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
