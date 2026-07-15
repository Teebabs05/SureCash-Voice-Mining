export interface PaymentInitResult {
  authorizationUrl: string;
  reference: string;
}

export interface PaymentVerifyResult {
  status: "success" | "failed" | "pending";
  amount: number;
}

export interface PaymentProvider {
  name: string;
  initialize(params: { amount: number; email: string; reference: string }): Promise<PaymentInitResult>;
  verify(reference: string): Promise<PaymentVerifyResult>;
}

class PaystackProvider implements PaymentProvider {
  name = "PAYSTACK";
  private key = process.env.PAYSTACK_SECRET_KEY;

  async initialize(params: { amount: number; email: string; reference: string }): Promise<PaymentInitResult> {
    if (!this.key) throw new Error("Paystack is not configured");

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: params.email,
        amount: Math.round(params.amount * 100),
        reference: params.reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet/deposit`,
      }),
    });

    if (!res.ok) throw new Error(`Paystack init failed: ${await res.text()}`);
    const data = await res.json();
    return { authorizationUrl: data.data.authorization_url, reference: data.data.reference };
  }

  async verify(reference: string): Promise<PaymentVerifyResult> {
    if (!this.key) throw new Error("Paystack is not configured");
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${this.key}` },
    });
    if (!res.ok) throw new Error(`Paystack verify failed: ${await res.text()}`);
    const data = await res.json();
    const status = data.data.status === "success" ? "success" : data.data.status === "failed" ? "failed" : "pending";
    return { status, amount: data.data.amount / 100 };
  }
}

/** Placeholder adapters — implement the same interface once API credentials are available. */
class UnconfiguredProvider implements PaymentProvider {
  constructor(public name: string) {}
  async initialize(): Promise<PaymentInitResult> {
    throw new Error(`${this.name} is not configured yet`);
  }
  async verify(): Promise<PaymentVerifyResult> {
    throw new Error(`${this.name} is not configured yet`);
  }
}

export function getPaymentProvider(
  method: "PAYSTACK" | "MONNIFY" | "KORAPAY" | "PAYVESSEL" | "FLUTTERWAVE"
): PaymentProvider {
  switch (method) {
    case "PAYSTACK":
      return new PaystackProvider();
    case "MONNIFY":
      return new UnconfiguredProvider("Monnify");
    case "KORAPAY":
      return new UnconfiguredProvider("Korapay");
    case "PAYVESSEL":
      return new UnconfiguredProvider("PayVessel");
    case "FLUTTERWAVE":
      return new UnconfiguredProvider("Flutterwave");
  }
}
