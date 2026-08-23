import "server-only";
import { getCredential } from "@/lib/server/credentials";
import type {
  VtuProviderAdapter,
  VtuPurchaseResult,
  VtuPurchaseStatus,
  VtuVariation,
  VtuCustomerInfo,
  AirtimeToCashProvider,
  AirtimeToCashAvailability,
  AirtimeToCashResult,
} from "@/lib/payments/vtu-provider";

/**
 * VTUAfrica API client — confirmed against VTUAfrica's own published docs
 * (vtuafrica.com.ng/api/), not training-knowledge guesswork.
 *
 * Auth is a simple `apikey` query param on plain GET requests (unlike
 * VTU.ng's JWT+POST style) - {"code":101,"description":{...}} on success.
 * No documented failure-response shape was found, so any non-101 code,
 * missing `description`, or non-2xx HTTP status is treated as a failure
 * with whatever message is available.
 *
 * Known gaps versus VTU.ng, left honest rather than guessed at:
 *   - No live data-plan / cable-bouquet pricing endpoint - VTUAfrica only
 *     publishes those as static reference tables that vary by account
 *     tier, so listDataVariations/listCableVariations return empty rather
 *     than risk charging a wrong price from a scraped table. Data and
 *     Cable TV purchases will show "no plans available" here until
 *     VTUAfrica's real pricing for this account is confirmed.
 *   - No pre-purchase meter/smartcard verification endpoint (unlike
 *     VTU.ng's /verify-customer) - verifyElectricityCustomer/
 *     verifyCableCustomer return a warning instead of a real customer
 *     name, so the purchase pages still work but can't catch a typo'd
 *     number the way VTU.ng can.
 *   - No confirmed transaction-status/requery endpoint - requeryOrder
 *     throws rather than silently returning null, so "check status"
 *     surfaces the real limitation rather than looking like a no-op.
 */

const BASE_URL = "https://vtuafrica.com.ng/portal/api";

async function request(
  path: string,
  params: Record<string, string | number>
): Promise<{ ok: boolean; description: Record<string, unknown> | null; raw: unknown }> {
  const key = await getCredential("VTUAFRICA_API_KEY");
  if (!key) throw new Error("VTUAfrica is not configured");

  const query = new URLSearchParams({ apikey: key });
  for (const [k, v] of Object.entries(params)) query.set(k, String(v));

  const res = await fetch(`${BASE_URL}/${path}/?${query.toString()}`);
  const data = await res.json().catch(() => null);
  const description = (data as { description?: Record<string, unknown> } | null)?.description ?? null;
  const ok = res.ok && Number((data as { code?: unknown } | null)?.code) === 101 && description != null;
  return { ok, description: ok ? description : null, raw: data };
}

function extractMessage(raw: unknown): string {
  const r = raw as { description?: { message?: string }; message?: string } | null;
  return r?.description?.message ?? r?.message ?? "VTUAfrica request failed";
}

function mapStatus(raw: unknown): VtuPurchaseStatus {
  const s = String(raw ?? "").toLowerCase();
  if (s === "completed") return "completed";
  if (s === "processing") return "processing";
  return "failed";
}

export class VtuAfricaProvider implements VtuProviderAdapter, AirtimeToCashProvider {
  name = "VTUAFRICA" as const;

  async buyAirtime(params: { reference: string; phone: string; network: string; amount: number }): Promise<VtuPurchaseResult> {
    const { ok, description, raw } = await request("airtime", {
      network: params.network,
      phone: params.phone,
      amount: params.amount,
      ref: params.reference,
    });
    if (!ok || !description) return { status: "failed", message: extractMessage(raw), raw };
    return {
      status: mapStatus(description.Status),
      amountCharged: description.Amount_Charged != null ? Number(description.Amount_Charged) : undefined,
      message: typeof description.message === "string" ? description.message : undefined,
      raw,
    };
  }

  async listDataVariations(): Promise<VtuVariation[]> {
    return [];
  }

  async buyData(params: { reference: string; phone: string; network: string; variationId: string }): Promise<VtuPurchaseResult> {
    const { ok, description, raw } = await request("data", {
      service: params.network,
      MobileNumber: params.phone,
      DataPlan: params.variationId,
      ref: params.reference,
    });
    if (!ok || !description) return { status: "failed", message: extractMessage(raw), raw };
    return {
      status: mapStatus(description.Status),
      amountCharged: description.Amount_Charged != null ? Number(description.Amount_Charged) : undefined,
      message: typeof description.message === "string" ? description.message : undefined,
      raw,
    };
  }

  async verifyElectricityCustomer(): Promise<VtuCustomerInfo> {
    return { name: "Not verified — VTUAfrica has no meter verification. Double-check the meter number before continuing." };
  }

  async buyElectricity(params: {
    reference: string;
    meterNumber: string;
    disco: string;
    meterType: "prepaid" | "postpaid";
    amount: number;
  }): Promise<VtuPurchaseResult> {
    const { ok, description, raw } = await request("electric", {
      service: params.disco,
      meterNo: params.meterNumber,
      metertype: params.meterType,
      amount: params.amount,
      ref: params.reference,
    });
    if (!ok || !description) return { status: "failed", message: extractMessage(raw), raw };
    return {
      status: mapStatus(description.Status),
      amountCharged: description.Amount_Charged != null ? Number(description.Amount_Charged) : undefined,
      token: typeof description.Token === "string" ? description.Token : undefined,
      units: description.Unit != null ? String(description.Unit) : undefined,
      message: typeof description.message === "string" ? description.message : undefined,
      raw,
    };
  }

  async listCableVariations(): Promise<VtuVariation[]> {
    return [];
  }

  async verifyCableCustomer(): Promise<VtuCustomerInfo> {
    return { name: "Not verified — VTUAfrica has no smartcard verification. Double-check the smartcard/IUC number before continuing." };
  }

  async buyCableTv(params: { reference: string; smartcardNumber: string; provider: string; variationId: string }): Promise<VtuPurchaseResult> {
    const { ok, description, raw } = await request("paytv", {
      service: params.provider,
      smartNo: params.smartcardNumber,
      variation: params.variationId,
      ref: params.reference,
    });
    if (!ok || !description) return { status: "failed", message: extractMessage(raw), raw };
    return {
      status: mapStatus(description.Status),
      amountCharged: description.Amount_Charged != null ? Number(description.Amount_Charged) : undefined,
      message: typeof description.message === "string" ? description.message : undefined,
      raw,
    };
  }

  /**
   * airtime-pin / betpay: found via VTUAfrica's published developer pages
   * (api/airtime-pins.php, api/betting.php), not the more authoritative
   * primary API doc that airtime/data/electricity above were confirmed
   * against — network access to vtu.ng and vtuafrica.com.ng itself was
   * blocked in the environment that wrote this, so these two were
   * cross-checked against public documentation excerpts instead. Treat the
   * exact param names as best-effort: a wrong one fails cleanly (the
   * purchaseBill flow refunds MAIN on any non-completed result) rather
   * than losing funds, but confirm against the live VTUAfrica dashboard
   * docs before relying on this in production.
   */
  async buyEpins(params: { reference: string; network: string; value: number; quantity: number }): Promise<VtuPurchaseResult> {
    const { ok, description, raw } = await request("airtime-pin", {
      network: params.network,
      amount: params.value,
      quantity: params.quantity,
      ref: params.reference,
    });
    if (!ok || !description) return { status: "failed", message: extractMessage(raw), raw };
    return {
      status: mapStatus(description.Status),
      amountCharged: description.Amount_Charged != null ? Number(description.Amount_Charged) : undefined,
      pins: Array.isArray(description.pins) ? description.pins.map(String) : undefined,
      message: typeof description.message === "string" ? description.message : undefined,
      raw,
    };
  }

  async verifyBettingCustomer(): Promise<VtuCustomerInfo> {
    return { name: "Not verified — VTUAfrica has no confirmed betting-account verification endpoint. Double-check the user ID before continuing." };
  }

  async fundBetting(params: { reference: string; customerId: string; provider: string; amount: number }): Promise<VtuPurchaseResult> {
    const { ok, description, raw } = await request("betpay", {
      service: params.provider,
      userid: params.customerId,
      amount: params.amount,
      ref: params.reference,
    });
    if (!ok || !description) return { status: "failed", message: extractMessage(raw), raw };
    return {
      status: mapStatus(description.Status),
      amountCharged:
        description.Amount_Charged != null
          ? Number(description.Amount_Charged)
          : description.Charge != null
            ? Number(description.Charge)
            : undefined,
      message: typeof description.message === "string" ? description.message : undefined,
      raw,
    };
  }

  async requeryOrder(): Promise<VtuPurchaseResult | null> {
    throw new Error("VTUAfrica doesn't have a confirmed transaction-status endpoint yet — check their dashboard directly");
  }

  async checkAvailability(network: string): Promise<AirtimeToCashAvailability> {
    const { ok, description, raw } = await request("merchant-verify", { serviceName: "Airtime2Cash", network });
    if (!ok || !description) return { available: false, message: extractMessage(raw) };
    const status = String(description.Status ?? "").toLowerCase();
    return {
      available: status === "completed",
      sitePhone: typeof description.Phone_Number === "string" ? description.Phone_Number : undefined,
      message: typeof description.message === "string" ? description.message : undefined,
    };
  }

  async convert(params: {
    reference: string;
    network: string;
    senderEmail: string;
    senderPhone: string;
    amount: number;
    sitePhone: string;
  }): Promise<AirtimeToCashResult> {
    const { ok, description, raw } = await request("airtime-cash", {
      network: params.network,
      sender: params.senderEmail,
      sendernumber: params.senderPhone,
      amount: params.amount,
      sitephone: params.sitePhone,
      ref: params.reference,
      webhookURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/vtuafrica`,
    });
    if (!ok || !description) return { status: "failed", message: extractMessage(raw), raw };
    const status = String(description.Status ?? "").toLowerCase();
    return {
      status: status === "completed" ? "completed" : status === "processing" ? "processing" : "failed",
      message: typeof description.message === "string" ? description.message : undefined,
      raw,
    };
  }
}

export async function isVtuAfricaConfigured(): Promise<boolean> {
  return Boolean(await getCredential("VTUAFRICA_API_KEY"));
}
