import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";
import { createSession, verifyPassword, generateOtpCode, hashToken } from "@/lib/server/auth";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";
import { rateLimit } from "@/lib/server/rate-limit";
import { sendEmail } from "@/lib/notifications/email";

export async function POST(req: NextRequest) {
  try {
    const { ipAddress, userAgent } = getRequestMeta(req);

    const limited = rateLimit(`login:${ipAddress}`, 10, 15 * 60 * 1000);
    if (!limited.success) {
      return jsonError("Too many login attempts. Please try again later.", 429);
    }

    const body = loginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return jsonError("Invalid email or password", 401);
    }

    if (user.isBanned) {
      return jsonError("This account has been suspended", 403);
    }

    const validPassword = await verifyPassword(body.password, user.passwordHash);
    if (!validPassword) {
      await writeAuditLog({
        userId: user.id,
        action: "auth.login_failed",
        ipAddress,
        userAgent,
      });
      return jsonError("Invalid email or password", 401);
    }

    if (user.twoFactorEnabled) {
      const code = generateOtpCode();
      const codeHash = await hashToken(code);
      await prisma.otpCode.create({
        data: {
          userId: user.id,
          purpose: "LOGIN_2FA",
          codeHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
      await sendEmail({
        to: user.email,
        subject: "Your SureCash Mining login code",
        html: `<p>Your login code is <b>${code}</b>. It expires in 10 minutes.</p>`,
      });
      await writeAuditLog({ userId: user.id, action: "auth.login_2fa_challenge", ipAddress, userAgent });
      return NextResponse.json({ requires2fa: true, uid: user.id });
    }

    await createSession({ userId: user.id, role: user.role, ipAddress, userAgent });
    await writeAuditLog({ userId: user.id, action: "auth.login", ipAddress, userAgent });

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
