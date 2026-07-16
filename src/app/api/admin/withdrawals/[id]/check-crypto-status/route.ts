import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { getWithdrawStatus } from "@/lib/payments/binance";
import { notifyUser } from "@/lib/server/notifications";
import { checkAchievements } from "@/lib/server/gamification";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

/**
 * Binance doesn't push a webhook when a withdrawal completes, so this is
 * the confirmation path for USDT payouts sent via BINANCE — an admin (or
 * an automated poller hitting this same endpoint) checks Binance's withdraw
 * history and the app updates its own status to match.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { ipAddress, userAgent } = getRequestMeta(req);

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) return jsonError("Withdrawal not found", 404);
    if (withdrawal.payoutProvider !== "BINANCE" || !withdrawal.payoutReference) {
      return jsonError("This withdrawal isn't a pending Binance payout", 409);
    }
    if (withdrawal.status !== "PROCESSING") {
      return jsonError("This withdrawal isn't currently processing", 409);
    }

    const result = await getWithdrawStatus(withdrawal.reference);
    if (!result) {
      return NextResponse.json({ withdrawal, note: "No update from Binance yet" });
    }

    if (result.status === "completed") {
      await prisma.$transaction(async (tx) => {
        await tx.withdrawal.update({ where: { id }, data: { status: "PAID", processedAt: new Date() } });
        await notifyUser({
          userId: withdrawal.userId,
          title: "USDT withdrawal paid",
          body: `Your withdrawal of ${withdrawal.usdtAmount ?? ""} USDT has been sent to your wallet.`,
          type: "WALLET",
          client: tx,
        });
        await checkAchievements(withdrawal.userId, "WITHDRAWAL_PAID", tx);
      });
      await writeAuditLog({ userId: admin.id, action: "admin.withdrawal_crypto_status_paid", ipAddress, userAgent, metadata: { withdrawalId: id, txId: result.txId } });
    } else if (result.status === "failed") {
      await prisma.withdrawal.update({
        where: { id },
        data: { status: "PENDING", autoPayoutError: "Binance reported the withdrawal as failed/rejected" },
      });
      await notifyUser({
        userId: withdrawal.userId,
        title: "Withdrawal delayed",
        body: "Your withdrawal couldn't be completed automatically and is now under manual review.",
        type: "WALLET",
      });
      await writeAuditLog({ userId: admin.id, action: "admin.withdrawal_crypto_status_failed", ipAddress, userAgent, metadata: { withdrawalId: id } });
    }

    const updated = await prisma.withdrawal.findUnique({ where: { id } });
    return NextResponse.json({ withdrawal: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
