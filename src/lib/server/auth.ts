import "server-only";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "insecure-dev-secret");
const SESSION_COOKIE = "sc_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const ADMIN_RETURN_COOKIE = "sc_admin_return";
const IMPERSONATION_MAX_AGE_SECONDS = 60 * 60; // 1 hour - short-lived by design

export interface SessionPayload {
  userId: string;
  role: "USER" | "ADMIN" | "SUPERADMIN";
  sessionId: string;
  /** Set only on a session an admin started via "Login as this user" - the
   * value is the admin's own userId. */
  impersonatedBy?: string;
  [key: string]: unknown;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

async function signSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(JWT_SECRET);
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Creates a DB-backed session record and issues a JWT cookie referencing it.
 * The DB record is what makes "log out other devices" possible — the JWT
 * alone can't be invalidated early, so every authenticated request checks
 * this record hasn't been revoked or expired.
 */
export async function createSession(params: {
  userId: string;
  role: "USER" | "ADMIN" | "SUPERADMIN";
  ipAddress?: string;
  userAgent?: string;
}) {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const session = await prisma.session.create({
    data: {
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      expiresAt,
    },
  });

  const token = await signSessionToken({
    userId: params.userId,
    role: params.role,
    sessionId: session.id,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  cookieStore.delete(SESSION_COOKIE);

  if (!token) return;
  const payload = await verifySessionToken(token);
  if (!payload?.sessionId) return;

  await prisma.session
    .update({ where: { id: payload.sessionId }, data: { revokedAt: new Date() } })
    .catch(() => {});
}

// Memoized per-request (React cache()) - the layout and any page/API code
// that also checks the session within the same server render only pay for
// one Session table lookup, not one per call site.
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload?.sessionId) return null;

  const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

  return payload;
});

export function getCurrentSessionId(payload: SessionPayload | null) {
  return payload?.sessionId ?? null;
}

/**
 * Admin "Login as this user" — swaps the browser's session cookie to a
 * fresh session for the target user, but first stashes the admin's own
 * still-valid session token in a second cookie so "Return to Admin" can
 * restore it exactly rather than requiring the admin to log in again.
 * Deliberately short-lived (1h) since this bypasses the target's password.
 */
export async function startImpersonation(params: {
  targetUserId: string;
  adminUserId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!adminToken) throw new Error("No active admin session to impersonate from");

  const expiresAt = new Date(Date.now() + IMPERSONATION_MAX_AGE_SECONDS * 1000);
  const session = await prisma.session.create({
    data: {
      userId: params.targetUserId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      expiresAt,
    },
  });

  const token = await signSessionToken({
    userId: params.targetUserId,
    role: "USER",
    sessionId: session.id,
    impersonatedBy: params.adminUserId,
  });

  cookieStore.set(ADMIN_RETURN_COOKIE, adminToken, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge: IMPERSONATION_MAX_AGE_SECONDS,
  });

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge: IMPERSONATION_MAX_AGE_SECONDS,
  });

  return session;
}

/** Ends an impersonation session (revoking it) and restores the admin's
 * original session from the stashed cookie. Returns false if there was
 * nothing to restore (not currently impersonating, or the stashed admin
 * session has since expired/been revoked elsewhere). */
export async function stopImpersonation(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_RETURN_COOKIE)?.value;
  if (!adminToken) return false;

  const adminPayload = await verifySessionToken(adminToken);
  if (!adminPayload?.sessionId) {
    cookieStore.delete(ADMIN_RETURN_COOKIE);
    return false;
  }

  const adminSession = await prisma.session.findUnique({ where: { id: adminPayload.sessionId } });
  if (!adminSession || adminSession.revokedAt || adminSession.expiresAt < new Date()) {
    cookieStore.delete(ADMIN_RETURN_COOKIE);
    cookieStore.delete(SESSION_COOKIE);
    return false;
  }

  const impersonationToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (impersonationToken) {
    const impersonationPayload = await verifySessionToken(impersonationToken);
    if (impersonationPayload?.sessionId) {
      await prisma.session
        .update({ where: { id: impersonationPayload.sessionId }, data: { revokedAt: new Date() } })
        .catch(() => {});
    }
  }

  cookieStore.set(SESSION_COOKIE, adminToken, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  cookieStore.delete(ADMIN_RETURN_COOKIE);

  return true;
}

const referralAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export function generateReferralCode() {
  return referralAlphabet();
}

const otpAlphabet = customAlphabet("0123456789", 6);

export function generateOtpCode() {
  return otpAlphabet();
}

export async function hashToken(token: string) {
  return bcrypt.hash(token, 10);
}

export async function compareToken(token: string, hash: string) {
  return bcrypt.compare(token, hash);
}
