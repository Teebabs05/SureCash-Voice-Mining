import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

const schema = z.object({ reason: z.string().optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { reason } = schema.parse(await req.json().catch(() => ({})));
    const { ipAddress, userAgent } = getRequestMeta(req);

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) return jsonError("Withdrawal not found", 404);
    if (withdrawal.status !== "PENDING") return jsonError("Withdrawal already processed", 409);

    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id },
        data: {
          status: "REJECTED",
          processedAt: new Date(),
          processedById: admin.id,
          rejectionReason: reason,
        },
      });

      await creditWallet({
        userId: withdrawal.userId,
        type: "MAIN",
        amount: Number(withdrawal.amount) + Number(withdrawal.fee),
        reason: "WITHDRAWAL_REVERSAL",
        description: `Withdrawal ${withdrawal.reference} rejected — funds returned`,
        client: tx,
      });

      await notifyUser({
        userId: withdrawal.userId,
        title: "Withdrawal rejected",
        body: reason ?? "Your withdrawal was rejected and the funds have been returned to your Main wallet.",
        type: "WALLET",
        client: tx,
      });
    });

    await writeAuditLog({ userId: admin.id, action: "admin.withdrawal_rejected", ipAddress, userAgent, metadata: { withdrawalId: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
