import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { resolveSegmentUsers } from "@/lib/server/notifications";
import { sendEmail, broadcastEmailHtml } from "@/lib/notifications/email";

const schema = z.object({
  subject: z.string().min(2),
  message: z.string().min(2),
  segment: z.enum(["ALL", "VIP", "NEW", "INACTIVE"]).default("ALL"),
});

async function sendToUsers(users: { email: string; fullName: string }[], subject: string, message: string) {
  await Promise.all(
    users.map((user) =>
      sendEmail({ to: user.email, subject, html: broadcastEmailHtml(user.fullName, subject, message) }).catch(() => {})
    )
  );
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { subject, message, segment } = schema.parse(await req.json());

    const users =
      segment === "ALL"
        ? await prisma.user.findMany({ select: { id: true, email: true, fullName: true } })
        : await resolveSegmentUsers(segment);

    if (users.length === 0) {
      return NextResponse.json({ recipientCount: 0 });
    }

    sendToUsers(users, subject, message).catch(() => {});

    return NextResponse.json({ recipientCount: users.length });
  } catch (error) {
    return handleApiError(error);
  }
}
