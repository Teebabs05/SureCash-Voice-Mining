import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { debugListBanks } from "@/lib/payments/bank-verification";

export async function POST() {
  try {
    await requireAdmin();
    const result = await debugListBanks();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
