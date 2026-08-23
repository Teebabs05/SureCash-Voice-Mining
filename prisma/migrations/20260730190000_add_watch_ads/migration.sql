-- Watch-ads-to-earn: a simple timed placeholder activity, matching the
-- daily-limit-per-plan pattern used by the other Ways to Earn sections.

-- AlterTable
ALTER TABLE `Plan` ADD COLUMN `watchAdsDailyLimit` INT NOT NULL DEFAULT 9999;

-- AlterTable: add AD_REWARD to the TxnReason enum used by WalletTransaction.reason
ALTER TABLE `WalletTransaction` MODIFY `reason` ENUM('DAILY_MINING', 'VOICE_TASK_REWARD', 'TASK_REWARD', 'REFERRAL_BONUS', 'DEPOSIT', 'WITHDRAWAL', 'WITHDRAWAL_REVERSAL', 'ADMIN_ADJUSTMENT', 'SPIN_REWARD', 'MISSION_REWARD', 'LEVEL_UP_BONUS', 'WALLET_TRANSFER', 'PLAN_ACTIVATION', 'PLAN_COMMISSION', 'SPONSORED_POST_REWARD', 'EXTRA_SPIN_PURCHASE', 'MINING_PLAN_PURCHASE', 'MINING_PLAN_PAYOUT', 'AD_REWARD') NOT NULL;

-- CreateTable
CREATE TABLE `AdWatch` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `rewardAmount` DECIMAL(18, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AdWatch_userId_idx`(`userId`),
    INDEX `AdWatch_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AdWatch` ADD CONSTRAINT `AdWatch_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
