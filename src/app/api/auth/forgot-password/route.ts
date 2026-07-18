import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, hashToken } from "@/lib/server/auth";
import { sendEmail, passwordResetEmailHtml } from "@/lib/notifications/email";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { rateLimit } from "@/lib/server/rate-limit";
import { getRequestMeta } from "@/lib/server/audit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());
    const { ipAddress } = getRequestMeta(req);

    const limited = await rateLimit(`forgot-password:${ipAddress}`, 5, 15 * 60 * 1000);
    if (!limited.success) {
      return jsonError("Too many attempts. Please try again later.", 429);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond the same way whether or not the email exists, so this
    // endpoint can't be used to enumerate registered accounts.
    if (user) {
      const rawToken = generateOtpCode() + generateOtpCode();
      const tokenHash = await hashToken(rawToken);
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}&uid=${user.id}`;
      await sendEmail({
        to: user.email,
        subject: "Reset your SureCash Mining password",
        html: passwordResetEmailHtml(user.fullName, resetUrl),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
