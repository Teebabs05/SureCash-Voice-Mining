-- AlterTable
ALTER TABLE `User` ADD COLUMN `withdrawalsLocked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `withdrawalLockNote` VARCHAR(191) NULL;
