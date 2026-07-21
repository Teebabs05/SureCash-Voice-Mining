import "server-only";
import type { Plan } from "@prisma/client";
import { getSetting } from "@/lib/server/settings";

/** Global switch (Admin > Settings > "Require active plan to earn") that
 * gates Mining, Voice Tasks (incl. Word Game), Task Center, and Sponsored
 * Posts behind having activated a paid Plan. Off by default so the app
 * stays free-to-earn until an admin opts in. */
export async function isActivePlanRequired(): Promise<boolean> {
  return getSetting("require_active_plan", false);
}

export type PlanSection = "voiceEarn" | "wordGame" | "taskCenter" | "sponsoredPosts";

const SECTION_LIMIT_FIELD: Record<PlanSection, keyof Plan> = {
  voiceEarn: "voiceEarnDailyLimit",
  wordGame: "wordGameDailyLimit",
  taskCenter: "taskCenterDailyLimit",
  sponsoredPosts: "sponsoredPostsDailyLimit",
};

/** Every plan can access every section - what differs per plan is how many
 * times per day that section can be used. Returns null for users with no
 * plan, meaning "no plan-level cap" (existing per-task/per-type limits
 * still apply as before; plans only ever add an extra ceiling on top). */
export function planSectionDailyLimit(plan: Plan | null, section: PlanSection): number | null {
  if (!plan) return null;
  return plan[SECTION_LIMIT_FIELD[section]] as number;
}
