import "server-only";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "insecure-dev-secret");
const SESSION_COOKIE = "sc_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  role: "USER" | "ADMIN" | "SUPERADMIN";
  sessionId: string;
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

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload?.sessionId) return null;

  const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

  return payload;
}

export function getCurrentSessionId(payload: SessionPayload | null) {
  return payload?.sessionId ?? null;
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
