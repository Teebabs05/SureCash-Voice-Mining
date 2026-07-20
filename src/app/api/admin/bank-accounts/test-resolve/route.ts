import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { debugResolveBankAccount } from "@/lib/payments/bank-verification";

const schema = z.object({
  bankCode: z.string().min(1),
  accountNumber: z.string().regex(/^[0-9]{10}$/, "Account number must be 10 digits"),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { bankCode, accountNumber } = schema.parse(await req.json());
    const result = await debugResolveBankAccount({ bankCode, accountNumber });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
