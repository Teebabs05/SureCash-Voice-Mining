import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { broadcastNotification, resolveSegmentUsers } from "@/lib/server/notifications";
import { sendPushToUsers } from "@/lib/server/push";

const schema = z.object({
  title: z.string().min(2),
  body: z.string().min(2),
  segment: z.enum(["ALL", "VIP", "NEW", "INACTIVE"]).default("ALL"),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { title, body, segment } = schema.parse(await req.json());

    if (segment === "ALL") {
      const notification = await broadcastNotification({ title, body, type: "ADMIN" });
      return NextResponse.json({ notification, recipientCount: null });
    }

    const users = await resolveSegmentUsers(segment);
    if (users.length === 0) {
      return NextResponse.json({ notification: null, recipientCount: 0 });
    }

    const userIds = users.map((u) => u.id);
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, title, body, type: "ADMIN" as const })),
    });
    sendPushToUsers(userIds, { title, body }).catch(() => {});

    return NextResponse.json({ notification: null, recipientCount: userIds.length });
  } catch (error) {
    return handleApiError(error);
  }
}
