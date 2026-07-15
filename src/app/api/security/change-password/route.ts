import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { hashPassword, verifyPassword } from "@/lib/server/auth";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { currentPassword, newPassword } = schema.parse(await req.json());
    const { ipAddress, userAgent } = getRequestMeta(req);

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return jsonError("Current password is incorrect", 401);

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await writeAuditLog({ userId: user.id, action: "security.password_changed", ipAddress, userAgent });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
