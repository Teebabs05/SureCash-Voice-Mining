import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { TIER_CONFIG } from "@/lib/config";
import { checkFeatureAccess } from "@/lib/server/plan-gate";

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
    const feature = category === "word_game" ? "wordGame" : "voiceEarn";
    const tasks = await prisma.voiceTask.findMany({
      where: { isActive: true, ...(category === "session" || category === "word_game" ? { category } : {}) },
      orderBy: { createdAt: "desc" },
    });

    const todayCounts = await prisma.voiceRecording.groupBy({
      by: ["voiceTaskId"],
      where: { userId: user.id, createdAt: { gte: startOfDay } },
      _count: { _all: true },
    });
    const countMap = new Map(todayCounts.map((c) => [c.voiceTaskId, c._count._all]));
    const multiplier = TIER_CONFIG[user.tier].dailyLimitMultiplier;
    const access = await checkFeatureAccess(user, feature);

    return NextResponse.json({
      planRequired: access.reason === "no_plan",
      needsHigherPlan: access.reason === "plan_restricted",
      tasks: access.allowed
        ? shuffle(
            tasks.map((t) => ({
              ...t,
              dailyLimit: t.dailyLimit * multiplier,
              completedToday: countMap.get(t.id) ?? 0,
            }))
          )
        : [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
