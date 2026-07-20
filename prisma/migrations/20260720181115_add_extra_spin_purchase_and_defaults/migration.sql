-- Add EXTRA_SPIN_PURCHASE to the TxnReason enum used by WalletTransaction.reason
ALTER TABLE `WalletTransaction` MODIFY `reason` ENUM('DAILY_MINING', 'VOICE_TASK_REWARD', 'TASK_REWARD', 'REFERRAL_BONUS', 'DEPOSIT', 'WITHDRAWAL', 'WITHDRAWAL_REVERSAL', 'ADMIN_ADJUSTMENT', 'SPIN_REWARD', 'MISSION_REWARD', 'LEVEL_UP_BONUS', 'WALLET_TRANSFER', 'PLAN_ACTIVATION', 'PLAN_COMMISSION', 'SPONSORED_POST_REWARD', 'EXTRA_SPIN_PURCHASE') NOT NULL;

-- Only the labels below should ever be winnable on the spin wheel - deactivate
-- any pre-existing reward row outside this set (e.g. from old seed data)
-- rather than deleting it, since SpinHistory rows may reference it.
UPDATE `SpinReward` SET `isActive` = false
WHERE `label` NOT IN ('Try Again', '₦50 Bonus', '₦70 Bonus', '₦100 Bonus', '₦200 Bonus', '₦500 Jackpot', '₦1000 Jackpot');

-- Seed the default spin wheel (idempotent - only inserts a label that isn't
-- already present, so re-running this or editing rewards in the admin panel
-- afterwards is safe). 50/70/100/200 together make up exactly a 10% chance
-- to win per spin (weighted toward the smaller amounts); 500 and 1000 are
-- shown on the wheel but carry zero weight, so they can never actually be
-- won; the remaining 90% lands on "Try Again".
INSERT INTO `SpinReward` (`id`, `label`, `amount`, `wallet`, `weight`, `colorHex`, `isActive`)
SELECT UUID(), 'Try Again', 0, 'ENGAGEMENT', 900, '#94A3B8', true
WHERE NOT EXISTS (SELECT 1 FROM `SpinReward` WHERE `label` = 'Try Again');

INSERT INTO `SpinReward` (`id`, `label`, `amount`, `wallet`, `weight`, `colorHex`, `isActive`)
SELECT UUID(), '₦50 Bonus', 50, 'ENGAGEMENT', 40, '#0D8A82', true
WHERE NOT EXISTS (SELECT 1 FROM `SpinReward` WHERE `label` = '₦50 Bonus');

INSERT INTO `SpinReward` (`id`, `label`, `amount`, `wallet`, `weight`, `colorHex`, `isActive`)
SELECT UUID(), '₦70 Bonus', 70, 'ENGAGEMENT', 30, '#2563EB', true
WHERE NOT EXISTS (SELECT 1 FROM `SpinReward` WHERE `label` = '₦70 Bonus');

INSERT INTO `SpinReward` (`id`, `label`, `amount`, `wallet`, `weight`, `colorHex`, `isActive`)
SELECT UUID(), '₦100 Bonus', 100, 'ENGAGEMENT', 20, '#F5A623', true
WHERE NOT EXISTS (SELECT 1 FROM `SpinReward` WHERE `label` = '₦100 Bonus');

INSERT INTO `SpinReward` (`id`, `label`, `amount`, `wallet`, `weight`, `colorHex`, `isActive`)
SELECT UUID(), '₦200 Bonus', 200, 'ENGAGEMENT', 10, '#12B76A', true
WHERE NOT EXISTS (SELECT 1 FROM `SpinReward` WHERE `label` = '₦200 Bonus');

INSERT INTO `SpinReward` (`id`, `label`, `amount`, `wallet`, `weight`, `colorHex`, `isActive`)
SELECT UUID(), '₦500 Jackpot', 500, 'ENGAGEMENT', 0, '#E2497A', true
WHERE NOT EXISTS (SELECT 1 FROM `SpinReward` WHERE `label` = '₦500 Jackpot');

INSERT INTO `SpinReward` (`id`, `label`, `amount`, `wallet`, `weight`, `colorHex`, `isActive`)
SELECT UUID(), '₦1000 Jackpot', 1000, 'ENGAGEMENT', 0, '#7C3AED', true
WHERE NOT EXISTS (SELECT 1 FROM `SpinReward` WHERE `label` = '₦1000 Jackpot');
