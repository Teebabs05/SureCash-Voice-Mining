import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { TIER_CONFIG } from "@/lib/config";

export async function GET() {
  try {
    const user = await requireUser();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const tasks = await prisma.voiceTask.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } });

    const todayCounts = await prisma.voiceRecording.groupBy({
      by: ["voiceTaskId"],
      where: { userId: user.id, createdAt: { gte: startOfDay } },
      _count: { _all: true },
    });
    const countMap = new Map(todayCounts.map((c) => [c.voiceTaskId, c._count._all]));
    const multiplier = TIER_CONFIG[user.tier].dailyLimitMultiplier;

    return NextResponse.json({
      tasks: tasks.map((t) => ({
        ...t,
        dailyLimit: t.dailyLimit * multiplier,
        completedToday: countMap.get(t.id) ?? 0,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
