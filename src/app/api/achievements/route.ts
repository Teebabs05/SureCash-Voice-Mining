import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    const all = await prisma.achievement.findMany();
    const earned = await prisma.userAchievement.findMany({ where: { userId: user.id } });
    const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));

    return NextResponse.json({
      achievements: all.map((a) => ({
        ...a,
        earned: earnedMap.has(a.id),
        earnedAt: earnedMap.get(a.id) ?? null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
