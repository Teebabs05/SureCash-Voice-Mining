import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { handleApiError } from "@/lib/server/api-response";
import { getRpId, LOGIN_CHALLENGE_COOKIE } from "@/lib/server/webauthn";

// Public - no session yet. No allowCredentials means the browser lets the
// user pick from any discoverable passkey registered for this site.
export async function GET() {
  try {
    const options = await generateAuthenticationOptions({
      rpID: getRpId(),
      userVerification: "required",
    });

    const cookieStore = await cookies();
    cookieStore.set(LOGIN_CHALLENGE_COOKIE, options.challenge, {
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
