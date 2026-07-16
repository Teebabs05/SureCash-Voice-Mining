-- Shrink WalletType down to MAIN/ENGAGEMENT/SALES. Postgres can't remove
-- enum values in place, so recreate the type and swap columns over. Must
-- run after the data migration that moves every row off the values being
-- removed here (MINING/VOICE/REFERRAL/TASK/BONUS).

CREATE TYPE "WalletType_new" AS ENUM ('MAIN', 'ENGAGEMENT', 'SALES');

ALTER TABLE "Wallet" ALTER COLUMN "type" TYPE "WalletType_new" USING ("type"::text::"WalletType_new");

ALTER TABLE "DailyMission" ALTER COLUMN "rewardWallet" DROP DEFAULT;
ALTER TABLE "DailyMission" ALTER COLUMN "rewardWallet" TYPE "WalletType_new" USING ("rewardWallet"::text::"WalletType_new");
ALTER TABLE "DailyMission" ALTER COLUMN "rewardWallet" SET DEFAULT 'ENGAGEMENT'::"WalletType_new";

ALTER TABLE "SpinReward" ALTER COLUMN "wallet" DROP DEFAULT;
ALTER TABLE "SpinReward" ALTER COLUMN "wallet" TYPE "WalletType_new" USING ("wallet"::text::"WalletType_new");
ALTER TABLE "SpinReward" ALTER COLUMN "wallet" SET DEFAULT 'ENGAGEMENT'::"WalletType_new";

ALTER TABLE "PromoCode" ALTER COLUMN "wallet" DROP DEFAULT;
ALTER TABLE "PromoCode" ALTER COLUMN "wallet" TYPE "WalletType_new" USING ("wallet"::text::"WalletType_new");
ALTER TABLE "PromoCode" ALTER COLUMN "wallet" SET DEFAULT 'ENGAGEMENT'::"WalletType_new";

DROP TYPE "WalletType";
ALTER TYPE "WalletType_new" RENAME TO "WalletType";
