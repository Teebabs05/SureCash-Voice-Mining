import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { getSetting } from "@/lib/server/settings";
import { isActivePlanRequired, planSectionDailyLimit } from "@/lib/server/plan-gate";

export async function GET() {
  try {
    const user = await requireUser();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [plan, planRequired, rewardAmount, durationSeconds] = await Promise.all([
      user.planId ? prisma.plan.findUnique({ where: { id: user.planId } }) : null,
      isActivePlanRequired().then((required) => required && !user.planId),
      getSetting("watch_ads_reward_amount", 20),
      getSetting("watch_ads_duration_seconds", 15),
    ]);

    const sectionDailyLimit = planSectionDailyLimit(plan, "watchAds");
    const sectionCompletedToday = await prisma.adWatch.count({
      where: { userId: user.id, createdAt: { gte: startOfDay } },
    });

    return NextResponse.json({
      planRequired,
      rewardAmount,
      durationSeconds,
      sectionDailyLimit,
      sectionCompletedToday,
      limitReached: sectionDailyLimit !== null && sectionCompletedToday >= sectionDailyLimit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
