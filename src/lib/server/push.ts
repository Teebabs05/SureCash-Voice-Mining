import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@surecash.app";
  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

/**
 * Best-effort push send — silently a no-op if VAPID keys aren't configured
 * (same "safe stub" convention as the email/OTP providers), and prunes
 * subscriptions the push service reports as gone (410/404) so dead
 * endpoints don't pile up.
 */
async function pushToSubscriptions(
  subscriptions: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: { title: string; body: string; url?: string }
) {
  const message = JSON.stringify(payload);
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  if (!ensureConfigured()) return;
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;
  await pushToSubscriptions(subscriptions, payload);
}

export async function sendPushToUsers(userIds: string[], payload: { title: string; body: string; url?: string }) {
  if (!ensureConfigured() || userIds.length === 0) return;
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });
  if (subscriptions.length === 0) return;
  await pushToSubscriptions(subscriptions, payload);
}

export async function sendPushToAllUsers(payload: { title: string; body: string; url?: string }) {
  if (!ensureConfigured()) return;
  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) return;
  await pushToSubscriptions(subscriptions, payload);
}
