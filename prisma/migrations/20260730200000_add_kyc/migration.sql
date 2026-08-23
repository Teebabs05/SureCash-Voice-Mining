-- KYC document upload/review, mirroring the old system's users.kyc_status
-- + kyc_documents table.

-- AlterTable
ALTER TABLE `User` ADD COLUMN `kycStatus` ENUM('UNVERIFIED', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'UNVERIFIED';

-- CreateTable
CREATE TABLE `KycDocument` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `status` ENUM('UNVERIFIED', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `adminNote` VARCHAR(191) NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `KycDocument_userId_idx`(`userId`),
    INDEX `KycDocument_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `KycDocument` ADD CONSTRAINT `KycDocument_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
