import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { startImpersonation } from "@/lib/server/auth";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { ipAddress, userAgent } = getRequestMeta(req);

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return jsonError("User not found", 404);
    if (target.role !== "USER") return jsonError("Can't log in as an admin account", 403);
    if (target.isBanned) return jsonError("Can't log in as a banned user", 400);

    await startImpersonation({
      targetUserId: target.id,
      adminUserId: admin.id,
      ipAddress,
      userAgent,
    });

    await writeAuditLog({
      userId: admin.id,
      action: "admin.impersonate_start",
      ipAddress,
      userAgent,
      metadata: { targetUserId: target.id, targetEmail: target.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
