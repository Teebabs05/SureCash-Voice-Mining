-- Round out the Word Game word bank further, per request - up to 200 total words.
-- Each insert is guarded so this is safe to run more than once.

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: wonderful', 'en', 'word_game', 'Won-der-ful', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: wonderful');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: happiness', 'en', 'word_game', 'Hap-pi-ness', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: happiness');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: adventure', 'en', 'word_game', 'Ad-ven-ture', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: adventure');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: cucumber', 'en', 'word_game', 'Cu-cum-ber', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: cucumber');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: dinosaur', 'en', 'word_game', 'Di-no-saur', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: dinosaur');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: elephant', 'en', 'word_game', 'El-e-phant', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: elephant');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: calendar', 'en', 'word_game', 'Cal-en-dar', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: calendar');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: umbrella', 'en', 'word_game', 'Um-brel-la', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: umbrella');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: chocolate', 'en', 'word_game', 'Choc-o-late', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: chocolate');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: hospital', 'en', 'word_game', 'Hos-pi-tal', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: hospital');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: computer', 'en', 'word_game', 'Com-pu-ter', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: computer');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: furniture', 'en', 'word_game', 'Fur-ni-ture', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: furniture');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: vacation', 'en', 'word_game', 'Va-ca-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: vacation');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: medicine', 'en', 'word_game', 'Med-i-cine', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: medicine');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: newspaper', 'en', 'word_game', 'News-pa-per', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: newspaper');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: telephone', 'en', 'word_game', 'Tel-e-phone', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: telephone');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: beginning', 'en', 'word_game', 'Be-gin-ning', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: beginning');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: yesterday', 'en', 'word_game', 'Yes-ter-day', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: yesterday');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: tomorrow', 'en', 'word_game', 'To-mor-row', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: tomorrow');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: afternoon', 'en', 'word_game', 'Af-ter-noon', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: afternoon');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: breakfast', 'en', 'word_game', 'Break-fast', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: breakfast');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: surprise', 'en', 'word_game', 'Sur-prise', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: surprise');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: remember', 'en', 'word_game', 'Re-mem-ber', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: remember');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: together', 'en', 'word_game', 'To-geth-er', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: together');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: favorite', 'en', 'word_game', 'Fa-vor-ite', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: favorite');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: building', 'en', 'word_game', 'Build-ing', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: building');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: business', 'en', 'word_game', 'Busi-ness', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: business');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: children', 'en', 'word_game', 'Chil-dren', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: children');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: exercise', 'en', 'word_game', 'Ex-er-cise', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: exercise');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: neighbor', 'en', 'word_game', 'Neigh-bor', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: neighbor');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: holiday', 'en', 'word_game', 'Hol-i-day', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: holiday');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: birthday', 'en', 'word_game', 'Birth-day', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: birthday');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: sandwich', 'en', 'word_game', 'Sand-wich', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: sandwich');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: mountain', 'en', 'word_game', 'Moun-tain', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: mountain');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: sunshine', 'en', 'word_game', 'Sun-shine', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: sunshine');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: rainbow', 'en', 'word_game', 'Rain-bow', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: rainbow');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: blanket', 'en', 'word_game', 'Blan-ket', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: blanket');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: kitchen', 'en', 'word_game', 'Kitch-en', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: kitchen');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: pillow', 'en', 'word_game', 'Pil-low', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: pillow');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: window', 'en', 'word_game', 'Win-dow', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: window');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: education', 'en', 'word_game', 'Ed-u-ca-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: education');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: information', 'en', 'word_game', 'In-for-ma-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: information');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: imagination', 'en', 'word_game', 'Im-ag-i-na-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: imagination');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: congratulations', 'en', 'word_game', 'Con-grat-u-la-tions', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: congratulations');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: determination', 'en', 'word_game', 'De-ter-mi-na-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: determination');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: organization', 'en', 'word_game', 'Or-gan-i-za-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: organization');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: communication', 'en', 'word_game', 'Com-mu-ni-ca-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: communication');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: examination', 'en', 'word_game', 'Ex-am-i-na-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: examination');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: explanation', 'en', 'word_game', 'Ex-pla-na-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: explanation');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: transportation', 'en', 'word_game', 'Trans-por-ta-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: transportation');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: environment', 'en', 'word_game', 'En-vi-ron-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: environment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: government', 'en', 'word_game', 'Gov-ern-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: government');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: development', 'en', 'word_game', 'De-vel-op-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: development');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: investment', 'en', 'word_game', 'In-vest-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: investment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: achievement', 'en', 'word_game', 'A-chieve-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: achievement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: improvement', 'en', 'word_game', 'Im-prove-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: improvement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: requirement', 'en', 'word_game', 'Re-quire-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: requirement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: agreement', 'en', 'word_game', 'A-gree-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: agreement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: movement', 'en', 'word_game', 'Move-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: movement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: statement', 'en', 'word_game', 'State-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: statement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: treatment', 'en', 'word_game', 'Treat-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: treatment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: equipment', 'en', 'word_game', 'E-quip-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: equipment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: instrument', 'en', 'word_game', 'In-stru-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: instrument');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: document', 'en', 'word_game', 'Doc-u-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: document');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: moment', 'en', 'word_game', 'Mo-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: moment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: comment', 'en', 'word_game', 'Com-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: comment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: element', 'en', 'word_game', 'El-e-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: element');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: compliment', 'en', 'word_game', 'Com-pli-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: compliment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: experiment', 'en', 'word_game', 'Ex-per-i-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: experiment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: apartment', 'en', 'word_game', 'A-part-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: apartment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: department', 'en', 'word_game', 'De-part-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: department');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: appointment', 'en', 'word_game', 'Ap-point-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: appointment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: disappointment', 'en', 'word_game', 'Dis-ap-point-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: disappointment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: management', 'en', 'word_game', 'Man-age-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: management');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: arrangement', 'en', 'word_game', 'Ar-range-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: arrangement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: announcement', 'en', 'word_game', 'An-nounce-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: announcement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: replacement', 'en', 'word_game', 'Re-place-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: replacement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: enhancement', 'en', 'word_game', 'En-hance-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: enhancement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: involvement', 'en', 'word_game', 'In-volve-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: involvement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: settlement', 'en', 'word_game', 'Set-tle-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: settlement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: advertisement', 'en', 'word_game', 'Ad-ver-tise-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: advertisement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: amusement', 'en', 'word_game', 'A-muse-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: amusement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: excitement', 'en', 'word_game', 'Ex-cite-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: excitement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: engagement', 'en', 'word_game', 'En-gage-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: engagement');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: punishment', 'en', 'word_game', 'Pun-ish-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: punishment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: establishment', 'en', 'word_game', 'Es-tab-lish-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: establishment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: accomplishment', 'en', 'word_game', 'Ac-com-plish-ment', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: accomplishment');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: understanding', 'en', 'word_game', 'Un-der-stand-ing', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: understanding');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: relationship', 'en', 'word_game', 'Re-la-tion-ship', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: relationship');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: friendship', 'en', 'word_game', 'Friend-ship', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: friendship');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: leadership', 'en', 'word_game', 'Lead-er-ship', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: leadership');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: citizenship', 'en', 'word_game', 'Cit-i-zen-ship', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: citizenship');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: membership', 'en', 'word_game', 'Mem-ber-ship', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: membership');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: partnership', 'en', 'word_game', 'Part-ner-ship', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: partnership');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: ownership', 'en', 'word_game', 'Own-er-ship', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: ownership');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: scholarship', 'en', 'word_game', 'Schol-ar-ship', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: scholarship');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: championship', 'en', 'word_game', 'Cham-pi-on-ship', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: championship');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: possibility', 'en', 'word_game', 'Pos-si-bil-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: possibility');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: availability', 'en', 'word_game', 'A-vail-a-bil-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: availability');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: capability', 'en', 'word_game', 'Ca-pa-bil-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: capability');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: flexibility', 'en', 'word_game', 'Flex-i-bil-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: flexibility');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: reliability', 'en', 'word_game', 'Re-li-a-bil-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: reliability');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: probability', 'en', 'word_game', 'Prob-a-bil-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: probability');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: accountability', 'en', 'word_game', 'Ac-count-a-bil-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: accountability');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: sustainability', 'en', 'word_game', 'Sus-tain-a-bil-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: sustainability');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: accessibility', 'en', 'word_game', 'Ac-ces-si-bil-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: accessibility');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: compatibility', 'en', 'word_game', 'Com-pat-i-bil-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: compatibility');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: creativity', 'en', 'word_game', 'Cre-a-tiv-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: creativity');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: productivity', 'en', 'word_game', 'Pro-duc-tiv-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: productivity');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: university', 'en', 'word_game', 'U-ni-ver-si-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: university');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: curiosity', 'en', 'word_game', 'Cu-ri-os-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: curiosity');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: generosity', 'en', 'word_game', 'Gen-er-os-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: generosity');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: security', 'en', 'word_game', 'Se-cu-ri-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: security');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: authority', 'en', 'word_game', 'Au-thor-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: authority');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: majority', 'en', 'word_game', 'Ma-jor-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: majority');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: minority', 'en', 'word_game', 'Mi-nor-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: minority');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: priority', 'en', 'word_game', 'Pri-or-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: priority');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: quality', 'en', 'word_game', 'Qual-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: quality');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: quantity', 'en', 'word_game', 'Quan-ti-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: quantity');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: reality', 'en', 'word_game', 'Re-al-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: reality');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: personality', 'en', 'word_game', 'Per-son-al-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: personality');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: nationality', 'en', 'word_game', 'Na-tion-al-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: nationality');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: originality', 'en', 'word_game', 'O-rig-i-nal-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: originality');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: individuality', 'en', 'word_game', 'In-di-vid-u-al-i-ty', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: individuality');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: biology', 'en', 'word_game', 'Bi-ol-o-gy', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: biology');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: psychology', 'en', 'word_game', 'Psy-chol-o-gy', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: psychology');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: geography', 'en', 'word_game', 'Ge-og-ra-phy', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: geography');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: photography', 'en', 'word_game', 'Pho-tog-ra-phy', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: photography');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: philosophy', 'en', 'word_game', 'Phi-los-o-phy', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: philosophy');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: economy', 'en', 'word_game', 'E-con-o-my', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: economy');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: democracy', 'en', 'word_game', 'De-moc-ra-cy', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: democracy');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: energy', 'en', 'word_game', 'En-er-gy', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: energy');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: strategy', 'en', 'word_game', 'Strat-e-gy', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: strategy');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: category', 'en', 'word_game', 'Cat-e-go-ry', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: category');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: laboratory', 'en', 'word_game', 'Lab-o-ra-to-ry', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: laboratory');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: dictionary', 'en', 'word_game', 'Dic-tion-ar-y', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: dictionary');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: anniversary', 'en', 'word_game', 'An-ni-ver-sa-ry', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: anniversary');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: necessary', 'en', 'word_game', 'Nec-es-sar-y', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: necessary');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: temporary', 'en', 'word_game', 'Tem-po-rar-y', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: temporary');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: voluntary', 'en', 'word_game', 'Vol-un-tar-y', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: voluntary');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: ordinary', 'en', 'word_game', 'Or-di-nar-y', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: ordinary');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: extraordinary', 'en', 'word_game', 'Ex-tra-or-di-nar-y', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: extraordinary');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: secretary', 'en', 'word_game', 'Sec-re-tar-y', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: secretary');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: vocabulary', 'en', 'word_game', 'Vo-cab-u-lar-y', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: vocabulary');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: imaginary', 'en', 'word_game', 'I-mag-i-nar-y', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: imaginary');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: temperature', 'en', 'word_game', 'Tem-per-a-ture', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: temperature');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: literature', 'en', 'word_game', 'Lit-er-a-ture', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: literature');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: signature', 'en', 'word_game', 'Sig-na-ture', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: signature');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: structure', 'en', 'word_game', 'Struc-ture', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: structure');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: picture', 'en', 'word_game', 'Pic-ture', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: picture');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: nature', 'en', 'word_game', 'Na-ture', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: nature');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: culture', 'en', 'word_game', 'Cul-ture', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: culture');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: agriculture', 'en', 'word_game', 'Ag-ri-cul-ture', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: agriculture');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: architecture', 'en', 'word_game', 'Ar-chi-tec-ture', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: architecture');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: manufacture', 'en', 'word_game', 'Man-u-fac-ture', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: manufacture');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: infrastructure', 'en', 'word_game', 'In-fra-struc-ture', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: infrastructure');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: character', 'en', 'word_game', 'Char-ac-ter', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: character');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: characteristic', 'en', 'word_game', 'Char-ac-ter-is-tic', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: characteristic');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: atmosphere', 'en', 'word_game', 'At-mos-phere', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: atmosphere');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: hemisphere', 'en', 'word_game', 'Hem-i-sphere', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: hemisphere');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: calculator', 'en', 'word_game', 'Cal-cu-la-tor', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: calculator');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: generator', 'en', 'word_game', 'Gen-er-a-tor', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: generator');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: elevator', 'en', 'word_game', 'El-e-va-tor', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: elevator');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: refrigerator', 'en', 'word_game', 'Re-frig-er-a-tor', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: refrigerator');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: graduation', 'en', 'word_game', 'Grad-u-a-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: graduation');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: registration', 'en', 'word_game', 'Reg-is-tra-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: registration');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: application', 'en', 'word_game', 'Ap-pli-ca-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: application');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: presentation', 'en', 'word_game', 'Pre-sen-ta-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: presentation');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: conversation', 'en', 'word_game', 'Con-ver-sa-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: conversation');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: observation', 'en', 'word_game', 'Ob-ser-va-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: observation');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: preparation', 'en', 'word_game', 'Prep-a-ra-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: preparation');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: cooperation', 'en', 'word_game', 'Co-op-er-a-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: cooperation');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: concentration', 'en', 'word_game', 'Con-cen-tra-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: concentration');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: population', 'en', 'word_game', 'Pop-u-la-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: population');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: reputation', 'en', 'word_game', 'Rep-u-ta-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: reputation');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: temptation', 'en', 'word_game', 'Temp-ta-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: temptation');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: expectation', 'en', 'word_game', 'Ex-pec-ta-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: expectation');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: invitation', 'en', 'word_game', 'In-vi-ta-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: invitation');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `syllables`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Word game: pronounce', 'Pronounce the word: situation', 'en', 'word_game', 'Sit-u-a-tion', 10, 10, 2, 8, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'word_game' AND `promptText` = 'Pronounce the word: situation');
