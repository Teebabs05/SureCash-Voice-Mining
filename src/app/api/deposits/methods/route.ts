import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { getSetting } from "@/lib/server/settings";

export async function GET() {
  try {
    await requireUser();

    const [gatewayEnabled, virtualAccountEnabled, manualEnabled, bankName, accountNumber, accountName] = await Promise.all([
      getSetting("deposit_gateway_enabled", true),
      getSetting("deposit_virtual_account_enabled", true),
      getSetting("deposit_manual_enabled", true),
      getSetting("manual_deposit_bank_name", ""),
      getSetting("manual_deposit_account_number", ""),
      getSetting("manual_deposit_account_name", ""),
    ]);

    const manualConfigured = Boolean(bankName && accountNumber && accountName);

    return NextResponse.json({
      gatewayEnabled,
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
