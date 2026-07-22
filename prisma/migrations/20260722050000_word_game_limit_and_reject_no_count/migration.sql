-- Bring Word Game's daily limit progression in line with Voice Earn's new
-- per-attempt numbers (previously 2/4/6/10, now matching 3/6/9/15).
UPDATE `Plan` SET `wordGameDailyLimit` = 3 WHERE `name` = 'Voice Lite';
UPDATE `Plan` SET `wordGameDailyLimit` = 6 WHERE `name` = 'Voice Starter';
UPDATE `Plan` SET `wordGameDailyLimit` = 9 WHERE `name` = 'Voice Pro';
UPDATE `Plan` SET `wordGameDailyLimit` = 15 WHERE `name` = 'Audio Elite';
-- Prime Artiste keeps its 9999 ("unlimited") default.

-- No schema change needed for the "don't count rejected/mismatched
-- submissions against the daily limit" fix - that's a query-logic change
-- in the app code only (VoiceRecording.status = 'APPROVED' filter).
