-- Voice Earn's daily limit is now applied per language (6 languages), not as
-- a single shared total across all of them - re-set the progression
-- accordingly. This supersedes the "5" value set by the prior migration
-- (20260722033000_voice_lite_voice_earn_limit), which was under the old
-- "total across all languages" semantics.
UPDATE `Plan` SET `voiceEarnDailyLimit` = 3 WHERE `name` = 'Voice Lite';
UPDATE `Plan` SET `voiceEarnDailyLimit` = 6 WHERE `name` = 'Voice Starter';
UPDATE `Plan` SET `voiceEarnDailyLimit` = 9 WHERE `name` = 'Voice Pro';
UPDATE `Plan` SET `voiceEarnDailyLimit` = 15 WHERE `name` = 'Audio Elite';
-- Prime Artiste keeps its 9999 ("unlimited") default.
