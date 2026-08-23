-- "Join our community" prompt tracking, task-proof manual review queue,
-- and recording which wallet a withdrawal was funded from.

-- AlterTable
ALTER TABLE `User` ADD COLUMN `communityPromptSeenAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `UserTaskCompletion`
  ADD COLUMN `reviewedAt` DATETIME(3) NULL,
  ADD COLUMN `reviewedById` VARCHAR(191) NULL,
  ADD COLUMN `adminNote` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `UserTaskCompletion_status_idx` ON `UserTaskCompletion`(`status`);

-- AlterTable
ALTER TABLE `Withdrawal` ADD COLUMN `walletType` ENUM('MAIN', 'ENGAGEMENT', 'SALES') NOT NULL DEFAULT 'ENGAGEMENT';
