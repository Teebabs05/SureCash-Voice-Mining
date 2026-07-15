import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { compareToken } from "@/lib/server/auth";

const schema = z.object({ bankAccountId: z.string().min(1), code: z.string().min(4) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { bankAccountId, code } = schema.parse(await req.json());

    const otp = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        purpose: "BANK_ACCOUNT_CHANGE",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp || (otp.metadata as { bankAccountId?: string } | null)?.bankAccountId !== bankAccountId) {
      return jsonError("OTP not found or expired", 400);
    }

    if (otp.attempts >= 5) {
      return jsonError("Too many attempts. Please request a new OTP.", 429);
    }

    const valid = await compareToken(code, otp.codeHash);
    if (!valid) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      return jsonError("Invalid OTP code", 400);
    }

    await prisma.$transaction([
      prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
      prisma.bankAccount.update({ where: { id: bankAccountId }, data: { isVerified: true } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
