import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { compareToken, createSession } from "@/lib/server/auth";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

const schema = z.object({ uid: z.string().min(1), code: z.string().min(4) });

export async function POST(req: NextRequest) {
  try {
    const { uid, code } = schema.parse(await req.json());
    const { ipAddress, userAgent } = getRequestMeta(req);

    const otp = await prisma.otpCode.findFirst({
      where: { userId: uid, purpose: "LOGIN_2FA", usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) return jsonError("Code expired. Please log in again.", 400);
    if (otp.attempts >= 5) return jsonError("Too many attempts. Please log in again.", 429);

    const valid = await compareToken(code, otp.codeHash);
    if (!valid) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      return jsonError("Invalid code", 400);
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: uid } });
    await prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
    await createSession({ userId: user.id, role: user.role, ipAddress, userAgent });
    await writeAuditLog({ userId: user.id, action: "auth.login_2fa_success", ipAddress, userAgent });

    return NextResponse.json({
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, emailVerified: user.emailVerified },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
