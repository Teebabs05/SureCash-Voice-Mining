import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "1";
    const countOnly = searchParams.get("countOnly") === "1";

    const where = {
      OR: [{ userId: user.id }, { isBroadcast: true }],
      ...(unreadOnly ? { isRead: false } : {}),
    };

    if (countOnly) {
      const unreadCount = await prisma.notification.count({ where: { ...where, isRead: false } });
      return NextResponse.json({ unreadCount });
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    return handleApiError(error);
  }
}
