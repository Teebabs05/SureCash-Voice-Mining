import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { compareToken, hashPassword } from "@/lib/server/auth";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { notifyUser } from "@/lib/server/notifications";

const schema = z.object({ token: z.string().min(1), uid: z.string().min(1), password: z.string().min(8) });

export async function POST(req: NextRequest) {
  try {
    const { token, uid, password } = schema.parse(await req.json());

    const candidates = await prisma.passwordResetToken.findMany({
      where: { userId: uid, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    let matched = null;
    for (const candidate of candidates) {
      if (await compareToken(token, candidate.tokenHash)) {
        matched = candidate;
        break;
      }
    }

    if (!matched) {
      return jsonError("This reset link is invalid or has expired", 400);
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.update({ where: { id: matched!.id }, data: { usedAt: new Date() } });
      // Any other still-open reset links for this user are now stale - a
      // successful reset should invalidate them rather than leave multiple
      // valid links to the same account floating around.
      await tx.passwordResetToken.updateMany({
        where: { userId: uid, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.user.update({ where: { id: uid }, data: { passwordHash } });
    });

    await notifyUser({
      userId: uid,
      title: "Password changed",
      body: "Your password was just reset. If this wasn't you, contact support immediately.",
      type: "SYSTEM",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
