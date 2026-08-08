import "server-only";
import { SignJWT, importPKCS8 } from "jose";
import { getCredential } from "@/lib/server/credentials";
import { prisma } from "@/lib/prisma";

/**
 * Firebase Cloud Messaging for the native Android app - separate from
 * push.ts, which is browser Web Push and can't reach a WebView-based app.
 * Talks to FCM's HTTP v1 API directly (a Google service-account OAuth2
 * token exchange + a signed fetch) instead of pulling in the firebase-admin
 * SDK, matching the rest of this codebase's no-SDK-dependency convention
 * for provider integrations (see notifications/email.ts, payments/*).
 */

async function getFirebaseCredentials() {
  const [projectId, clientEmail, rawPrivateKey] = await Promise.all([
    getCredential("FIREBASE_PROJECT_ID"),
    getCredential("FIREBASE_CLIENT_EMAIL"),
    getCredential("FIREBASE_PRIVATE_KEY"),
  ]);
  if (!projectId || !clientEmail || !rawPrivateKey) return null;
  // Admins paste the PEM with literal \n escapes (the standard convention
  // for putting a multi-line key into a single-line credential field).
  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
  return { projectId, clientEmail, privateKey };
}

export async function isFcmConfigured(): Promise<boolean> {
  return (await getFirebaseCredentials()) !== null;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) return cachedAccessToken.token;

  const creds = await getFirebaseCredentials();
  if (!creds) return null;

  let assertion: string;
  try {
    const key = await importPKCS8(creds.privateKey, "RS256");
    const now = Math.floor(Date.now() / 1000);
    assertion = await new SignJWT({
      scope: "https://www.googleapis.com/auth/firebase.messaging",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(creds.clientEmail)
      .setAudience("https://oauth2.googleapis.com/token")
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(key);
  } catch {
    // A malformed/corrupted private key (e.g. a stored value that got
    // truncated) throws here rather than producing a usable token - treat
    // it the same as "not configured" instead of crashing the caller.
    return null;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedAccessToken.token;
}

async function sendToToken(
  projectId: string,
  accessToken: string,
  token: string,
  payload: { title: string; body: string; url?: string }
): Promise<{ ok: true } | { ok: false; invalidToken: boolean; message: string }> {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: payload.title, body: payload.body },
        data: payload.url ? { url: payload.url } : undefined,
      },
    }),
  });
  if (res.ok) return { ok: true };

  const body = await res.json().catch(() => null);
  const status = body?.error?.details?.find(
    (d: { errorCode?: string }) => typeof d?.errorCode === "string"
  )?.errorCode;
  const invalidToken = status === "UNREGISTERED" || status === "INVALID_ARGUMENT" || res.status === 404;
  return { ok: false, invalidToken, message: body?.error?.message ?? `HTTP ${res.status}` };
}

export interface FcmSendResult {
  attempted: number;
  sent: number;
  errors: string[];
}

/**
 * Best-effort push send — silently a no-op if Firebase credentials aren't
 * configured, and prunes tokens FCM reports as unregistered/invalid so dead
 * devices don't pile up (same convention as push.ts's subscription pruning).
 * Returns a result summary so the admin push-test endpoint can surface real
 * failures instead of guessing - existing fire-and-forget callers just
 * ignore the resolved value.
 */
async function sendToTokens(
  tokens: { id: string; token: string }[],
  payload: { title: string; body: string; url?: string }
): Promise<FcmSendResult> {
  const creds = await getFirebaseCredentials();
  if (!creds) return { attempted: tokens.length, sent: 0, errors: ["Firebase credentials not configured"] };
  const accessToken = await getAccessToken();
  if (!accessToken) return { attempted: tokens.length, sent: 0, errors: ["Could not obtain a Google OAuth2 access token - check the service account credentials"] };

  const errors: string[] = [];
  let sent = 0;
  await Promise.all(
    tokens.map(async ({ id, token }) => {
      const result = await sendToToken(creds.projectId, accessToken, token, payload);
      if (result.ok) {
        sent++;
      } else {
        errors.push(result.message);
        if (result.invalidToken) {
          await prisma.deviceToken.delete({ where: { id } }).catch(() => {});
        }
      }
    })
  );
  return { attempted: tokens.length, sent, errors };
}

export async function sendFcmToUser(userId: string, payload: { title: string; body: string; url?: string }): Promise<FcmSendResult> {
  const tokens = await prisma.deviceToken.findMany({ where: { userId }, select: { id: true, token: true } });
  if (tokens.length === 0) return { attempted: 0, sent: 0, errors: ["No device registered for this user yet"] };
  return sendToTokens(tokens, payload);
}

export async function sendFcmToAllUsers(payload: { title: string; body: string; url?: string }) {
  const tokens = await prisma.deviceToken.findMany({ select: { id: true, token: true } });
  if (tokens.length === 0) return;
  await sendToTokens(tokens, payload);
}
