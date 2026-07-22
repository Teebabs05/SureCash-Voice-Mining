-- Cap Lucky Spin at a per-plan daily limit, same pattern as the other
-- sections (Voice Earn, Word Game, Task Center, Sponsored Posts) - counts
-- every spin that day (free + paid) toward the cap.
ALTER TABLE `Plan` ADD COLUMN `spinDailyLimit` INT NOT NULL DEFAULT 9999;

UPDATE `Plan` SET `spinDailyLimit` = 20 WHERE `name` = 'Voice Lite';
UPDATE `Plan` SET `spinDailyLimit` = 40 WHERE `name` = 'Voice Starter';
UPDATE `Plan` SET `spinDailyLimit` = 60 WHERE `name` = 'Voice Pro';
UPDATE `Plan` SET `spinDailyLimit` = 100 WHERE `name` = 'Audio Elite';
-- Prime Artiste keeps the 9999 ("unlimited") default set above.
