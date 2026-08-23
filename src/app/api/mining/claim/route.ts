import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";
import { bumpMiningStreak, addXp, incrementMissionProgress, checkAchievements } from "@/lib/server/gamification";
import { payReferralCommission } from "@/lib/server/referral-commission";
import { MINING_CONFIG, XP_CONFIG, TIER_CONFIG } from "@/lib/config";
import { getMiningBaseReward } from "@/lib/server/mining-settings";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";
import { notifyUser } from "@/lib/server/notifications";
import { isActivePlanRequired } from "@/lib/server/plan-gate";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.emailVerified) {
      return jsonError("Please verify your email before mining", 403);
    }
    if ((await isActivePlanRequired()) && !user.planId) {
      return jsonError("Activate a plan to start mining", 403);
    }
    const { ipAddress, userAgent } = getRequestMeta(req);

    const cooldownMs = MINING_CONFIG.cooldownHours * 60 * 60 * 1000;
    if (user.lastMiningAt && user.lastMiningAt.getTime() + cooldownMs > Date.now()) {
      return jsonError("Mining is still on cooldown", 429);
    }

    const miningBaseReward = await getMiningBaseReward();

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await bumpMiningStreak(user.id, tx);

      const baseReward =
        miningBaseReward +
        Math.min(updatedUser.streakCount * MINING_CONFIG.streakBonusPerDay, MINING_CONFIG.maxStreakBonus);
      const reward = Number((baseReward * TIER_CONFIG[user.tier].miningRewardMultiplier).toFixed(2));

      const milestone = MINING_CONFIG.streakMilestones.find((m) => m.day === updatedUser.streakCount);

      const txn = await creditWallet({
        userId: user.id,
        type: "ENGAGEMENT",
        amount: reward,
        reason: "DAILY_MINING",
        description: `Daily mining reward (streak day ${updatedUser.streakCount})`,
        client: tx,
      });

      let milestoneBonus = 0;
      if (milestone) {
        milestoneBonus = milestone.bonus;
        await creditWallet({
          userId: user.id,
          type: "ENGAGEMENT",
          amount: milestoneBonus,
          reason: "MISSION_REWARD",
          description: `${milestone.day}-day streak milestone bonus`,
          client: tx,
        });
        await notifyUser({
          userId: user.id,
          title: `${milestone.day}-day streak milestone!`,
          body: `You earned a bonus of ${milestoneBonus} for keeping your streak alive.`,
          type: "GAMIFICATION",
          client: tx,
        });
      }

      await addXp(user.id, XP_CONFIG.perMining, tx);
      await incrementMissionProgress(user.id, "MINING", 1, tx);
      await payReferralCommission({ earnerId: user.id, earnedAmount: reward, sourceReason: "DAILY_MINING", client: tx });
      await checkAchievements(user.id, "MINING_STREAK", tx);

      return { reward, milestoneBonus, streak: updatedUser.streakCount, txn };
    });

    await writeAuditLog({ userId: user.id, action: "mining.claim", ipAddress, userAgent, metadata: result });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
