export const APP_NAME = process.env.APP_NAME ?? "SureCash Mining";

export const WALLET_TYPES = ["MAIN", "MINING", "VOICE", "REFERRAL", "TASK", "BONUS"] as const;

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
};

export const XP_CONFIG = {
  perMining: 5,
  perVoiceTask: 8,
  perTaskCenter: 10,
  perMissionClaim: 15,
};

/** Free/Silver/Gold/VIP activation tiers — multiply daily voice-task limits,
 * mining rewards, and reduce withdrawal fees as a paid-tier incentive. */
export const TIER_CONFIG = {
  FREE: { dailyLimitMultiplier: 1, miningRewardMultiplier: 1, withdrawalFeePercent: 1.5 },
  SILVER: { dailyLimitMultiplier: 3, miningRewardMultiplier: 1.1, withdrawalFeePercent: 1.2 },
  GOLD: { dailyLimitMultiplier: 6, miningRewardMultiplier: 1.25, withdrawalFeePercent: 0.8 },
  VIP: { dailyLimitMultiplier: 999, miningRewardMultiplier: 1.5, withdrawalFeePercent: 0 },
} as const;
