import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { generateOtpCode, hashToken } from "@/lib/server/auth";
import { sendEmail, verificationEmailHtml } from "@/lib/notifications/email";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { rateLimit } from "@/lib/server/rate-limit";

export async function POST() {
  try {
    const user = await requireUser();
    if (user.emailVerified) {
      return jsonError("Email is already verified", 400);
    }

    const limited = rateLimit(`resend-verification:${user.id}`, 3, 15 * 60 * 1000);
    if (!limited.success) {
      return jsonError("Please wait before requesting another email", 429);
    }

    const rawToken = generateOtpCode() + generateOtpCode();
    const tokenHash = await hashToken(rawToken);
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${rawToken}&uid=${user.id}`;
    await sendEmail({
      to: user.email,
      subject: "Verify your SureCash Mining account",
      html: verificationEmailHtml(user.fullName, verifyUrl),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
