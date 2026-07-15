import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { getSession } from "@/lib/server/auth";
import { handleApiError, jsonError } from "@/lib/server/api-response";

export async function POST() {
  try {
    const user = await requireUser();
    const current = await getSession();
    if (!current?.sessionId) return jsonError("No active session", 401);

    const result = await prisma.session.updateMany({
      where: { userId: user.id, id: { not: current.sessionId }, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ revokedCount: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}
