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

    const userId = withdrawal.userId;

    async function markFailed(message: string, auditAction: string) {
      await prisma.withdrawal.update({
        where: { id },
        data: { status: "PENDING", autoPayoutError: message },
      });
      await notifyUser({
        userId,
        title: "Withdrawal delayed",
        body: "Your withdrawal couldn't be completed automatically and is now under manual review.",
        type: "WALLET",
      });
      await writeAuditLog({ userId: admin.id, action: auditAction, ipAddress, userAgent, metadata: { withdrawalId: id, message } });
    }

    const result = await getTransferStatus(withdrawal.reference);
    if (!result.ok) {
      if (result.notFound) {
        // Korapay has no record of this transfer at all - it was never
        // actually created on their end despite the app marking it
        // PROCESSING, so treat this the same as an explicit failure rather
        // than leaving it stuck forever.
        await markFailed(`Korapay has no record of this transfer (${result.error})`, "admin.withdrawal_korapay_status_not_found");
        const updated = await prisma.withdrawal.findUnique({ where: { id } });
        return NextResponse.json({ withdrawal: updated, note: "Korapay has no record of this transfer - moved back to Pending for manual review" });
      }
      // Any other lookup failure isn't proof the transfer itself failed
      // (could be transient) - surface the real reason without touching
      // the withdrawal's status, so the admin can decide.
      return NextResponse.json({ withdrawal, note: `Korapay error: ${result.error}` });
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
      await markFailed(result.message ?? "Korapay reported this transfer as failed", "admin.withdrawal_korapay_status_failed");
    }

    const updated = await prisma.withdrawal.findUnique({ where: { id } });
    return NextResponse.json({ withdrawal: updated, note: result.status === "pending" || result.status === "processing" ? "Still processing on Korapay's side" : undefined });
  } catch (error) {
    return handleApiError(error);
  }
}
