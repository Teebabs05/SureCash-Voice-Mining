import "server-only";
import { Prisma, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushToUser, sendPushToAllUsers } from "@/lib/server/push";
import { sendWhatsAppNotification, isWhatsAppConfigured } from "@/lib/notifications/whatsapp";

type Tx = Prisma.TransactionClient;

async function sendWhatsAppIfEnabled(userId: string, title: string, body: string) {
  if (!(await isWhatsAppConfigured())) return;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true, phoneVerified: true } });
  if (!user?.phone || !user.phoneVerified) return;

  await sendWhatsAppNotification(user.phone, title, body);
}

export async function notifyUser(params: {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  client?: Tx;
}) {
  const client = params.client ?? prisma;
  const notification = await client.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      body: params.body,
      type: params.type ?? "SYSTEM",
    },
  });

  // Fire-and-forget: a push/WhatsApp failure (no subscription, not
  // configured, no verified phone) should never fail the in-app
  // notification write itself.
  sendPushToUser(params.userId, { title: params.title, body: params.body }).catch(() => {});
  sendWhatsAppIfEnabled(params.userId, params.title, params.body).catch(() => {});

  return notification;
}

export async function broadcastNotification(params: { title: string; body: string; type?: NotificationType }) {
  const notification = await prisma.notification.create({
    data: {
      title: params.title,
      body: params.body,
      type: params.type ?? "SYSTEM",
      isBroadcast: true,
    },
  });

  sendPushToAllUsers({ title: params.title, body: params.body }).catch(() => {});

  return notification;
}

export type BroadcastSegment = "VIP" | "NEW" | "INACTIVE";

export async function resolveSegmentUsers(segment: BroadcastSegment) {
  if (segment === "VIP") {
    return prisma.user.findMany({ where: { tier: "VIP" }, select: { id: true, email: true, fullName: true } });
  }

  if (segment === "NEW") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { id: true, email: true, fullName: true },
    });
  }

  // INACTIVE: no wallet transaction in the last 14 days (including never active).
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  return prisma.user.findMany({
    where: { walletTransactions: { none: { createdAt: { gte: fourteenDaysAgo } } } },
    select: { id: true, email: true, fullName: true },
  });
}
