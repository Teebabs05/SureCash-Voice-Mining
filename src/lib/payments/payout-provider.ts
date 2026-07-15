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
  resolveRecipient(params: { bankCode: string; accountNumber: string; accountName: string }): Promise<PayoutRecipient>;
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

  async resolveRecipient(params: { bankCode: string; accountNumber: string; accountName: string }): Promise<PayoutRecipient> {
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

/** Placeholder adapters — implement the same interface once API credentials are available. */
class UnconfiguredPayoutProvider implements PayoutProviderAdapter {
  constructor(public name: string) {}
  async resolveRecipient(): Promise<PayoutRecipient> {
    throw new Error(`${this.name} payouts are not configured yet`);
  }
  async initiateTransfer(): Promise<PayoutResult> {
    throw new Error(`${this.name} payouts are not configured yet`);
  }
}

export function getPayoutProvider(provider: "PAYSTACK" | "MONNIFY" | "KORAPAY" | "PAYVESSEL"): PayoutProviderAdapter {
  switch (provider) {
    case "PAYSTACK":
      return new PaystackPayoutProvider();
    case "MONNIFY":
      return new UnconfiguredPayoutProvider("Monnify");
    case "KORAPAY":
      return new UnconfiguredPayoutProvider("Korapay");
    case "PAYVESSEL":
      return new UnconfiguredPayoutProvider("PayVessel");
  }
}

/** Which gateway to attempt automatic disbursement through by default. */
export function getDefaultPayoutProvider(): "PAYSTACK" | "MONNIFY" | "KORAPAY" | "PAYVESSEL" {
  const configured = process.env.DEFAULT_PAYOUT_PROVIDER;
  if (configured === "MONNIFY" || configured === "KORAPAY" || configured === "PAYVESSEL" || configured === "PAYSTACK") {
    return configured;
  }
  return "PAYSTACK";
}
