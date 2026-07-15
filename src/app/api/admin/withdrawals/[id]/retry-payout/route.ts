import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { attemptAutomaticPayout } from "@/lib/server/withdrawal-payout";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { ipAddress, userAgent } = getRequestMeta(req);

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) return jsonError("Withdrawal not found", 404);
    if (withdrawal.status !== "PENDING") return jsonError("Automatic payout can only be retried while pending", 409);

    await attemptAutomaticPayout(id);
    const updated = await prisma.withdrawal.findUnique({ where: { id } });

    await writeAuditLog({ userId: admin.id, action: "admin.withdrawal_payout_retried", ipAddress, userAgent, metadata: { withdrawalId: id } });

    return NextResponse.json({ withdrawal: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
