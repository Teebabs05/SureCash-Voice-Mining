import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { MINING_CONFIG } from "@/lib/config";

export async function GET() {
  try {
    const user = await requireUser();
    const cooldownMs = MINING_CONFIG.cooldownHours * 60 * 60 * 1000;
    const nextAvailableAt = user.lastMiningAt
      ? new Date(user.lastMiningAt.getTime() + cooldownMs)
      : null;
    const canMine = !nextAvailableAt || nextAvailableAt.getTime() <= Date.now();

    const projectedStreak = canMine ? Math.min(user.streakCount + 1, 999) : user.streakCount;
    const projectedReward =
      MINING_CONFIG.baseReward +
      Math.min(projectedStreak * MINING_CONFIG.streakBonusPerDay, MINING_CONFIG.maxStreakBonus);

    return NextResponse.json({
      canMine,
      nextAvailableAt,
      streakCount: user.streakCount,
      longestStreak: user.longestStreak,
      projectedReward,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
