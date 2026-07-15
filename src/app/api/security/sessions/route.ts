import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { getSession } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    const current = await getSession();

    const sessions = await prisma.session.findMany({
      where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: "desc" },
    });

    return NextResponse.json({
      sessions: sessions.map((s) => ({ ...s, isCurrent: s.id === current?.sessionId })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
