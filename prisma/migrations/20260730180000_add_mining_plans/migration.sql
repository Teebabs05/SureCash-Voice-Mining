-- Investment-style mining plans: distinct from the free Daily Mining claim.
-- A user buys into a MiningPlan, then earns a fixed daily payout for a set
-- number of days, after which the investment ends.

-- AlterTable: two new reasons for wallet transactions tied to this feature.
ALTER TABLE `WalletTransaction` MODIFY `reason` ENUM('DAILY_MINING', 'VOICE_TASK_REWARD', 'TASK_REWARD', 'REFERRAL_BONUS', 'DEPOSIT', 'WITHDRAWAL', 'WITHDRAWAL_REVERSAL', 'ADMIN_ADJUSTMENT', 'SPIN_REWARD', 'MISSION_REWARD', 'LEVEL_UP_BONUS', 'WALLET_TRANSFER', 'PLAN_ACTIVATION', 'PLAN_COMMISSION', 'SPONSORED_POST_REWARD', 'EXTRA_SPIN_PURCHASE', 'MINING_PLAN_PURCHASE', 'MINING_PLAN_PAYOUT') NOT NULL;

-- CreateTable
CREATE TABLE `MiningPlan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(18, 2) NOT NULL,
    `dailyReturn` DECIMAL(18, 2) NOT NULL,
    `durationDays` INTEGER NOT NULL DEFAULT 30,
    `description` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserMiningPlan` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `amountInvested` DECIMAL(18, 2) NOT NULL,
    `totalEarned` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nextPayoutAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserMiningPlan_userId_idx`(`userId`),
    INDEX `UserMiningPlan_status_idx`(`status`),
    INDEX `UserMiningPlan_nextPayoutAt_idx`(`nextPayoutAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MiningPlanPayout` (
    `id` VARCHAR(191) NOT NULL,
    `userMiningPlanId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MiningPlanPayout_userId_idx`(`userId`),
    INDEX `MiningPlanPayout_userMiningPlanId_idx`(`userMiningPlanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserMiningPlan` ADD CONSTRAINT `UserMiningPlan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserMiningPlan` ADD CONSTRAINT `UserMiningPlan_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `MiningPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MiningPlanPayout` ADD CONSTRAINT `MiningPlanPayout_userMiningPlanId_fkey` FOREIGN KEY (`userMiningPlanId`) REFERENCES `UserMiningPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
