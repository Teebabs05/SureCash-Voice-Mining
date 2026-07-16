import "server-only";
import { getSetting } from "@/lib/server/settings";
import { REFERRAL_CONFIG, SETTINGS_KEYS } from "@/lib/config";

/** Flat signup bonus paid to a referrer once their referred user verifies
 * their email — live-configurable from the admin Settings page. */
export async function getReferralSignupBonus(): Promise<number> {
  return getSetting<number>(SETTINGS_KEYS.referralSignupBonus, REFERRAL_CONFIG.signupBonus);
}
