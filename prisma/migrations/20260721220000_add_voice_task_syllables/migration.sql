-- Add an optional syllable-hyphenation hint, shown under the word in Word
-- Game to help pronunciation (e.g. "Op-por-tu-ni-ty").
ALTER TABLE `VoiceTask` ADD COLUMN `syllables` VARCHAR(191) NULL;

-- Backfill the existing seed word
UPDATE `VoiceTask` SET `syllables` = 'Op-por-tu-ni-ty'
WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: opportunity';

-- Round out the Word Game word bank - previously there was only one word,
-- which made the Skip button a no-op (nothing else to switch to).
INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: beautiful', 'en', 'word_game', 'Beau-ti-ful', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: beautiful');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: celebration', 'en', 'word_game', 'Cel-e-bra-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: celebration');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: community', 'en', 'word_game', 'Com-mu-ni-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: community');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: generation', 'en', 'word_game', 'Gen-er-a-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: generation');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: important', 'en', 'word_game', 'Im-por-tant', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: important');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: technology', 'en', 'word_game', 'Tech-nol-o-gy', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: technology');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: consistency', 'en', 'word_game', 'Con-sis-ten-cy', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: consistency');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: entertainment', 'en', 'word_game', 'En-ter-tain-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: entertainment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: responsibility', 'en', 'word_game', 'Re-spon-si-bil-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: responsibility');
