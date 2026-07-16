import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { notifyUser } from "@/lib/server/notifications";
import { checkAchievements } from "@/lib/server/gamification";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { ipAddress, userAgent } = getRequestMeta(req);

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) return jsonError("Withdrawal not found", 404);
    if (withdrawal.status !== "PENDING" && withdrawal.status !== "PROCESSING") {
      return jsonError("Withdrawal already processed", 409);
    }

    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id },
        data: { status: "PAID", processedAt: new Date(), processedById: admin.id },
      });

      await notifyUser({
        userId: withdrawal.userId,
        title: "Withdrawal paid",
        body:
          withdrawal.method === "USDT"
            ? `Your withdrawal of ${withdrawal.usdtAmount ?? ""} USDT has been sent to your wallet.`
            : `Your withdrawal of ${withdrawal.amount} has been sent to your bank account.`,
        type: "WALLET",
        client: tx,
      });

      await checkAchievements(withdrawal.userId, "WITHDRAWAL_PAID", tx);
    });

    await writeAuditLog({ userId: admin.id, action: "admin.withdrawal_paid", ipAddress, userAgent, metadata: { withdrawalId: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
