import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { resolveBankAccount } from "@/lib/payments/bank-verification";
import { generateOtpCode, hashToken } from "@/lib/server/auth";
import { sendOtpCode } from "@/lib/notifications/otp";
import { sendEmail } from "@/lib/notifications/email";

const schema = z.object({
  bankName: z.string().min(2),
  bankCode: z.string().min(2),
  accountNumber: z.string().min(6).max(20),
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

    const resolved = await resolveBankAccount({ bankCode: body.bankCode, accountNumber: body.accountNumber });

    const account = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        bankName: body.bankName,
        bankCode: body.bankCode,
        accountNumber: body.accountNumber,
        accountName: resolved.accountName,
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

    if (user.phone) {
      await sendOtpCode(user.phone, code);
    } else {
      await sendEmail({ to: user.email, subject: "Confirm your new bank account", html: `<p>Your OTP is <b>${code}</b>. It expires in 10 minutes.</p>` });
    }

    return NextResponse.json({ account, requiresOtp: true });
  } catch (error) {
    return handleApiError(error);
  }
}
