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

    const document = await prisma.kycDocument.findUnique({ where: { id } });
    if (!document) return jsonError("Document not found", 404);

    await prisma.$transaction(async (tx) => {
      await tx.kycDocument.update({
        where: { id },
        data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() },
      });
      await tx.user.update({ where: { id: document.userId }, data: { kycStatus: "APPROVED" } });
      await notifyUser({
        userId: document.userId,
        title: "Identity verified",
        body: "Your KYC document has been approved. Your account is now verified.",
        type: "SECURITY",
        client: tx,
      });
    });

    await writeAuditLog({
      userId: admin.id,
      action: "kyc.approve",
      ipAddress,
      userAgent,
      metadata: { documentId: id, targetUserId: document.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
