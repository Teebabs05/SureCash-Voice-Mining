ALTER TABLE `BankAccount`
    ADD COLUMN `reviewedAt` DATETIME(3) NULL,
    ADD COLUMN `reviewedById` VARCHAR(191) NULL,
    ADD COLUMN `reviewNote` VARCHAR(191) NULL;
