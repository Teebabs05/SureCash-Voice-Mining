-- AlterTable
ALTER TABLE "Deposit" ADD COLUMN     "receiptHash" TEXT;

-- AlterTable
ALTER TABLE "UserTaskCompletion" ADD COLUMN     "proofImageHash" TEXT,
ADD COLUMN     "proofImageUrl" TEXT;

-- CreateIndex
CREATE INDEX "Deposit_receiptHash_idx" ON "Deposit"("receiptHash");

-- CreateIndex
CREATE INDEX "UserTaskCompletion_proofImageHash_idx" ON "UserTaskCompletion"("proofImageHash");
