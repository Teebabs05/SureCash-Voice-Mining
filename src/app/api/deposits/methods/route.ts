import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { getSetting } from "@/lib/server/settings";

const GATEWAY_PROVIDERS = ["PAYSTACK", "MONNIFY", "KORAPAY", "FLUTTERWAVE"] as const;

export async function GET() {
  try {
    await requireUser();

    const [
      gatewayEnabled,
      virtualAccountEnabled,
      manualEnabled,
      bankName,
      accountNumber,
      accountName,
      gatewayFlags,
    ] = await Promise.all([
      getSetting("deposit_gateway_enabled", true),
      getSetting("deposit_virtual_account_enabled", true),
      getSetting("deposit_manual_enabled", true),
      getSetting("manual_deposit_bank_name", ""),
      getSetting("manual_deposit_account_number", ""),
      getSetting("manual_deposit_account_name", ""),
      Promise.all(
        GATEWAY_PROVIDERS.map((p) => getSetting(`deposit_gateway_${p.toLowerCase()}_enabled`, true))
      ),
    ]);

    const gateways = Object.fromEntries(GATEWAY_PROVIDERS.map((p, i) => [p, gatewayFlags[i]]));
    const manualConfigured = Boolean(bankName && accountNumber && accountName);

    return NextResponse.json({
      gatewayEnabled: gatewayEnabled && Object.values(gateways).some(Boolean),
      gateways,
      virtualAccountEnabled,
      manual: {
        enabled: manualEnabled && manualConfigured,
        bankName,
        accountNumber,
        accountName,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
