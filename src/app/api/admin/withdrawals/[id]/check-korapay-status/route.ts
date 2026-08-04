import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { getTransferStatus } from "@/lib/payments/korapay";
import { notifyUser } from "@/lib/server/notifications";
import { checkAchievements } from "@/lib/server/gamification";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

/**
 * Manual reconciliation fallback for a single (non-bulk) Korapay transfer —
 * same role as the Binance "check status" action, for when the
 * transfer.success/transfer.failed webhook doesn't arrive or doesn't
 * validate and the withdrawal is stuck in PROCESSING despite Korapay having
 * already resolved it on their end.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { ipAddress, userAgent } = getRequestMeta(req);

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) return jsonError("Withdrawal not found", 404);
    if (withdrawal.payoutProvider !== "KORAPAY") {
      return jsonError("This withdrawal isn't a Korapay payout", 409);
    }
    if (withdrawal.status !== "PROCESSING") {
      return jsonError("This withdrawal isn't currently processing", 409);
    }

    const result = await getTransferStatus(withdrawal.reference);
    if (!result) {
      return NextResponse.json({ withdrawal, note: "No update from Korapay yet" });
    }

    if (result.status === "success") {
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.withdrawal.updateMany({
          where: { id, status: { not: "PAID" } },
          data: { status: "PAID", processedAt: new Date() },
        });
        if (claimed.count === 0) return;
        await notifyUser({
          userId: withdrawal.userId,
          title: "Withdrawal paid",
          body: `Your withdrawal of ${withdrawal.amount} has been sent to your bank account.`,
          type: "WALLET",
          client: tx,
        });
        await checkAchievements(withdrawal.userId, "WITHDRAWAL_PAID", tx);
      });
      await writeAuditLog({ userId: admin.id, action: "admin.withdrawal_korapay_status_paid", ipAddress, userAgent, metadata: { withdrawalId: id } });
    } else if (result.status === "failed") {
      await prisma.withdrawal.update({
        where: { id },
        data: { status: "PENDING", autoPayoutError: result.message ?? "Korapay reported this transfer as failed" },
      });
      await notifyUser({
        userId: withdrawal.userId,
        title: "Withdrawal delayed",
        body: "Your withdrawal couldn't be completed automatically and is now under manual review.",
        type: "WALLET",
      });
      await writeAuditLog({ userId: admin.id, action: "admin.withdrawal_korapay_status_failed", ipAddress, userAgent, metadata: { withdrawalId: id } });
    }

    const updated = await prisma.withdrawal.findUnique({ where: { id } });
    return NextResponse.json({ withdrawal: updated, note: result.status === "pending" || result.status === "processing" ? "Still processing on Korapay's side" : undefined });
  } catch (error) {
    return handleApiError(error);
  }
}
