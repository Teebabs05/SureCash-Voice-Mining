import { initializeTransaction, verifyTransaction } from "@/lib/payments/monnify";
import { initializeCharge, verifyCharge } from "@/lib/payments/korapay";
import { initializePayment, verifyPayment } from "@/lib/payments/flutterwave";
import { getCredential } from "@/lib/server/credentials";

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
  initialize(params: { amount: number; email: string; reference: string; name?: string }): Promise<PaymentInitResult>;
  verify(reference: string): Promise<PaymentVerifyResult>;
}

class PaystackProvider implements PaymentProvider {
  name = "PAYSTACK";

  async initialize(params: { amount: number; email: string; reference: string; name?: string }): Promise<PaymentInitResult> {
    const key = await getCredential("PAYSTACK_SECRET_KEY");
    if (!key) throw new Error("Paystack is not configured");

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: params.email,
        amount: Math.round(params.amount * 100),
        reference: params.reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?deposit=${params.reference}`,
      }),
    });

    if (!res.ok) throw new Error(`Paystack init failed: ${await res.text()}`);
    const data = await res.json();
    return { authorizationUrl: data.data.authorization_url, reference: data.data.reference };
  }

  async verify(reference: string): Promise<PaymentVerifyResult> {
    const key = await getCredential("PAYSTACK_SECRET_KEY");
    if (!key) throw new Error("Paystack is not configured");
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`Paystack verify failed: ${await res.text()}`);
    const data = await res.json();
    const status = data.data.status === "success" ? "success" : data.data.status === "failed" ? "failed" : "pending";
    return { status, amount: data.data.amount / 100 };
  }
}

class MonnifyProvider implements PaymentProvider {
  name = "MONNIFY";

  async initialize(params: { amount: number; email: string; reference: string; name?: string }): Promise<PaymentInitResult> {
    const result = await initializeTransaction({
      amount: params.amount,
      email: params.email,
      name: params.name || params.email,
      reference: params.reference,
    });
    return { authorizationUrl: result.checkoutUrl, reference: params.reference };
  }

  async verify(reference: string): Promise<PaymentVerifyResult> {
    return verifyTransaction(reference);
  }
}

class KorapayProvider implements PaymentProvider {
  name = "KORAPAY";

  async initialize(params: { amount: number; email: string; reference: string; name?: string }): Promise<PaymentInitResult> {
    const result = await initializeCharge({
      amount: params.amount,
      email: params.email,
      name: params.name || params.email,
      reference: params.reference,
    });
    return { authorizationUrl: result.checkoutUrl, reference: result.reference };
  }

  async verify(reference: string): Promise<PaymentVerifyResult> {
    return verifyCharge(reference);
  }
}

class FlutterwaveProvider implements PaymentProvider {
  name = "FLUTTERWAVE";

  async initialize(params: { amount: number; email: string; reference: string; name?: string }): Promise<PaymentInitResult> {
    const result = await initializePayment({
      amount: params.amount,
      email: params.email,
      name: params.name || params.email,
      reference: params.reference,
    });
    return { authorizationUrl: result.paymentLink, reference: result.reference };
  }

  async verify(reference: string): Promise<PaymentVerifyResult> {
    return verifyPayment(reference);
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
      return new MonnifyProvider();
    case "KORAPAY":
      return new KorapayProvider();
    case "PAYVESSEL":
      return new UnconfiguredProvider("PayVessel");
    case "FLUTTERWAVE":
      return new FlutterwaveProvider();
  }
}
