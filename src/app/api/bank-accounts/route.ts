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

    // Automatic verification is the whole point of this flow — if a real
    // provider is configured, refuse to save an account it couldn't
    // resolve to a name (matches "cannot save an invalid account number").
    if (resolved.configured && !resolved.verified) {
      return jsonError("Could not verify this account number for the selected bank. Please double-check the details.", 422);
    }

    const account = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        bankName: bank.name,
        bankCode: body.bankCode,
        accountNumber: body.accountNumber,
        accountName: resolved.configured ? resolved.accountName : "Unverified — pending manual review",
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
