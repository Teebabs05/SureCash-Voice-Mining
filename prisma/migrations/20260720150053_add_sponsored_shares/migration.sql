-- Add SPONSORED_POST_REWARD to the TxnReason enum used by WalletTransaction.reason
ALTER TABLE `WalletTransaction` MODIFY `reason` ENUM('DAILY_MINING', 'VOICE_TASK_REWARD', 'TASK_REWARD', 'REFERRAL_BONUS', 'DEPOSIT', 'WITHDRAWAL', 'WITHDRAWAL_REVERSAL', 'ADMIN_ADJUSTMENT', 'SPIN_REWARD', 'MISSION_REWARD', 'LEVEL_UP_BONUS', 'WALLET_TRANSFER', 'PLAN_ACTIVATION', 'PLAN_COMMISSION', 'SPONSORED_POST_REWARD') NOT NULL;

CREATE TABLE `SponsoredShare` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `platform` ENUM('FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'WHATSAPP') NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `status` ENUM('APPROVED', 'REJECTED') NOT NULL,
    `proofImageUrl` VARCHAR(191) NOT NULL,
    `proofImageHash` VARCHAR(191) NOT NULL,
    `rewardPaid` DECIMAL(18, 2) NOT NULL,
    `reviewNote` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SponsoredShare_userId_platform_date_key`(`userId`, `platform`, `date`),
    INDEX `SponsoredShare_proofImageHash_idx`(`proofImageHash`),
    INDEX `SponsoredShare_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SponsoredShare` ADD CONSTRAINT `SponsoredShare_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
