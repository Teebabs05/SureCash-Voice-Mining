import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { debitWallet } from "@/lib/server/wallet";
import { generateReference } from "@/lib/utils";
import { WITHDRAWAL_CONFIG, TIER_CONFIG } from "@/lib/config";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";
import { attemptAutomaticPayout } from "@/lib/server/withdrawal-payout";

const schema = z.object({ amount: z.number().positive(), bankAccountId: z.string().min(1) });

export async function GET() {
  try {
    const user = await requireUser();
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { bankAccount: true },
    });
    return NextResponse.json({ withdrawals });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.emailVerified) {
      return jsonError("Please verify your email before withdrawing", 403);
    }

    const { amount, bankAccountId } = schema.parse(await req.json());
    const { ipAddress, userAgent } = getRequestMeta(req);

    if (amount < WITHDRAWAL_CONFIG.minAmount) {
      return jsonError(`Minimum withdrawal is ${WITHDRAWAL_CONFIG.minAmount}`, 422);
    }

    const bankAccount = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!bankAccount || bankAccount.userId !== user.id) {
      return jsonError("Bank account not found", 404);
    }
    if (!bankAccount.isVerified) {
      return jsonError("Please confirm this bank account with the OTP sent to you before withdrawing", 403);
    }

    const feePercent = TIER_CONFIG[user.tier].withdrawalFeePercent;
    const fee = Number((amount * (feePercent / 100)).toFixed(2));
    const totalDebit = amount + fee;
    const reference = generateReference("WTH");

    const withdrawal = await prisma.$transaction(async (tx) => {
      await debitWallet({
        userId: user.id,
        type: "MAIN",
        amount: totalDebit,
        reason: "WITHDRAWAL",
        description: `Withdrawal request ${reference}`,
        reference,
        client: tx,
      });

      return tx.withdrawal.create({
        data: {
          userId: user.id,
          bankAccountId,
          amount,
          fee,
          reference,
          status: "PENDING",
        },
      });
    });

    await notifyUser({
      userId: user.id,
      title: "Withdrawal requested",
      body: `Your withdrawal of ${amount} is being processed.`,
      type: "WALLET",
    });
    await writeAuditLog({ userId: user.id, action: "withdrawal.request", ipAddress, userAgent, metadata: { reference, amount } });

    // Best-effort instant payout — never blocks or fails the request itself;
    // on any error the withdrawal just stays PENDING for manual admin review.
    const updated = await attemptAutomaticPayout(withdrawal.id)
      .then(() => prisma.withdrawal.findUnique({ where: { id: withdrawal.id } }))
      .catch(() => null);

    return NextResponse.json({ withdrawal: updated ?? withdrawal });
  } catch (error) {
    return handleApiError(error);
  }
}
