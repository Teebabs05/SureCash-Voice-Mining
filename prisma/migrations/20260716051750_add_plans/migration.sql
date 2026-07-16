-- AlterTable
ALTER TABLE "User" ADD COLUMN     "planActivatedAt" TIMESTAMP(3),
ADD COLUMN     "planId" TEXT;

-- AlterTable
ALTER TABLE "VoiceTask" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'session';

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "voiceSessionReward" DECIMAL(18,2) NOT NULL,
    "wordGameReward" DECIMAL(18,2) NOT NULL,
    "sponsoredPostReward" DECIMAL(18,2) NOT NULL,
    "taskReward" DECIMAL(18,2) NOT NULL,
    "referralCommission" DECIMAL(18,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
