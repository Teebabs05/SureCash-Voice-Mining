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

const SESSION_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pcm", label: "Pidgin" },
  { code: "fr", label: "French" },
  { code: "yo", label: "Yoruba" },
  { code: "ha", label: "Hausa" },
  { code: "ig", label: "Igbo" },
];

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const category = req.nextUrl.searchParams.get("category");
    const resolvedCategory = category === "word_game" ? "word_game" : "session";
    const language = req.nextUrl.searchParams.get("language");

    const [planRequired, plan] = await Promise.all([
      isActivePlanRequired().then((required) => required && !user.planId),
      user.planId ? prisma.plan.findUnique({ where: { id: user.planId } }) : null,
    ]);

    // Voice Earn (session) is per-language: its daily plan limit applies
    // separately to each of the 6 languages, not as one shared total. With
    // no language chosen yet, return a per-language summary so the frontend
    // can show a language picker instead of a flat cross-language list.
    if (resolvedCategory === "session" && !language) {
      const sectionDailyLimit = planSectionDailyLimit(plan, "voiceEarn");
      const todayRecordings = await prisma.voiceRecording.findMany({
        where: { userId: user.id, createdAt: { gte: startOfDay }, voiceTask: { category: "session" } },
        select: { voiceTask: { select: { language: true } } },
      });
      const completedByLanguage = new Map<string, number>();
      for (const r of todayRecordings) {
        completedByLanguage.set(r.voiceTask.language, (completedByLanguage.get(r.voiceTask.language) ?? 0) + 1);
      }

      return NextResponse.json({
        planRequired,
        languages: SESSION_LANGUAGES.map(({ code, label }) => {
          const completedToday = completedByLanguage.get(code) ?? 0;
          return {
            code,
            label,
            sectionDailyLimit,
            completedToday,
            limitReached: sectionDailyLimit !== null && completedToday >= sectionDailyLimit,
          };
        }),
      });
    }

    const section = resolvedCategory === "word_game" ? "wordGame" : "voiceEarn";
    const languageFilter = resolvedCategory === "session" && language ? { language } : {};
    const tasks = await prisma.voiceTask.findMany({
      where: { isActive: true, category: resolvedCategory, ...languageFilter },
      orderBy: { createdAt: "desc" },
    });

    const [todayCounts, sectionCompletedToday] = await Promise.all([
      prisma.voiceRecording.groupBy({
        by: ["voiceTaskId"],
        where: { userId: user.id, createdAt: { gte: startOfDay } },
        _count: { _all: true },
      }),
      prisma.voiceRecording.count({
        where: { userId: user.id, createdAt: { gte: startOfDay }, voiceTask: { category: resolvedCategory, ...languageFilter } },
      }),
    ]);
    const countMap = new Map(todayCounts.map((c) => [c.voiceTaskId, c._count._all]));
    const multiplier = TIER_CONFIG[user.tier].dailyLimitMultiplier;
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
