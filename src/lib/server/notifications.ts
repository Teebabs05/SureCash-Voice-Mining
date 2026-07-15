import "server-only";
import { Prisma, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

export async function notifyUser(params: {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  client?: Tx;
}) {
  const client = params.client ?? prisma;
  return client.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      body: params.body,
      type: params.type ?? "SYSTEM",
    },
  });
}

export async function broadcastNotification(params: { title: string; body: string; type?: NotificationType }) {
  return prisma.notification.create({
    data: {
      title: params.title,
      body: params.body,
      type: params.type ?? "SYSTEM",
      isBroadcast: true,
    },
  });
}
