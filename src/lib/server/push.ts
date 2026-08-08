import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { getCredential } from "@/lib/server/credentials";

let configuredForKey: string | null = null;

/**
 * Resolves VAPID keys through the same admin-configurable credential store
 * as every other provider (Admin > Settings > Notifications) rather than
 * requiring a .env edit + redeploy - falls back to env vars if set there
 * instead, same convention as getCredential() itself.
 */
async function ensureConfigured(): Promise<boolean> {
  const publicKey = await getCredential("VAPID_PUBLIC_KEY");
  const privateKey = await getCredential("VAPID_PRIVATE_KEY");
  const subject = (await getCredential("VAPID_SUBJECT")) || "mailto:support@surecash.app";
  if (!publicKey || !privateKey) return false;

  if (configuredForKey !== publicKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configuredForKey = publicKey;
  }
  return true;
}

export async function getVapidPublicKey(): Promise<string | null> {
  return getCredential("VAPID_PUBLIC_KEY");
}

export interface WebPushSendResult {
  attempted: number;
  sent: number;
  errors: string[];
}

/**
 * Best-effort push send — silently a no-op if VAPID keys aren't configured
 * (same "safe stub" convention as the email/OTP providers), and prunes
 * subscriptions the push service reports as gone (410/404) so dead
 * endpoints don't pile up. Returns a result summary so the admin push-test
 * endpoint can surface real failures - existing fire-and-forget callers
 * just ignore the resolved value.
 */
async function pushToSubscriptions(
  subscriptions: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: { title: string; body: string; url?: string }
): Promise<WebPushSendResult> {
  const message = JSON.stringify(payload);
  const errors: string[] = [];
  let sent = 0;
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message
        );
        sent++;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        const message = error instanceof Error ? error.message : String(error);
        errors.push(message);
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
  return { attempted: subscriptions.length, sent, errors };
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }): Promise<WebPushSendResult> {
  if (!(await ensureConfigured())) return { attempted: 0, sent: 0, errors: ["VAPID keys not configured"] };
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return { attempted: 0, sent: 0, errors: ["No browser subscription for this user yet"] };
  return pushToSubscriptions(subscriptions, payload);
}

export async function sendPushToUsers(userIds: string[], payload: { title: string; body: string; url?: string }) {
  if (!(await ensureConfigured()) || userIds.length === 0) return;
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });
  if (subscriptions.length === 0) return;
  await pushToSubscriptions(subscriptions, payload);
}

export async function sendPushToAllUsers(payload: { title: string; body: string; url?: string }) {
  if (!(await ensureConfigured())) return;
  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) return;
  await pushToSubscriptions(subscriptions, payload);
}
