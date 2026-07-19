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

    const account = await prisma.bankAccount.findUnique({ where: { id } });
    if (!account) return jsonError("Bank account not found", 404);

    await prisma.bankAccount.update({
      where: { id },
      data: { autoVerified: true, reviewedAt: new Date(), reviewedById: admin.id, reviewNote: null },
    });

    await notifyUser({
      userId: account.userId,
      title: "Bank account approved",
      body: `Your bank account ending in ${account.accountNumber.slice(-4)} has been manually reviewed and approved.`,
      type: "WALLET",
    });

    await writeAuditLog({
      userId: admin.id,
      action: "admin.bank_account_approved",
      ipAddress,
      userAgent,
      metadata: { bankAccountId: id, targetUserId: account.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
