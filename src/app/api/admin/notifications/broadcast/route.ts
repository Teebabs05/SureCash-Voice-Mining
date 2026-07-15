import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { broadcastNotification } from "@/lib/server/notifications";

const schema = z.object({
  title: z.string().min(2),
  body: z.string().min(2),
  segment: z.enum(["ALL", "VIP", "NEW", "INACTIVE"]).default("ALL"),
});

async function resolveSegmentUserIds(segment: "VIP" | "NEW" | "INACTIVE") {
  if (segment === "VIP") {
    const users = await prisma.user.findMany({ where: { tier: "VIP" }, select: { id: true } });
    return users.map((u) => u.id);
  }

  if (segment === "NEW") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const users = await prisma.user.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { id: true } });
    return users.map((u) => u.id);
  }

  // INACTIVE: no wallet transaction in the last 14 days (including never active).
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const users = await prisma.user.findMany({
    where: { walletTransactions: { none: { createdAt: { gte: fourteenDaysAgo } } } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { title, body, segment } = schema.parse(await req.json());

    if (segment === "ALL") {
      const notification = await broadcastNotification({ title, body, type: "ADMIN" });
      return NextResponse.json({ notification, recipientCount: null });
    }

    const userIds = await resolveSegmentUserIds(segment);
    if (userIds.length === 0) {
      return NextResponse.json({ notification: null, recipientCount: 0 });
    }

    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, title, body, type: "ADMIN" as const })),
    });

    return NextResponse.json({ notification: null, recipientCount: userIds.length });
  } catch (error) {
    return handleApiError(error);
  }
}
