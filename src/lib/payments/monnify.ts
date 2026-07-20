import "server-only";
import crypto from "crypto";
import { getCredential } from "@/lib/server/credentials";

/**
 * Monnify (by Moniepoint) client.
 *
 * Built from solid training knowledge of Monnify's long-stable, widely
 * documented public API — the same confidence level as the Termii SMS
 * integration (not a from-scratch guess like BillStack's sparser docs), but
 * still NOT verified against a live response: this sandbox's network policy
 * blocks api.monnify.com the same way it blocked billstack.co and
 * api.ng.termii.com. Two things worth double-checking against your Monnify
 * dashboard/docs before trusting this with real traffic:
 *   - The disbursement endpoint version (v1 vs v2 — v2 can require OTP
 *     authorization above a configurable amount threshold; this uses v1,
 *     which doesn't).
 *   - The webhook signature header name (`monnify-signature` here) and
 *     algorithm (HMAC-SHA512 over the raw body using the secret key).
 * A wrong assumption fails cleanly (falls back to manual processing, same
 * as every other gateway here) rather than silently misreporting money
 * movement.
 */

const BASE_URL = process.env.MONNIFY_BASE_URL || "https://api.monnify.com";

async function getCredentials(): Promise<{ apiKey: string; secretKey: string } | null> {
  const apiKey = await getCredential("MONNIFY_API_KEY");
  const secretKey = await getCredential("MONNIFY_SECRET_KEY");
  return apiKey && secretKey ? { apiKey, secretKey } : null;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const creds = await getCredentials();
  if (!creds) throw new Error("Monnify is not configured");

  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const basicAuth = Buffer.from(`${creds.apiKey}:${creds.secretKey}`).toString("base64");
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${basicAuth}`, "Content-Type": "application/json" },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.responseBody?.accessToken) {
    throw new Error(`Monnify auth failed: ${data?.responseMessage ?? res.statusText}`);
  }

  cachedToken = {
    token: data.responseBody.accessToken,
    // Refresh a minute early so we never use a token right as it expires.
    expiresAt: Date.now() + Math.max(0, (data.responseBody.expiresIn - 60)) * 1000,
  };
  return cachedToken.token;
}

async function authedFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
}

export interface MonnifyInitResult {
  checkoutUrl: string;
  transactionReference: string;
}

export async function initializeTransaction(params: {
  amount: number;
  email: string;
  name: string;
  reference: string;
}): Promise<MonnifyInitResult> {
  const contractCode = await getCredential("MONNIFY_CONTRACT_CODE");
  if (!contractCode) throw new Error("Monnify is not configured (missing contract code)");

  const res = await authedFetch("/api/v1/merchant/transactions/init-transaction", {
    method: "POST",
    body: JSON.stringify({
      amount: params.amount,
      customerName: params.name,
      customerEmail: params.email,
      paymentReference: params.reference,
      paymentDescription: "SureCash Mining wallet funding",
      currencyCode: "NGN",
      contractCode,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/wallet/deposit`,
      paymentMethods: ["CARD", "ACCOUNT_TRANSFER"],
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.responseBody?.checkoutUrl) {
    throw new Error(`Monnify transaction init failed: ${data?.responseMessage ?? res.statusText}`);
  }

  return {
    checkoutUrl: data.responseBody.checkoutUrl,
    transactionReference: data.responseBody.transactionReference,
  };
}

export async function verifyTransaction(reference: string): Promise<{ status: "success" | "failed" | "pending"; amount: number }> {
  const res = await authedFetch(`/api/v1/merchant/transactions/query?paymentReference=${encodeURIComponent(reference)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.responseBody) {
    throw new Error(`Monnify transaction query failed: ${data?.responseMessage ?? res.statusText}`);
  }

  const paymentStatus = String(data.responseBody.paymentStatus ?? "").toUpperCase();
  const status = paymentStatus === "PAID" || paymentStatus === "OVERPAID" ? "success" : paymentStatus === "FAILED" ? "failed" : "pending";
  return { status, amount: Number(data.responseBody.amountPaid ?? 0) };
}

export interface MonnifyTransferResult {
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
}): Promise<MonnifyTransferResult> {
  const sourceAccountNumber = await getCredential("MONNIFY_WALLET_ACCOUNT_NUMBER");
  if (!sourceAccountNumber) throw new Error("Monnify is not configured (missing wallet account number)");

  const res = await authedFetch("/api/v1/disbursements/single", {
    method: "POST",
    body: JSON.stringify({
      amount: params.amount,
      reference: params.reference,
      narration: params.narration,
      destinationBankCode: params.bankCode,
      destinationAccountNumber: params.accountNumber,
      currency: "NGN",
      sourceAccountNumber,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.responseBody) {
    return { status: "failed", message: data?.responseMessage ?? res.statusText ?? "Transfer request failed" };
  }

  const raw = String(data.responseBody.status ?? "").toUpperCase();
  const status = raw === "SUCCESS" ? "success" : raw === "FAILED" ? "failed" : "pending";
  return { status, reference: data.responseBody.reference ?? params.reference };
}

export async function isMonnifyConfigured(): Promise<boolean> {
  return Boolean(await getCredentials());
}

export interface BankListEntry {
  code: string;
  name: string;
}

/** Best-effort, same standing as the rest of this file - unverified against a live response. */
export async function listBanks(): Promise<BankListEntry[]> {
  if (!(await getCredentials())) return [];

  const res = await fetch(`${BASE_URL}/api/v1/banks`);
  const data = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(data?.responseBody)) return [];

  return data.responseBody.map((b: { code: string; name: string }) => ({ code: b.code, name: b.name }));
}

/** Best-effort, same standing as the rest of this file - unverified against a live response. */
export async function resolveBankAccount(bankCode: string, accountNumber: string): Promise<string | null> {
  if (!(await getCredentials())) return null;

  const res = await authedFetch(
    `/api/v1/disbursements/account/validate?accountNumber=${encodeURIComponent(accountNumber)}&bankCode=${encodeURIComponent(bankCode)}`
  );
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.responseBody?.accountName) return null;
  return data.responseBody.accountName as string;
}

/** Same call as resolveBankAccount, but returns the raw response for admin diagnostics. */
export async function debugResolveBankAccount(bankCode: string, accountNumber: string) {
  if (!(await getCredentials())) {
    return { ok: false, status: 0, request: { accountNumber, bankCode }, body: { error: "Monnify is not configured" } };
  }
  const res = await authedFetch(
    `/api/v1/disbursements/account/validate?accountNumber=${encodeURIComponent(accountNumber)}&bankCode=${encodeURIComponent(bankCode)}`
  );
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, request: { accountNumber, bankCode }, body };
}

export async function verifyWebhookSignature(rawBody: string, signature: string | null): Promise<boolean> {
  const creds = await getCredentials();
  if (!creds || !signature) return false;

  const expected = crypto.createHmac("sha512", creds.secretKey).update(rawBody).digest("hex");
  return expected === signature;
}
