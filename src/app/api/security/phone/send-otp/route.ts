import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { generateOtpCode, hashToken } from "@/lib/server/auth";
import { sendOtpCode } from "@/lib/notifications/otp";
import { rateLimit } from "@/lib/server/rate-limit";

const schema = z.object({ phone: z.string().trim().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number") });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { phone } = schema.parse(await req.json());

    const limited = await rateLimit(`phone-otp:${user.id}`, 3, 15 * 60 * 1000);
    if (!limited.success) {
      return jsonError("Please wait before requesting another code", 429);
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing && existing.id !== user.id) {
      return jsonError("This phone number is already linked to another account", 409);
    }

    await prisma.user.update({ where: { id: user.id }, data: { phone, phoneVerified: false } });

    const code = generateOtpCode();
    const codeHash = await hashToken(code);
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        purpose: "PHONE_VERIFICATION",
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOtpCode(phone, code);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
