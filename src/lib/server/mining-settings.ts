import "server-only";
import { getSetting } from "@/lib/server/settings";
import { MINING_CONFIG, SETTINGS_KEYS } from "@/lib/config";

/** Base daily mining reward before streak bonus/tier multiplier — live-
 * configurable from the admin Settings page rather than a fixed constant. */
export async function getMiningBaseReward(): Promise<number> {
  return getSetting<number>(SETTINGS_KEYS.miningBaseReward, MINING_CONFIG.baseReward);
}
