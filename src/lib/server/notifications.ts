import "server-only";
import { Prisma, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushToUser, sendPushToAllUsers } from "@/lib/server/push";

type Tx = Prisma.TransactionClient;

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

  // Fire-and-forget: a push failure (no subscription, VAPID not configured,
  // endpoint gone) should never fail the in-app notification write itself.
  sendPushToUser(params.userId, { title: params.title, body: params.body }).catch(() => {});

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
