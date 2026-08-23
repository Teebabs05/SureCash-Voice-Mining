-- Per-plan feature access flags - which earning activities each plan
-- actually unlocks, independent of its reward rates. Default true so
-- existing plans keep unlocking everything until an admin restricts one.
ALTER TABLE `Plan`
  ADD COLUMN `voiceEarnEnabled` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `wordGameEnabled` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `taskCenterEnabled` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `sponsoredPostsEnabled` BOOLEAN NOT NULL DEFAULT true;
