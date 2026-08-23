import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";
import { addXp } from "@/lib/server/gamification";
import { payReferralCommission } from "@/lib/server/referral-commission";
import { getSetting } from "@/lib/server/settings";
import { isActivePlanRequired, planSectionDailyLimit } from "@/lib/server/plan-gate";
import { rateLimit } from "@/lib/server/rate-limit";
import { XP_CONFIG } from "@/lib/config";

const schema = z.object({ watchedSeconds: z.number().nonnegative() });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.emailVerified) {
      return jsonError("Please verify your email before earning from ads", 403);
    }

    const limited = await rateLimit(`ad-watch:${user.id}`, 30, 60 * 60 * 1000);
    if (!limited.success) {
      return jsonError("Too many ad watches. Please slow down.", 429);
    }

    const { watchedSeconds } = schema.parse(await req.json());

    const [plan, durationSeconds] = await Promise.all([
      user.planId ? prisma.plan.findUnique({ where: { id: user.planId } }) : null,
      getSetting("watch_ads_duration_seconds", 15),
    ]);
    const planRequired = !plan && (await isActivePlanRequired());

    if (watchedSeconds < durationSeconds) {
      return jsonError(`Please watch the full ${durationSeconds}s before claiming`, 422);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const sectionDailyLimit = planSectionDailyLimit(plan, "watchAds");
    if (sectionDailyLimit !== null) {
      const sectionCompletedToday = await prisma.adWatch.count({
        where: { userId: user.id, createdAt: { gte: startOfDay } },
      });
      if (sectionCompletedToday >= sectionDailyLimit) {
        return jsonError(`You've reached today's limit for watching ads (${sectionDailyLimit}/day) - upgrade for more`, 429);
      }
    }

    const rewardAmount = await getSetting("watch_ads_reward_amount", 20);
    const effectiveReward = planRequired ? 0 : rewardAmount;

    await prisma.$transaction(async (tx) => {
      await tx.adWatch.create({ data: { userId: user.id, rewardAmount: effectiveReward } });

      if (effectiveReward > 0) {
        await creditWallet({
          userId: user.id,
          type: "ENGAGEMENT",
          amount: effectiveReward,
          reason: "AD_REWARD",
          description: "Watched an ad",
          client: tx,
        });
        await payReferralCommission({
          earnerId: user.id,
          earnedAmount: effectiveReward,
          sourceReason: "AD_REWARD",
          client: tx,
        });
      }
      await addXp(user.id, XP_CONFIG.perAdWatch, tx);
    });

    return NextResponse.json({ reward: effectiveReward });
  } catch (error) {
    return handleApiError(error);
  }
}
