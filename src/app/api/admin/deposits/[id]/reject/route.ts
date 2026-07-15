import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
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

    await prisma.deposit.update({
      where: { id },
      data: { status: "REJECTED", verifiedAt: new Date(), verifiedById: admin.id },
    });

    await notifyUser({
      userId: deposit.userId,
      title: "Deposit rejected",
      body: `Your deposit of ${deposit.amount} could not be verified. Contact support if this is unexpected.`,
      type: "WALLET",
    });
    await writeAuditLog({ userId: admin.id, action: "admin.deposit_rejected", ipAddress, userAgent, metadata: { depositId: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
