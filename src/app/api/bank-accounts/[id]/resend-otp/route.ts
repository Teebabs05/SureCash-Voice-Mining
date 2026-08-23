import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { generateOtpCode, hashToken } from "@/lib/server/auth";
import { sendEmail, otpEmailHtml } from "@/lib/notifications/email";
import { rateLimit } from "@/lib/server/rate-limit";

// Lets a user re-request the ownership OTP for a bank account that's still
// unverified - covers accounts that missed the original email (migrated
// users never got one at all) as well as an expired/lost code.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const account = await prisma.bankAccount.findUnique({ where: { id } });
    if (!account || account.userId !== user.id) return jsonError("Bank account not found", 404);
    if (account.isVerified) return jsonError("This account is already confirmed", 409);

    const limited = await rateLimit(`bank-otp:${user.id}`, 3, 15 * 60 * 1000);
    if (!limited.success) {
      return jsonError("Please wait before requesting another code", 429);
    }

    const code = generateOtpCode();
    const codeHash = await hashToken(code);
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        purpose: "BANK_ACCOUNT_CHANGE",
        codeHash,
        metadata: { bankAccountId: account.id },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendEmail({
      to: user.email,
      subject: "Confirm your bank account",
      html: otpEmailHtml("confirm your bank account", code),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
