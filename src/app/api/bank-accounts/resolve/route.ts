import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/current-user";
import { resolveBankAccount } from "@/lib/payments/bank-verification";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { rateLimit } from "@/lib/server/rate-limit";

const schema = z.object({
  bankCode: z.string().min(2),
  accountNumber: z.string().regex(/^[0-9]{10}$/, "Account number must be 10 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const limited = await rateLimit(`resolve-bank:${user.id}`, 20, 5 * 60 * 1000);
    if (!limited.success) {
      return jsonError("Too many lookups. Please wait a moment and try again.", 429);
    }

    const { bankCode, accountNumber } = schema.parse(await req.json());
    const resolved = await resolveBankAccount({ bankCode, accountNumber });

    if (!resolved.configured) {
      // No verification provider configured — the UI falls back to letting
      // the user proceed to manual admin review instead of instant verification.
      return NextResponse.json({ configured: false, verified: false, accountName: null });
    }

    if (!resolved.verified) {
      return jsonError("Could not verify this account number for the selected bank. Please double-check the details.", 422);
    }

    return NextResponse.json({ configured: true, verified: true, accountName: resolved.accountName });
  } catch (error) {
    return handleApiError(error);
  }
}
