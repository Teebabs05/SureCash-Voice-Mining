import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { getRpId, RP_NAME, REG_CHALLENGE_COOKIE } from "@/lib/server/webauthn";

export async function GET() {
  try {
    const user = await requireUser();
    const existing = await prisma.webAuthnCredential.findMany({
      where: { userId: user.id },
      select: { credentialId: true },
    });

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: getRpId(),
      userName: user.email,
      userDisplayName: user.fullName,
      userID: new TextEncoder().encode(user.id),
      attestationType: "none",
      excludeCredentials: existing.map((c) => ({ id: c.credentialId })),
      // Resident/discoverable + required verification so login later doesn't
      // need the user to type their email first - the authenticator itself
      // surfaces which account to use.
      authenticatorSelection: { residentKey: "required", userVerification: "required" },
    });

    const cookieStore = await cookies();
    cookieStore.set(REG_CHALLENGE_COOKIE, options.challenge, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE !== "false",
      sameSite: "lax",
      path: "/",
      maxAge: 300,
    });

    return NextResponse.json(options);
  } catch (error) {
    return handleApiError(error);
  }
}
