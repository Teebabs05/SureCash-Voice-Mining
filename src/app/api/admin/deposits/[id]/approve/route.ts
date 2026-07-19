import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { ipAddress, userAgent } = getRequestMeta(req);

    const deposit = await prisma.deposit.findUnique({ where: { id } });
    if (!deposit) return jsonError("Deposit not found", 404);
    if (deposit.status !== "PENDING") return jsonError("Deposit already processed", 409);

    await prisma.$transaction(async (tx) => {
      // Atomic status flip so a double-tapped Approve button (or a
      // resubmitted request) can't both pass the PENDING check above and
      // each credit the deposit.
      const claimed = await tx.deposit.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "APPROVED", verifiedAt: new Date(), verifiedById: admin.id },
      });
      if (claimed.count === 0) throw new Error("Deposit already processed");

      await creditWallet({
        userId: deposit.userId,
        type: "MAIN",
        amount: Number(deposit.amount),
        reason: "DEPOSIT",
        description: `Manual deposit approved (${deposit.reference})`,
        client: tx,
      });

      await notifyUser({
        userId: deposit.userId,
        title: "Deposit approved",
        body: `Your deposit of ${deposit.amount} has been credited to your Main wallet.`,
        type: "WALLET",
        client: tx,
      });
    });

    await writeAuditLog({ userId: admin.id, action: "admin.deposit_approved", ipAddress, userAgent, metadata: { depositId: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
