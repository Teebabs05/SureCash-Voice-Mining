import "server-only";
import { getSetting } from "@/lib/server/settings";

/** Global switch (Admin > Settings > "Require active plan to earn") that
 * gates Mining, Voice Tasks (incl. Word Game), Task Center, and Sponsored
 * Posts behind having activated a paid Plan. Off by default so the app
 * stays free-to-earn until an admin opts in. */
export async function isActivePlanRequired(): Promise<boolean> {
  return getSetting("require_active_plan", false);
}
