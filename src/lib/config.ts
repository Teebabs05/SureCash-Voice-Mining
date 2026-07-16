export const APP_NAME = process.env.APP_NAME ?? "SureCash Mining";

export const WALLET_TYPES = ["MAIN", "ENGAGEMENT", "SALES"] as const;

export const MINING_CONFIG = {
  baseReward: 10,
  streakBonusPerDay: 1,
  maxStreakBonus: 20,
  cooldownHours: 24,
  streakMilestones: [
    { day: 7, bonus: 100 },
    { day: 30, bonus: 1000 },
  ],
};

export const REFERRAL_CONFIG = {
  signupBonus: 50,
  commissionPercent: 10,
};

export const WITHDRAWAL_CONFIG = {
  minAmount: 500,
  feePercent: 1.5,
  usdtNetworkFee: 500,
  usdtNgnRate: 1500,
};

/** Admin Settings keys that override the defaults above at runtime. */
export const SETTINGS_KEYS = {
  withdrawalFeePercent: "withdrawal_fee_percent",
  withdrawalMinAmount: "withdrawal_min_amount",
  withdrawalUsdtNetworkFee: "withdrawal_usdt_network_fee",
  usdtNgnRate: "usdt_ngn_rate",
  miningBaseReward: "mining_base_reward",
  referralSignupBonus: "referral_signup_bonus",
} as const;

export const XP_CONFIG = {
  perMining: 5,
  perVoiceTask: 8,
  perTaskCenter: 10,
  perMissionClaim: 15,
};

/** Free/Silver/Gold/VIP activation tiers — multiply daily voice-task limits
 * and mining rewards, and discount withdrawal fees as a paid-tier
 * incentive. withdrawalFeeMultiplier is relative to the admin-configurable
 * base withdrawal fee percent (see SETTINGS_KEYS.withdrawalFeePercent), so
 * changing the base fee in Settings scales every tier's fee proportionally. */
export const TIER_CONFIG = {
  FREE: { dailyLimitMultiplier: 1, miningRewardMultiplier: 1, withdrawalFeeMultiplier: 1 },
  SILVER: { dailyLimitMultiplier: 3, miningRewardMultiplier: 1.1, withdrawalFeeMultiplier: 0.8 },
  GOLD: { dailyLimitMultiplier: 6, miningRewardMultiplier: 1.25, withdrawalFeeMultiplier: 0.53 },
  VIP: { dailyLimitMultiplier: 999, miningRewardMultiplier: 1.5, withdrawalFeeMultiplier: 0 },
} as const;
