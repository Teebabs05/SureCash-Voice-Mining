import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/server/auth";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { getRpId, getOrigin, LOGIN_CHALLENGE_COOKIE } from "@/lib/server/webauthn";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";
import { rateLimit } from "@/lib/server/rate-limit";
import { sendEmail, loginAlertEmailHtml } from "@/lib/notifications/email";

export async function POST(req: NextRequest) {
  try {
    const { ipAddress, userAgent } = getRequestMeta(req);
    const limited = await rateLimit(`biometric-login:${ipAddress}`, 10, 15 * 60 * 1000);
    if (!limited.success) {
      return jsonError("Too many attempts. Please try again later.", 429);
    }

    const body = await req.json();

    const cookieStore = await cookies();
    const expectedChallenge = cookieStore.get(LOGIN_CHALLENGE_COOKIE)?.value;
    if (!expectedChallenge) return jsonError("Login session expired — try again", 400);
    cookieStore.delete(LOGIN_CHALLENGE_COOKIE);

    const stored = await prisma.webAuthnCredential.findUnique({ where: { credentialId: body.id } });
    if (!stored) return jsonError("This device isn't registered for biometric login", 404);

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) return jsonError("Account not found", 404);
    if (user.isBanned) return jsonError("This account has been suspended", 403);

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpId(),
      credential: {
        id: stored.credentialId,
        publicKey: isoBase64URL.toBuffer(stored.publicKey),
        counter: stored.counter,
      },
    });

    if (!verification.verified) {
      return jsonError("Could not verify this device", 400);
    }

    await prisma.webAuthnCredential.update({
      where: { id: stored.id },
      data: { counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() },
    });

    await createSession({ userId: user.id, role: user.role, ipAddress, userAgent });
    await writeAuditLog({ userId: user.id, action: "auth.biometric_login", ipAddress, userAgent });

    if (user.loginAlertsEnabled) {
      sendEmail({
        to: user.email,
        subject: "New login to your SureCash Mining account",
        html: loginAlertEmailHtml({
          fullName: user.fullName,
          ipAddress,
          userAgent,
          time: new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" }),
        }),
      }).catch(() => {});
    }

    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
