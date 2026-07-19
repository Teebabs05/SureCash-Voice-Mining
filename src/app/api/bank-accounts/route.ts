import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { resolveBankAccount, getBankList } from "@/lib/payments/bank-verification";
import { generateOtpCode, hashToken } from "@/lib/server/auth";
import { sendEmail, otpEmailHtml } from "@/lib/notifications/email";

const schema = z.object({
  bankCode: z.string().min(2),
  accountNumber: z.string().regex(/^[0-9]{10}$/, "Account number must be 10 digits"),
  // Only used as a fallback when the account couldn't be auto-verified -
  // the account holder's self-reported name, pending admin review.
  accountName: z.string().trim().min(1).max(191).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const accounts = await prisma.bankAccount.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ accounts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const existing = await prisma.bankAccount.findUnique({
      where: { userId_accountNumber_bankCode: { userId: user.id, accountNumber: body.accountNumber, bankCode: body.bankCode } },
    });
    if (existing) return jsonError("This bank account is already linked", 409);

    const banks = await getBankList();
    const bank = banks.find((b) => b.code === body.bankCode);
    if (!bank) return jsonError("Unknown bank selected", 422);

    const resolved = await resolveBankAccount({ bankCode: body.bankCode, accountNumber: body.accountNumber });

    // Whether nothing's configured, or a configured gateway just can't
    // resolve this particular bank (common for newer fintech/MFB banks),
    // fall back to the account holder's self-reported name and route it
    // through manual admin review rather than blocking them outright.
    if (!resolved.verified && !body.accountName) {
      return jsonError("We couldn't automatically verify this account. Please enter the account holder's name.", 422);
    }

    const account = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        bankName: bank.name,
        bankCode: body.bankCode,
        accountNumber: body.accountNumber,
        accountName: resolved.verified ? resolved.accountName : body.accountName!,
        autoVerified: resolved.verified,
        isVerified: false,
      },
    });

    // OTP confirms the account owner authorized adding this payout destination.
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
      subject: "Confirm your new bank account",
      html: otpEmailHtml("confirm your new bank account", code),
    });

    return NextResponse.json({ account, requiresOtp: true });
  } catch (error) {
    return handleApiError(error);
  }
}
