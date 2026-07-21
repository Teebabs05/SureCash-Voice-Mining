-- Replace the per-plan on/off feature flags with per-plan daily quantity
-- caps - every plan can access every activity (Voice Earn, Word Game, Task
-- Center, Sponsored Posts); what differs per plan is how many times per day
-- each section can be used.
ALTER TABLE `Plan`
  DROP COLUMN `voiceEarnEnabled`,
  DROP COLUMN `wordGameEnabled`,
  DROP COLUMN `taskCenterEnabled`,
  DROP COLUMN `sponsoredPostsEnabled`;

ALTER TABLE `Plan`
  ADD COLUMN `voiceEarnDailyLimit` INT NOT NULL DEFAULT 9999,
  ADD COLUMN `wordGameDailyLimit` INT NOT NULL DEFAULT 9999,
  ADD COLUMN `taskCenterDailyLimit` INT NOT NULL DEFAULT 9999,
  ADD COLUMN `sponsoredPostsDailyLimit` INT NOT NULL DEFAULT 9999;

-- Seed a starter progression across the existing lineup - purely a
-- starting point, fully adjustable afterwards from Admin > Plans.
UPDATE `Plan` SET `voiceEarnDailyLimit` = 2, `wordGameDailyLimit` = 2, `taskCenterDailyLimit` = 2, `sponsoredPostsDailyLimit` = 2 WHERE `name` = 'Voice Lite';
UPDATE `Plan` SET `voiceEarnDailyLimit` = 4, `wordGameDailyLimit` = 4, `taskCenterDailyLimit` = 4, `sponsoredPostsDailyLimit` = 4 WHERE `name` = 'Voice Starter';
UPDATE `Plan` SET `voiceEarnDailyLimit` = 6, `wordGameDailyLimit` = 6, `taskCenterDailyLimit` = 6, `sponsoredPostsDailyLimit` = 4 WHERE `name` = 'Voice Pro';
UPDATE `Plan` SET `voiceEarnDailyLimit` = 10, `wordGameDailyLimit` = 10, `taskCenterDailyLimit` = 10, `sponsoredPostsDailyLimit` = 4 WHERE `name` = 'Audio Elite';
-- Prime Artiste keeps the 9999 ("unlimited") default set above.
