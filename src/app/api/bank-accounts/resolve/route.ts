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

    // Whether nothing's configured, or a configured gateway just doesn't
    // support name lookups for this particular bank (common for newer
    // fintech/MFB banks), the outcome is the same: fall back to letting the
    // user proceed with a self-reported name for manual admin review,
    // instead of hard-blocking them from adding a legitimate account.
    return NextResponse.json({
      configured: resolved.configured,
      verified: resolved.verified,
      accountName: resolved.verified ? resolved.accountName : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
