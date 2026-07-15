import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/current-user";
import { getBankList } from "@/lib/payments/bank-verification";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    await requireUser();
    const banks = await getBankList();
    return NextResponse.json({ banks });
  } catch (error) {
    return handleApiError(error);
  }
}
