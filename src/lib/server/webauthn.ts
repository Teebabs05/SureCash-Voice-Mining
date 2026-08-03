import { APP_NAME } from "@/lib/config";

// Derived from NEXT_PUBLIC_APP_URL so this works unmodified across
// environments (localhost in dev, the real domain in production) - the
// WebAuthn spec requires the RP ID to be the bare hostname (no scheme/port).
export function getRpId() {
  const url = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  return url.hostname;
}

export function getOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export const RP_NAME = APP_NAME;

export const REG_CHALLENGE_COOKIE = "webauthn_reg_challenge";
export const LOGIN_CHALLENGE_COOKIE = "webauthn_login_challenge";
