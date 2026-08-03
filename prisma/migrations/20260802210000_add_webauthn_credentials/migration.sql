-- Biometric/passkey login (WebAuthn discoverable credentials).

-- CreateTable
CREATE TABLE `WebAuthnCredential` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `credentialId` VARCHAR(191) NOT NULL,
    `publicKey` VARCHAR(191) NOT NULL,
    `counter` INTEGER NOT NULL DEFAULT 0,
    `deviceLabel` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUsedAt` DATETIME(3) NULL,

    UNIQUE INDEX `WebAuthnCredential_credentialId_key`(`credentialId`),
    INDEX `WebAuthnCredential_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WebAuthnCredential` ADD CONSTRAINT `WebAuthnCredential_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
