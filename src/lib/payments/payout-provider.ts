import { initiateTransfer as billstackInitiateTransfer } from "@/lib/payments/billstack";
import { initiateTransfer as monnifyInitiateTransfer } from "@/lib/payments/monnify";
import { initiateTransfer as korapayInitiateTransfer } from "@/lib/payments/korapay";
import { initiateTransfer as payvesselInitiateTransfer } from "@/lib/payments/payvessel";
import { initiateTransfer as flutterwaveInitiateTransfer } from "@/lib/payments/flutterwave";

export interface PayoutRecipient {
  recipientCode: string;
}

export interface PayoutResult {
  status: "success" | "pending" | "failed";
  transferCode?: string;
  message?: string;
}

export interface PayoutProviderAdapter {
  name: string;
  resolveRecipient(params: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
    email?: string;
  }): Promise<PayoutRecipient>;
  initiateTransfer(params: {
    amount: number;
    recipientCode: string;
    reference: string;
    reason: string;
  }): Promise<PayoutResult>;
}

class PaystackPayoutProvider implements PayoutProviderAdapter {
  name = "PAYSTACK";
  private key = process.env.PAYSTACK_SECRET_KEY;

  async resolveRecipient(params: { bankCode: string; accountNumber: string; accountName: string; email?: string }): Promise<PayoutRecipient> {
    if (!this.key) throw new Error("Paystack is not configured");

    const res = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "nuban",
        name: params.accountName,
        account_number: params.accountNumber,
        bank_code: params.bankCode,
        currency: "NGN",
      }),
    });

    if (!res.ok) throw new Error(`Paystack recipient creation failed: ${await res.text()}`);
    const data = await res.json();
    return { recipientCode: data.data.recipient_code };
  }

  async initiateTransfer(params: {
    amount: number;
    recipientCode: string;
    reference: string;
    reason: string;
  }): Promise<PayoutResult> {
    if (!this.key) throw new Error("Paystack is not configured");

    const res = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "balance",
        amount: Math.round(params.amount * 100),
        recipient: params.recipientCode,
        reference: params.reference,
        reason: params.reason,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "failed", message: data.message ?? "Transfer initiation failed" };
    }

    const status = data.data.status === "success" ? "success" : data.data.status === "failed" ? "failed" : "pending";
    return { status, transferCode: data.data.transfer_code };
  }
}

/**
 * BillStack doesn't need a separate "create recipient" call (best-effort
 * assumption — see src/lib/payments/billstack.ts), so resolveRecipient just
 * packs the bank details into an opaque code for initiateTransfer to unpack.
 */
class BillstackPayoutProvider implements PayoutProviderAdapter {
  name = "BILLSTACK";

  async resolveRecipient(params: { bankCode: string; accountNumber: string; accountName: string; email?: string }): Promise<PayoutRecipient> {
    return { recipientCode: JSON.stringify(params) };
  }

  async initiateTransfer(params: {
    amount: number;
    recipientCode: string;
    reference: string;
    reason: string;
  }): Promise<PayoutResult> {
    const recipient = JSON.parse(params.recipientCode) as { bankCode: string; accountNumber: string; accountName: string };
    const result = await billstackInitiateTransfer({
      bankCode: recipient.bankCode,
      accountNumber: recipient.accountNumber,
      accountName: recipient.accountName,
      amount: params.amount,
      reference: params.reference,
      narration: params.reason,
    });
    return { status: result.status, transferCode: result.reference, message: result.message };
  }
}

/**
 * Monnify's disbursement API is also a single call with no separate
 * "create recipient" step, same pattern as BillStack.
 */
class MonnifyPayoutProvider implements PayoutProviderAdapter {
  name = "MONNIFY";

  async resolveRecipient(params: { bankCode: string; accountNumber: string; accountName: string; email?: string }): Promise<PayoutRecipient> {
    return { recipientCode: JSON.stringify(params) };
  }

  async initiateTransfer(params: {
    amount: number;
    recipientCode: string;
    reference: string;
    reason: string;
  }): Promise<PayoutResult> {
    const recipient = JSON.parse(params.recipientCode) as { bankCode: string; accountNumber: string; accountName: string };
    const result = await monnifyInitiateTransfer({
      bankCode: recipient.bankCode,
      accountNumber: recipient.accountNumber,
      amount: params.amount,
      reference: params.reference,
      narration: params.reason,
    });
    return { status: result.status, transferCode: result.reference, message: result.message };
  }
}

/**
 * Korapay's disbursement API is also a single call, but unlike BillStack/
 * Monnify its customer object wants an email — packed into the opaque
 * recipient code alongside the bank details since resolveRecipient/
 * initiateTransfer don't share request context otherwise.
 */
class KorapayPayoutProvider implements PayoutProviderAdapter {
  name = "KORAPAY";

  async resolveRecipient(params: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
    email?: string;
  }): Promise<PayoutRecipient> {
    return { recipientCode: JSON.stringify(params) };
  }

  async initiateTransfer(params: {
    amount: number;
    recipientCode: string;
    reference: string;
    reason: string;
  }): Promise<PayoutResult> {
    const recipient = JSON.parse(params.recipientCode) as {
      bankCode: string;
      accountNumber: string;
      accountName: string;
      email?: string;
    };
    const result = await korapayInitiateTransfer({
      bankCode: recipient.bankCode,
      accountNumber: recipient.accountNumber,
      accountName: recipient.accountName,
      email: recipient.email || "payouts@surecashmining.com",
      amount: params.amount,
      reference: params.reference,
      narration: params.reason,
    });
    return { status: result.status, transferCode: result.reference, message: result.message };
  }
}

/**
 * PayVessel's disbursement API is also a single call, no separate
 * "create recipient" step (same pattern as BillStack/Monnify/Korapay) —
 * though unlike those, the endpoint path itself is a best-effort guess, not
 * confirmed. See the confidence note in src/lib/payments/payvessel.ts.
 */
class PayvesselPayoutProvider implements PayoutProviderAdapter {
  name = "PAYVESSEL";

  async resolveRecipient(params: { bankCode: string; accountNumber: string; accountName: string }): Promise<PayoutRecipient> {
    return { recipientCode: JSON.stringify(params) };
  }

  async initiateTransfer(params: {
    amount: number;
    recipientCode: string;
    reference: string;
    reason: string;
  }): Promise<PayoutResult> {
    const recipient = JSON.parse(params.recipientCode) as { bankCode: string; accountNumber: string; accountName: string };
    const result = await payvesselInitiateTransfer({
      bankCode: recipient.bankCode,
      accountNumber: recipient.accountNumber,
      accountName: recipient.accountName,
      amount: params.amount,
      reference: params.reference,
      narration: params.reason,
    });
    return { status: result.status, transferCode: result.reference, message: result.message };
  }
}

/**
 * Flutterwave's Transfers API is also a single call with no separate
 * "create recipient" step, same pattern as the other providers here.
 */
class FlutterwavePayoutProvider implements PayoutProviderAdapter {
  name = "FLUTTERWAVE";

  async resolveRecipient(params: { bankCode: string; accountNumber: string; accountName: string; email?: string }): Promise<PayoutRecipient> {
    return { recipientCode: JSON.stringify(params) };
  }

  async initiateTransfer(params: {
    amount: number;
    recipientCode: string;
    reference: string;
    reason: string;
  }): Promise<PayoutResult> {
    const recipient = JSON.parse(params.recipientCode) as { bankCode: string; accountNumber: string; accountName: string };
    const result = await flutterwaveInitiateTransfer({
      bankCode: recipient.bankCode,
      accountNumber: recipient.accountNumber,
      amount: params.amount,
      reference: params.reference,
      narration: params.reason,
    });
    return { status: result.status, transferCode: result.reference, message: result.message };
  }
}

export function getPayoutProvider(
  provider: "PAYSTACK" | "MONNIFY" | "KORAPAY" | "PAYVESSEL" | "BILLSTACK" | "FLUTTERWAVE"
): PayoutProviderAdapter {
  switch (provider) {
    case "PAYSTACK":
      return new PaystackPayoutProvider();
    case "MONNIFY":
      return new MonnifyPayoutProvider();
    case "KORAPAY":
      return new KorapayPayoutProvider();
    case "PAYVESSEL":
      return new PayvesselPayoutProvider();
    case "BILLSTACK":
      return new BillstackPayoutProvider();
    case "FLUTTERWAVE":
      return new FlutterwavePayoutProvider();
  }
}

/** Which gateway to attempt automatic disbursement through by default. */
export function getDefaultPayoutProvider(): "PAYSTACK" | "MONNIFY" | "KORAPAY" | "PAYVESSEL" | "BILLSTACK" | "FLUTTERWAVE" {
  const configured = process.env.DEFAULT_PAYOUT_PROVIDER;
  if (
    configured === "MONNIFY" ||
    configured === "KORAPAY" ||
    configured === "PAYVESSEL" ||
    configured === "PAYSTACK" ||
    configured === "BILLSTACK" ||
    configured === "FLUTTERWAVE"
  ) {
    return configured;
  }
  return "PAYSTACK";
}
