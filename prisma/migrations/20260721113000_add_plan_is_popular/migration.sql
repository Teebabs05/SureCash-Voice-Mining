-- Add a "Most popular" badge flag to Plan, shown on the Plans & Pricing page
ALTER TABLE `Plan` ADD COLUMN `isPopular` BOOLEAN NOT NULL DEFAULT false;

-- Mark Voice Starter as the popular tier by default, matching the current lineup
UPDATE `Plan` SET `isPopular` = true WHERE `name` = 'Voice Starter';
