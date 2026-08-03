import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation/auth";
import {
  createSession,
  generateOtpCode,
  generateReferralCode,
  hashPassword,
  hashToken,
} from "@/lib/server/auth";
import { ensureWalletsForUser } from "@/lib/server/wallet";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";
import { rateLimit } from "@/lib/server/rate-limit";
import { sendEmail, verificationEmailHtml } from "@/lib/notifications/email";
import { verifyRecaptcha } from "@/lib/security/recaptcha";
import { getReferralSignupBonus } from "@/lib/server/referral-settings";

export async function POST(req: NextRequest) {
  try {
    const { ipAddress, userAgent } = getRequestMeta(req);

    const limited = await rateLimit(`register:${ipAddress}`, 5, 15 * 60 * 1000);
    if (!limited.success) {
      return jsonError("Too many registration attempts. Please try again later.", 429);
    }

    const body = registerSchema.parse(await req.json());

    const recaptchaOk = await verifyRecaptcha(body.recaptchaToken);
    if (!recaptchaOk) {
      return jsonError("reCAPTCHA verification failed. Please try again.", 400);
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return jsonError("An account with this email already exists", 409);
    }

    if (body.phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: body.phone } });
      if (existingPhone) {
        return jsonError("An account with this phone number already exists", 409);
      }
    }

    let referredById: string | null = null;
    if (body.referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: body.referralCode } });
      if (referrer) referredById = referrer.id;
    }

    const passwordHash = await hashPassword(body.password);

    let referralCode = generateReferralCode();
    for (let attempts = 0; attempts < 5; attempts++) {
      const clash = await prisma.user.findUnique({ where: { referralCode } });
      if (!clash) break;
      referralCode = generateReferralCode();
    }

    const referralSignupBonus = await getReferralSignupBonus();

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          fullName: body.fullName,
          email: body.email,
          phone: body.phone || null,
          passwordHash,
          referralCode,
          referredById,
        },
      });

      await ensureWalletsForUser(created.id, tx);

      if (referredById) {
        await tx.referral.create({
          data: {
            referrerId: referredById,
            referredId: created.id,
            rewardAmount: referralSignupBonus,
          },
        });
      }

      return created;
    });

    const rawToken = generateOtpCode() + generateOtpCode();
    const tokenHash = await hashToken(rawToken);
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${rawToken}&uid=${user.id}`;
    await sendEmail({
      to: user.email,
      subject: "Verify your SureCash Mining account",
      html: verificationEmailHtml(user.fullName, verifyUrl),
    });

    await createSession({ userId: user.id, role: user.role, ipAddress, userAgent });
    await writeAuditLog({ userId: user.id, action: "auth.register", ipAddress, userAgent });

    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        referralCode: user.referralCode,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
