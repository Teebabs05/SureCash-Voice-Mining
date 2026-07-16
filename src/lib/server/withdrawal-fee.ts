import "server-only";
import { UserTier } from "@prisma/client";
import { getSetting } from "@/lib/server/settings";
import { WITHDRAWAL_CONFIG, SETTINGS_KEYS, TIER_CONFIG } from "@/lib/config";

export async function getWithdrawalMinAmount(): Promise<number> {
  return getSetting<number>(SETTINGS_KEYS.withdrawalMinAmount, WITHDRAWAL_CONFIG.minAmount);
}

/** Base percentage fee before tier discount — live-configurable from the
 * admin Settings page rather than a fixed constant. */
export async function getBaseWithdrawalFeePercent(): Promise<number> {
  return getSetting<number>(SETTINGS_KEYS.withdrawalFeePercent, WITHDRAWAL_CONFIG.feePercent);
}

export async function getUsdtNetworkFee(): Promise<number> {
  return getSetting<number>(SETTINGS_KEYS.withdrawalUsdtNetworkFee, WITHDRAWAL_CONFIG.usdtNetworkFee);
}

export async function getUsdtNgnRate(): Promise<number> {
  return getSetting<number>(SETTINGS_KEYS.usdtNgnRate, WITHDRAWAL_CONFIG.usdtNgnRate);
}

/** Effective percentage fee for a given tier, after applying the tier's
 * relative discount to the current admin-configured base fee. */
export async function getEffectiveFeePercent(tier: UserTier): Promise<number> {
  const base = await getBaseWithdrawalFeePercent();
  return base * TIER_CONFIG[tier].withdrawalFeeMultiplier;
}
