-- CreateEnum
CREATE TYPE "PayoutProvider" AS ENUM ('MANUAL', 'PAYSTACK', 'MONNIFY', 'KORAPAY', 'PAYVESSEL');

-- AlterTable
ALTER TABLE "BankAccount" ADD COLUMN     "paystackRecipientCode" TEXT;

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "autoPayoutAttempted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoPayoutError" TEXT,
ADD COLUMN     "payoutProvider" "PayoutProvider" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "payoutReference" TEXT;
