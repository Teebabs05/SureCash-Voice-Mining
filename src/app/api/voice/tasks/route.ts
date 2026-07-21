import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { TIER_CONFIG } from "@/lib/config";
import { isActivePlanRequired, planSectionDailyLimit } from "@/lib/server/plan-gate";

/** Fisher-Yates shuffle — randomizes sentence order per request so users
 * don't always record the same prompts in the same sequence. */
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const category = req.nextUrl.searchParams.get("category");
    const resolvedCategory = category === "word_game" ? "word_game" : "session";
    const section = resolvedCategory === "word_game" ? "wordGame" : "voiceEarn";
    const tasks = await prisma.voiceTask.findMany({
      where: { isActive: true, category: resolvedCategory },
      orderBy: { createdAt: "desc" },
    });

    const [todayCounts, plan, sectionCompletedToday] = await Promise.all([
      prisma.voiceRecording.groupBy({
        by: ["voiceTaskId"],
        where: { userId: user.id, createdAt: { gte: startOfDay } },
        _count: { _all: true },
      }),
      user.planId ? prisma.plan.findUnique({ where: { id: user.planId } }) : null,
      prisma.voiceRecording.count({
        where: { userId: user.id, createdAt: { gte: startOfDay }, voiceTask: { category: resolvedCategory } },
      }),
    ]);
    const countMap = new Map(todayCounts.map((c) => [c.voiceTaskId, c._count._all]));
    const multiplier = TIER_CONFIG[user.tier].dailyLimitMultiplier;
    const planRequired = (await isActivePlanRequired()) && !user.planId;
    const sectionDailyLimit = planSectionDailyLimit(plan, section);
    const sectionLimitReached = sectionDailyLimit !== null && sectionCompletedToday >= sectionDailyLimit;

    return NextResponse.json({
      planRequired,
      sectionDailyLimit,
      sectionCompletedToday,
      tasks:
        planRequired || sectionLimitReached
          ? []
          : shuffle(
              tasks.map((t) => ({
                ...t,
                dailyLimit: t.dailyLimit * multiplier,
                completedToday: countMap.get(t.id) ?? 0,
              }))
            ),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
