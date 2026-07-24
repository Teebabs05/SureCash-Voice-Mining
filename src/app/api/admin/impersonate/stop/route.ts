import { NextRequest, NextResponse } from "next/server";
import { getSession, stopImpersonation } from "@/lib/server/auth";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Not authenticated", 401);

    const impersonatedUserId = session.userId;
    const adminId = typeof session.impersonatedBy === "string" ? session.impersonatedBy : null;

    const restored = await stopImpersonation();
    if (!restored) return jsonError("Not currently impersonating", 400);

    const { ipAddress, userAgent } = getRequestMeta(req);
    await writeAuditLog({
      userId: adminId ?? impersonatedUserId,
      action: "admin.impersonate_stop",
      ipAddress,
      userAgent,
      metadata: { impersonatedUserId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
