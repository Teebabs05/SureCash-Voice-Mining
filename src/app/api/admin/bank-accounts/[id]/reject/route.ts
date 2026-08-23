import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

const schema = z.object({ reason: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { reason } = schema.parse(await req.json());
    const { ipAddress, userAgent } = getRequestMeta(req);

    const account = await prisma.bankAccount.findUnique({ where: { id } });
    if (!account) return jsonError("Bank account not found", 404);

    // Revoke withdrawal eligibility rather than deleting the row - a prior
    // withdrawal may already reference it, and the record itself is useful
    // to keep for the audit trail.
    await prisma.bankAccount.update({
      where: { id },
      data: { isVerified: false, reviewedAt: new Date(), reviewedById: admin.id, reviewNote: reason },
    });

    await notifyUser({
      userId: account.userId,
      title: "Bank account needs attention",
      body: `Your bank account ending in ${account.accountNumber.slice(-4)} could not be verified: ${reason}. Please remove it and add the correct details.`,
      type: "WALLET",
    });

    await writeAuditLog({
      userId: admin.id,
      action: "admin.bank_account_rejected",
      ipAddress,
      userAgent,
      metadata: { bankAccountId: id, targetUserId: account.userId, reason },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
