-- Voice Lite's Voice Earn daily limit goes from 2/day to 5/day.
UPDATE `Plan` SET `voiceEarnDailyLimit` = 5 WHERE `name` = 'Voice Lite';
