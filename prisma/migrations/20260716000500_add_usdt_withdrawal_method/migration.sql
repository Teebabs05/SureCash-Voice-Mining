-- CreateEnum
CREATE TYPE "WithdrawalMethod" AS ENUM ('BANK', 'USDT');

-- CreateEnum
CREATE TYPE "CryptoNetwork" AS ENUM ('TRC20', 'ERC20', 'BEP20');

-- DropForeignKey
ALTER TABLE "Withdrawal" DROP CONSTRAINT "Withdrawal_bankAccountId_fkey";

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "cryptoWalletId" TEXT,
ADD COLUMN     "method" "WithdrawalMethod" NOT NULL DEFAULT 'BANK',
ADD COLUMN     "usdtAmount" DECIMAL(18,2),
ALTER COLUMN "bankAccountId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CryptoWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "network" "CryptoNetwork" NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CryptoWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CryptoWallet_userId_address_network_key" ON "CryptoWallet"("userId", "address", "network");

-- AddForeignKey
ALTER TABLE "CryptoWallet" ADD CONSTRAINT "CryptoWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_cryptoWalletId_fkey" FOREIGN KEY ("cryptoWalletId") REFERENCES "CryptoWallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
