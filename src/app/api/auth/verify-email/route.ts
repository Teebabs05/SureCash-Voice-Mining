import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { compareToken } from "@/lib/server/auth";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";
import { checkAchievements } from "@/lib/server/gamification";

const schema = z.object({ token: z.string().min(1), uid: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const { token, uid } = schema.parse(await req.json());

    const candidates = await prisma.emailVerificationToken.findMany({
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
      return jsonError("This verification link is invalid or has expired", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.update({
        where: { id: matched!.id },
        data: { usedAt: new Date() },
      });

      const user = await tx.user.update({
        where: { id: uid },
        data: { emailVerified: true },
      });

      const referral = await tx.referral.findUnique({ where: { referredId: user.id } });
      if (referral && !referral.rewardCredited) {
        await creditWallet({
          userId: referral.referrerId,
          type: "SALES",
          amount: Number(referral.rewardAmount),
          reason: "REFERRAL_BONUS",
          description: `Referral bonus for inviting ${user.fullName}`,
          client: tx,
        });
        await tx.referral.update({ where: { id: referral.id }, data: { rewardCredited: true } });
        await notifyUser({
          userId: referral.referrerId,
          title: "Referral bonus credited",
          body: `${user.fullName} verified their email — your referral bonus has been credited.`,
          type: "REFERRAL",
          client: tx,
        });
        await checkAchievements(referral.referrerId, "REFERRAL_CREDITED", tx);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
