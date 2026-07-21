import "server-only";
import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/server/settings";

/** Global switch (Admin > Settings > "Require active plan to earn") that
 * gates Mining, Voice Tasks (incl. Word Game), Task Center, and Sponsored
 * Posts behind having activated a paid Plan. Off by default so the app
 * stays free-to-earn until an admin opts in. */
export async function isActivePlanRequired(): Promise<boolean> {
  return getSetting("require_active_plan", false);
}

export type PlanFeature = "voiceEarn" | "wordGame" | "taskCenter" | "sponsoredPosts";

const FEATURE_FLAG: Record<PlanFeature, keyof Plan> = {
  voiceEarn: "voiceEarnEnabled",
  wordGame: "wordGameEnabled",
  taskCenter: "taskCenterEnabled",
  sponsoredPosts: "sponsoredPostsEnabled",
};

export type FeatureAccessReason = "ok" | "no_plan" | "plan_restricted";

/** Pure check against an already-fetched plan (or null) - use this when the
 * caller already loaded the plan for reward-rate purposes, to avoid a
 * second query. */
export function planAllowsFeature(plan: Plan | null, feature: PlanFeature): boolean {
  if (!plan) return true; // no per-plan restriction applies when there's no plan at all
  return Boolean(plan[FEATURE_FLAG[feature]]);
}

/** Full access check for a feature: is a plan required at all, and if the
 * user has one, does it include this specific feature. Fetches the plan
 * itself, so prefer `planAllowsFeature` if the caller already has it. */
export async function checkFeatureAccess(
  user: { planId: string | null },
  feature: PlanFeature
): Promise<{ allowed: boolean; reason: FeatureAccessReason }> {
  const required = await isActivePlanRequired();
  if (!user.planId) {
    return required ? { allowed: false, reason: "no_plan" } : { allowed: true, reason: "ok" };
  }
  const plan = await prisma.plan.findUnique({ where: { id: user.planId } });
  if (!plan) return required ? { allowed: false, reason: "no_plan" } : { allowed: true, reason: "ok" };
  return planAllowsFeature(plan, feature) ? { allowed: true, reason: "ok" } : { allowed: false, reason: "plan_restricted" };
}
