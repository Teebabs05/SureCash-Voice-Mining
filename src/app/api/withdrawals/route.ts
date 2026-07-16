import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { debitWallet } from "@/lib/server/wallet";
import { generateReference } from "@/lib/utils";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";
import { attemptAutomaticPayout } from "@/lib/server/withdrawal-payout";
import {
  getWithdrawalMinAmount,
  getEffectiveFeePercent,
  getUsdtNetworkFee,
  getUsdtNgnRate,
} from "@/lib/server/withdrawal-fee";

const schema = z.object({
  amount: z.number().positive(),
  method: z.enum(["BANK", "USDT"]).default("BANK"),
  bankAccountId: z.string().min(1).optional(),
  cryptoWalletId: z.string().min(1).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { bankAccount: true, cryptoWallet: true },
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

    const body = schema.parse(await req.json());
    const { ipAddress, userAgent } = getRequestMeta(req);

    const minAmount = await getWithdrawalMinAmount();
    if (body.amount < minAmount) {
      return jsonError(`Minimum withdrawal is ${minAmount}`, 422);
    }

    const feePercent = await getEffectiveFeePercent(user.tier);
    const reference = generateReference("WTH");

    let withdrawal;

    if (body.method === "BANK") {
      if (!body.bankAccountId) return jsonError("Select a bank account", 422);

      const bankAccount = await prisma.bankAccount.findUnique({ where: { id: body.bankAccountId } });
      if (!bankAccount || bankAccount.userId !== user.id) {
        return jsonError("Bank account not found", 404);
      }
      if (!bankAccount.isVerified) {
        return jsonError("Please confirm this bank account with the OTP sent to you before withdrawing", 403);
      }

      const fee = Number((body.amount * (feePercent / 100)).toFixed(2));
      const totalDebit = body.amount + fee;

      withdrawal = await prisma.$transaction(async (tx) => {
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
            method: "BANK",
            bankAccountId: body.bankAccountId,
            amount: body.amount,
            fee,
            reference,
            status: "PENDING",
          },
        });
      });
    } else {
      if (!body.cryptoWalletId) return jsonError("Select a USDT wallet", 422);

      const cryptoWallet = await prisma.cryptoWallet.findUnique({ where: { id: body.cryptoWalletId } });
      if (!cryptoWallet || cryptoWallet.userId !== user.id) {
        return jsonError("USDT wallet not found", 404);
      }
      if (!cryptoWallet.isVerified) {
        return jsonError("Please confirm this wallet with the OTP sent to you before withdrawing", 403);
      }

      const [networkFee, ngnRate] = await Promise.all([getUsdtNetworkFee(), getUsdtNgnRate()]);
      const percentFee = Number((body.amount * (feePercent / 100)).toFixed(2));
      const fee = Number((percentFee + networkFee).toFixed(2));
      const totalDebit = body.amount + fee;
      const usdtAmount = Number((body.amount / ngnRate).toFixed(2));

      withdrawal = await prisma.$transaction(async (tx) => {
        await debitWallet({
          userId: user.id,
          type: "MAIN",
          amount: totalDebit,
          reason: "WITHDRAWAL",
          description: `USDT withdrawal request ${reference}`,
          reference,
          client: tx,
        });

        return tx.withdrawal.create({
          data: {
            userId: user.id,
            method: "USDT",
            cryptoWalletId: body.cryptoWalletId,
            amount: body.amount,
            usdtAmount,
            fee,
            reference,
            status: "PENDING",
          },
        });
      });
    }

    await notifyUser({
      userId: user.id,
      title: "Withdrawal requested",
      body: `Your withdrawal of ${body.amount} is being processed.`,
      type: "WALLET",
    });
    await writeAuditLog({
      userId: user.id,
      action: "withdrawal.request",
      ipAddress,
      userAgent,
      metadata: { reference, amount: body.amount, method: body.method },
    });

    // Best-effort instant payout — bank withdrawals only (no crypto
    // disbursement gateway is wired up). Never blocks or fails the request
    // itself; on any error the withdrawal just stays PENDING for manual
    // admin review.
    const updated =
      body.method === "BANK"
        ? await attemptAutomaticPayout(withdrawal.id)
            .then(() => prisma.withdrawal.findUnique({ where: { id: withdrawal.id } }))
            .catch(() => null)
        : null;

    return NextResponse.json({ withdrawal: updated ?? withdrawal });
  } catch (error) {
    return handleApiError(error);
  }
}
