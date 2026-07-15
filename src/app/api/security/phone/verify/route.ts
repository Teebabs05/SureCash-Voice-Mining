import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { compareToken } from "@/lib/server/auth";

const schema = z.object({ code: z.string().min(4) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { code } = schema.parse(await req.json());

    const otp = await prisma.otpCode.findFirst({
      where: { userId: user.id, purpose: "PHONE_VERIFICATION", usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) return jsonError("Code expired. Please request a new one.", 400);
    if (otp.attempts >= 5) return jsonError("Too many attempts. Please request a new code.", 429);

    const valid = await compareToken(code, otp.codeHash);
    if (!valid) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      return jsonError("Invalid code", 400);
    }

    await prisma.$transaction([
      prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
