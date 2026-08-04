import "server-only";
import { getSetting } from "@/lib/server/settings";

export type VtuProviderName = "VTU_NG" | "VTUAFRICA";

export interface VtuVariation {
  variationId: string;
  serviceId: string;
  serviceName: string;
  label: string;
  price: number;
  available: boolean;
}

export interface VtuCustomerInfo {
  name: string;
  address?: string;
  currentBouquet?: string;
  renewalAmount?: number;
  dueDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export type VtuPurchaseStatus = "processing" | "completed" | "refunded" | "failed";

export interface VtuPurchaseResult {
  status: VtuPurchaseStatus;
  providerOrderId?: string;
  amountCharged?: number;
  token?: string;
  units?: string;
  message?: string;
  raw?: unknown;
}

/**
 * Common surface every VTU provider adapter implements, so the purchase
 * routes and the admin "default provider" switch don't care which one is
 * active — same pattern as PayoutProviderAdapter in payout-provider.ts.
 * VTU.ng is the only implementation so far; VTUAfrica (and Airtime-to-Cash,
 * which VTU.ng doesn't offer) is planned as a second adapter.
 */
export interface VtuProviderAdapter {
  name: VtuProviderName;
  buyAirtime(params: { reference: string; phone: string; network: string; amount: number }): Promise<VtuPurchaseResult>;
  listDataVariations(network?: string): Promise<VtuVariation[]>;
  buyData(params: { reference: string; phone: string; network: string; variationId: string }): Promise<VtuPurchaseResult>;
  verifyElectricityCustomer(params: {
    meterNumber: string;
    disco: string;
    meterType: "prepaid" | "postpaid";
  }): Promise<VtuCustomerInfo>;
  buyElectricity(params: {
    reference: string;
    meterNumber: string;
    disco: string;
    meterType: "prepaid" | "postpaid";
    amount: number;
  }): Promise<VtuPurchaseResult>;
  listCableVariations(provider?: string): Promise<VtuVariation[]>;
  verifyCableCustomer(params: { smartcardNumber: string; provider: string }): Promise<VtuCustomerInfo>;
  buyCableTv(params: {
    reference: string;
    smartcardNumber: string;
    provider: string;
    variationId: string;
  }): Promise<VtuPurchaseResult>;
  /** Returns null if the provider has no record of this order at all. */
  requeryOrder(reference: string): Promise<VtuPurchaseResult | null>;
}

export async function getDefaultVtuProvider(): Promise<VtuProviderName> {
  const configured = await getSetting("default_vtu_provider", "VTU_NG");
  return configured === "VTUAFRICA" ? "VTUAFRICA" : "VTU_NG";
}

export async function getVtuProvider(provider: VtuProviderName): Promise<VtuProviderAdapter> {
  if (provider === "VTU_NG") {
    const { VtuNgProvider } = await import("@/lib/payments/vtu-ng");
    return new VtuNgProvider();
  }
  throw new Error("VTUAfrica isn't wired up yet");
}
