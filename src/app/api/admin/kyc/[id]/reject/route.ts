import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

const schema = z.object({ note: z.string().trim().max(255).optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { note } = schema.parse(await req.json().catch(() => ({})));
    const { ipAddress, userAgent } = getRequestMeta(req);

    const document = await prisma.kycDocument.findUnique({ where: { id } });
    if (!document) return jsonError("Document not found", 404);

    await prisma.$transaction(async (tx) => {
      await tx.kycDocument.update({
        where: { id },
        data: { status: "REJECTED", adminNote: note, reviewedById: admin.id, reviewedAt: new Date() },
      });
      await tx.user.update({ where: { id: document.userId }, data: { kycStatus: "REJECTED" } });
      await notifyUser({
        userId: document.userId,
        title: "KYC document rejected",
        body: note ? `Your KYC submission was rejected: ${note}` : "Your KYC submission was rejected. Please resubmit.",
        type: "SECURITY",
        client: tx,
      });
    });

    await writeAuditLog({
      userId: admin.id,
      action: "kyc.reject",
      ipAddress,
      userAgent,
      metadata: { documentId: id, targetUserId: document.userId, note },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
