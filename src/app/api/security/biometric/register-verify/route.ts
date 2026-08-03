import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { getRpId, getOrigin, REG_CHALLENGE_COOKIE } from "@/lib/server/webauthn";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { ipAddress, userAgent } = getRequestMeta(req);
    const body = await req.json();

    const cookieStore = await cookies();
    const expectedChallenge = cookieStore.get(REG_CHALLENGE_COOKIE)?.value;
    if (!expectedChallenge) return jsonError("Registration session expired — try again", 400);
    cookieStore.delete(REG_CHALLENGE_COOKIE);

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpId(),
    });

    if (!verification.verified || !verification.registrationInfo) {
      return jsonError("Could not verify this device", 400);
    }

    const { credential } = verification.registrationInfo;

    const existing = await prisma.webAuthnCredential.findUnique({ where: { credentialId: credential.id } });
    if (existing) return jsonError("This device is already registered", 409);

    await prisma.webAuthnCredential.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        publicKey: isoBase64URL.fromBuffer(credential.publicKey),
        counter: credential.counter,
        deviceLabel: userAgent?.slice(0, 191),
      },
    });

    await writeAuditLog({ userId: user.id, action: "security.biometric_enabled", ipAddress, userAgent });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
