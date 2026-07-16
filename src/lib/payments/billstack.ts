import "server-only";
import { getCredential } from "@/lib/server/credentials";

/**
 * BillStack (billstack.co) client.
 *
 * IMPORTANT — best-effort integration: BillStack's docs (billstack.gitbook.io/api)
 * were not reachable from the build environment this was written in (network
 * policy blocked the host entirely), so the endpoint paths, field names, and
 * response shapes below are inferred from public search-result fragments and
 * standard Nigerian NUBAN-provider conventions (Paystack/Monnify/Flutterwave
 * all follow a similar shape), NOT confirmed against BillStack's real API
 * responses. Every call is wrapped so a wrong path/field just fails cleanly
 * (falls back to manual processing, same as the other unconfigured payout
 * adapters) rather than assuming success — but verify each of the endpoints
 * marked "UNCONFIRMED" against your BillStack dashboard/Postman collection
 * before relying on this for real traffic:
 *   - createVirtualAccount(): POST /generateVirtualAccount/   [UNCONFIRMED path]
 *   - initiateTransfer():     POST /initiateTransfer/          [UNCONFIRMED path]
 * The only endpoint with a confirmed path is the KYC/BVN upgrade call,
 * referenced in public docs as POST /upgradeVirtualAccount/ — not used here
 * yet since it requires collecting the user's BVN.
 */

const BASE_URL = "https://api.billstack.co/v2/thirdparty";

function getSecretKey(): Promise<string | null> {
  return getCredential("BILLSTACK_SECRET_KEY");
}

function headers(key: string) {
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export interface BillstackVirtualAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  externalRef?: string;
}

/**
 * Creates a dedicated/reserved virtual account for a user. Called lazily
 * the first time a user opens the "fund via bank transfer" tab.
 */
export async function createVirtualAccount(params: {
  email: string;
  fullName: string;
  phone?: string | null;
}): Promise<BillstackVirtualAccount> {
  const key = await getSecretKey();
  if (!key) throw new Error("BillStack is not configured");

  const res = await fetch(`${BASE_URL}/generateVirtualAccount/`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({
      email: params.email,
      customer: params.email,
      first_name: params.fullName.split(" ")[0] ?? params.fullName,
      last_name: params.fullName.split(" ").slice(1).join(" ") || params.fullName,
      phone: params.phone ?? undefined,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error(`BillStack virtual account creation failed: ${data?.message ?? res.statusText}`);
  }

  // Response field names are a best-effort guess (account_number/account_name/
  // bank_name are the near-universal convention among NUBAN providers) —
  // adjust the `data.data ?? data` destructure below if BillStack nests
  // differently.
  const account = data.data ?? data;
  const accountNumber = account.account_number ?? account.accountNumber;
  const accountName = account.account_name ?? account.accountName;
  const bankName = account.bank_name ?? account.bankName ?? "BillStack Partner Bank";
  if (!accountNumber || !accountName) {
    throw new Error("BillStack virtual account creation returned an unexpected response shape");
  }

  return { accountNumber, accountName, bankName, externalRef: account.reference ?? account.customer ?? params.email };
}

export interface BillstackTransferResult {
  status: "success" | "pending" | "failed";
  reference?: string;
  message?: string;
}

/**
 * Initiates a bank transfer disbursement (instant withdrawal cash-out).
 * Assumes a single-call transfer (no separate "create recipient" step) —
 * common among Nigerian disbursement APIs, but unconfirmed for BillStack.
 */
export async function initiateTransfer(params: {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  reference: string;
  narration: string;
}): Promise<BillstackTransferResult> {
  const key = await getSecretKey();
  if (!key) throw new Error("BillStack is not configured");

  const res = await fetch(`${BASE_URL}/initiateTransfer/`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({
      bank_code: params.bankCode,
      account_number: params.accountNumber,
      account_name: params.accountName,
      amount: params.amount,
      reference: params.reference,
      narration: params.narration,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    return { status: "failed", message: data?.message ?? res.statusText ?? "Transfer request failed" };
  }

  const raw = String(data.status ?? data.data?.status ?? "").toLowerCase();
  const status = raw === "success" || raw === "completed" ? "success" : raw === "failed" ? "failed" : "pending";
  return { status, reference: data.reference ?? data.data?.reference ?? params.reference, message: data.message };
}

export async function isBillstackConfigured(): Promise<boolean> {
  return Boolean(await getSecretKey());
}
