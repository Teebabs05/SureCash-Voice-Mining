import "server-only";
import crypto from "crypto";

/**
 * PayVessel client — instant withdrawal payouts only (deposits are skipped;
 * PayVessel's core product is dedicated virtual accounts, a different
 * modality from the checkout-redirect deposit flow this app uses for
 * Paystack/Monnify/Korapay, and wiring that up wasn't in scope here).
 *
 * Confidence is lower here than Monnify/Korapay, closer to BillStack's
 * standing, because PayVessel is a smaller, more sparsely-documented
 * provider:
 *   - CONFIRMED (via public search results, not live-tested — same
 *     api.payvessel.com network-policy block as every other provider this
 *     session): base URL `https://api.payvessel.com`, the `api-key` +
 *     `api-secret: Bearer <secret>` auth header pattern, and the webhook
 *     signature scheme (HMAC-SHA512 over the full raw body, header
 *     `payvessel-http-signature`).
 *   - GUESSED: the disbursement endpoint path below
 *     (`/pms/api/external/transfer/singleTransfer/`) is extrapolated from
 *     the one confirmed endpoint's URL shape
 *     (`/pms/api/external/request/customerReservedAccount/`), not itself
 *     confirmed. Same for the request/response field names. This is
 *     meaningfully weaker footing than the rest of this file — get the
 *     real endpoint from PayVessel's dashboard/Postman collection and
 *     correct it here before relying on this for real payouts.
 * As always, a wrong endpoint fails cleanly (falls back to manual
 * processing) rather than silently misreporting a transfer.
 */

const BASE_URL = "https://api.payvessel.com";

function getCredentials(): { apiKey: string; secretKey: string } | null {
  const apiKey = process.env.PAYVESSEL_API_KEY;
  const secretKey = process.env.PAYVESSEL_SECRET_KEY;
  return apiKey && secretKey ? { apiKey, secretKey } : null;
}

function headers(creds: { apiKey: string; secretKey: string }) {
  return {
    "api-key": creds.apiKey,
    "api-secret": `Bearer ${creds.secretKey}`,
    "Content-Type": "application/json",
  };
}

export interface PayvesselTransferResult {
  status: "success" | "pending" | "failed";
  reference?: string;
  message?: string;
}

export async function initiateTransfer(params: {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  reference: string;
  narration: string;
}): Promise<PayvesselTransferResult> {
  const creds = getCredentials();
  if (!creds) throw new Error("PayVessel is not configured");

  const res = await fetch(`${BASE_URL}/pms/api/external/transfer/singleTransfer/`, {
    method: "POST",
    headers: headers(creds),
    body: JSON.stringify({
      amount: params.amount,
      bank_code: params.bankCode,
      account_number: params.accountNumber,
      account_name: params.accountName,
      narration: params.narration,
      reference: params.reference,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    return { status: "failed", message: data?.message ?? res.statusText ?? "Transfer request failed" };
  }

  const raw = String(data.status ?? data.data?.status ?? "").toLowerCase();
  const status = raw === "success" || raw === "successful" ? "success" : raw === "failed" ? "failed" : "pending";
  return { status, reference: data.reference ?? data.data?.reference ?? params.reference };
}

export function isPayvesselConfigured(): boolean {
  return Boolean(getCredentials());
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const creds = getCredentials();
  if (!creds || !signature) return false;

  const expected = crypto.createHmac("sha512", creds.secretKey).update(rawBody).digest("hex");
  return expected === signature;
}
