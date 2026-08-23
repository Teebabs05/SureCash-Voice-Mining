import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { dateOnlyKey } from "@/lib/server/gamification";

export async function GET() {
  try {
    const user = await requireUser();
    const today = dateOnlyKey();

    const missions = await prisma.dailyMission.findMany({ where: { isActive: true } });
    const progress = await prisma.userMissionProgress.findMany({
      where: { userId: user.id, date: today },
    });
    const progressMap = new Map(progress.map((p) => [p.missionId, p]));

    return NextResponse.json({
      missions: missions.map((m) => ({
        ...m,
        progress: progressMap.get(m.id)?.progress ?? 0,
        completed: progressMap.get(m.id)?.completed ?? false,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
