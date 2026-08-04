-- AlterTable
ALTER TABLE `WalletTransaction` MODIFY `reason` ENUM('DAILY_MINING', 'VOICE_TASK_REWARD', 'TASK_REWARD', 'REFERRAL_BONUS', 'DEPOSIT', 'WITHDRAWAL', 'WITHDRAWAL_REVERSAL', 'ADMIN_ADJUSTMENT', 'SPIN_REWARD', 'MISSION_REWARD', 'LEVEL_UP_BONUS', 'WALLET_TRANSFER', 'PLAN_ACTIVATION', 'PLAN_COMMISSION', 'SPONSORED_POST_REWARD', 'EXTRA_SPIN_PURCHASE', 'MINING_PLAN_PURCHASE', 'MINING_PLAN_PAYOUT', 'AD_REWARD', 'BILLS_PURCHASE') NOT NULL;

-- CreateTable
CREATE TABLE `BillPurchase` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `provider` ENUM('VTU_NG', 'VTUAFRICA') NOT NULL,
    `serviceType` ENUM('AIRTIME', 'DATA', 'ELECTRICITY', 'CABLE_TV') NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `variationId` VARCHAR(191) NULL,
    `recipient` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `providerOrderId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `token` VARCHAR(191) NULL,
    `units` VARCHAR(191) NULL,
    `providerResponse` JSON NULL,
    `errorMessage` VARCHAR(191) NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BillPurchase_reference_key`(`reference`),
    INDEX `BillPurchase_userId_idx`(`userId`),
    INDEX `BillPurchase_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BillPurchase` ADD CONSTRAINT `BillPurchase_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
