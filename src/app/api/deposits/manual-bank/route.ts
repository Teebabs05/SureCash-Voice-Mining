import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { getSetting } from "@/lib/server/settings";

export async function GET() {
  try {
    await requireUser();

    const [bankName, accountNumber, accountName] = await Promise.all([
      getSetting("manual_deposit_bank_name", ""),
      getSetting("manual_deposit_account_number", ""),
      getSetting("manual_deposit_account_name", ""),
    ]);

    const configured = Boolean(bankName && accountNumber && accountName);
    return NextResponse.json({ configured, bankName, accountNumber, accountName });
  } catch (error) {
    return handleApiError(error);
  }
}
