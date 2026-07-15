import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    const logins = await prisma.auditLog.findMany({
      where: { userId: user.id, action: { in: ["auth.login", "auth.login_2fa_success", "auth.login_failed"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ logins });
  } catch (error) {
    return handleApiError(error);
  }
}
