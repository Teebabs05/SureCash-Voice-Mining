-- Add ~20 short branded voice-earn sentences per language, so users can
-- skip a hard prompt and get a different one instead of being stuck with
-- whichever single sentence existed before for that language.

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'Earn money every day with SureCash Mining.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'Earn money every day with SureCash Mining.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'Your voice can earn you real cash here.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'Your voice can earn you real cash here.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'SureCash Mining pays you fast and pays you well.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'SureCash Mining pays you fast and pays you well.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'Join SureCash Mining today and start earning.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'Join SureCash Mining today and start earning.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'Record your voice and get paid instantly.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'Record your voice and get paid instantly.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'SureCash Mining is the easiest way to earn from home.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'SureCash Mining is the easiest way to earn from home.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'Invite your friends and earn more together.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'Invite your friends and earn more together.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'Complete simple tasks and earn real money daily.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'Complete simple tasks and earn real money daily.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'SureCash Mining trusts hardworking Nigerians like you.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'SureCash Mining trusts hardworking Nigerians like you.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'Withdraw your earnings anytime you want.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'Withdraw your earnings anytime you want.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'Your daily hustle deserves daily rewards.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'Your daily hustle deserves daily rewards.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'SureCash Mining turns your voice into income.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'SureCash Mining turns your voice into income.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'Sign up free and start earning today.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'Sign up free and start earning today.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'SureCash Mining pays real money for real work.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'SureCash Mining pays real money for real work.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'Read simple words and earn instant cash.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'Read simple words and earn instant cash.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'SureCash Mining rewards consistency and hard work.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'SureCash Mining rewards consistency and hard work.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'Every voice task you complete adds to your wallet.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'Every voice task you complete adds to your wallet.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'SureCash Mining - your voice, your income.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'SureCash Mining - your voice, your income.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'Speak clearly and watch your wallet grow.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'Speak clearly and watch your wallet grow.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'English sentence', 'Thousands of Nigerians already earn with SureCash Mining.', 'en', 'session', 20, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'en' AND `promptText` = 'Thousands of Nigerians already earn with SureCash Mining.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'SureCash Mining go pay you money every single day.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'SureCash Mining go pay you money every single day.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'Your voice fit make you real money for here.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'Your voice fit make you real money for here.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'SureCash Mining dey pay fast, e dey pay well.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'SureCash Mining dey pay fast, e dey pay well.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'Join SureCash Mining today make you start dey earn.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'Join SureCash Mining today make you start dey earn.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'Record your voice make dem pay you sharp sharp.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'Record your voice make dem pay you sharp sharp.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'SureCash Mining na the easiest way to hustle from house.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'SureCash Mining na the easiest way to hustle from house.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'Invite your padi dem make una earn together.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'Invite your padi dem make una earn together.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'Do small task, earn correct money every day.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'Do small task, earn correct money every day.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'SureCash Mining trust hardworking Naija people like you.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'SureCash Mining trust hardworking Naija people like you.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'Withdraw your money anytime wey you like.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'Withdraw your money anytime wey you like.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'Your daily hustle deserve daily reward.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'Your daily hustle deserve daily reward.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'SureCash Mining dey turn your voice to money.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'SureCash Mining dey turn your voice to money.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'Sign up free, start dey earn today.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'Sign up free, start dey earn today.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'SureCash Mining dey pay real money for real work.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'SureCash Mining dey pay real money for real work.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'Read simple word, earn money sharp sharp.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'Read simple word, earn money sharp sharp.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'SureCash Mining dey reward people wey dey consistent.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'SureCash Mining dey reward people wey dey consistent.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'Every task wey you complete dey enter your wallet.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'Every task wey you complete dey enter your wallet.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'SureCash Mining - your voice na your income.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'SureCash Mining - your voice na your income.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'Talk well well make your wallet grow.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'Talk well well make your wallet grow.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Nigerian Pidgin sentence', 'Plenty Nigerians don dey earn with SureCash Mining.', 'pcm', 'session', 22, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'pcm' AND `promptText` = 'Plenty Nigerians don dey earn with SureCash Mining.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'SureCash Mining vous paie chaque jour.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'SureCash Mining vous paie chaque jour.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'Votre voix peut vous rapporter de l''argent réel.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'Votre voix peut vous rapporter de l''argent réel.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'SureCash Mining paie vite et paie bien.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'SureCash Mining paie vite et paie bien.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'Rejoignez SureCash Mining aujourd''hui et commencez à gagner.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'Rejoignez SureCash Mining aujourd''hui et commencez à gagner.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'Enregistrez votre voix et soyez payé instantanément.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'Enregistrez votre voix et soyez payé instantanément.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'SureCash Mining est le moyen le plus simple de gagner à la maison.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'SureCash Mining est le moyen le plus simple de gagner à la maison.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'Invitez vos amis et gagnez plus ensemble.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'Invitez vos amis et gagnez plus ensemble.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'Complétez des tâches simples et gagnez de l''argent chaque jour.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'Complétez des tâches simples et gagnez de l''argent chaque jour.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'SureCash Mining fait confiance aux travailleurs assidus comme vous.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'SureCash Mining fait confiance aux travailleurs assidus comme vous.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'Retirez vos gains à tout moment.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'Retirez vos gains à tout moment.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'Votre travail quotidien mérite une récompense quotidienne.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'Votre travail quotidien mérite une récompense quotidienne.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'SureCash Mining transforme votre voix en revenu.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'SureCash Mining transforme votre voix en revenu.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'Inscrivez-vous gratuitement et commencez à gagner aujourd''hui.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'Inscrivez-vous gratuitement et commencez à gagner aujourd''hui.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'SureCash Mining paie de l''argent réel pour un vrai travail.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'SureCash Mining paie de l''argent réel pour un vrai travail.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'Lisez des mots simples et gagnez de l''argent instantanément.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'Lisez des mots simples et gagnez de l''argent instantanément.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'SureCash Mining récompense la régularité et le travail acharné.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'SureCash Mining récompense la régularité et le travail acharné.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'Chaque tâche vocale complétée s''ajoute à votre portefeuille.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'Chaque tâche vocale complétée s''ajoute à votre portefeuille.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'SureCash Mining - votre voix, votre revenu.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'SureCash Mining - votre voix, votre revenu.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'Parlez clairement et regardez votre portefeuille grandir.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'Parlez clairement et regardez votre portefeuille grandir.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'French sentence', 'Des milliers de Nigérians gagnent déjà avec SureCash Mining.', 'fr', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'fr' AND `promptText` = 'Des milliers de Nigérians gagnent déjà avec SureCash Mining.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'SureCash Mining máa n san owó fún ẹ lójoojúmọ́.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'SureCash Mining máa n san owó fún ẹ lójoojúmọ́.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'Ohùn rẹ lè jẹ́ kí o jèrè owó gidi.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'Ohùn rẹ lè jẹ́ kí o jèrè owó gidi.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'SureCash Mining máa n sanwó kíákíá àti dáadáa.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'SureCash Mining máa n sanwó kíákíá àti dáadáa.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'Dara pọ̀ mọ́ SureCash Mining lónìí kí o bẹ̀rẹ̀ sí í jèrè.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'Dara pọ̀ mọ́ SureCash Mining lónìí kí o bẹ̀rẹ̀ sí í jèrè.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'Gba ohùn rẹ kí wọ́n lè san owó fún ẹ lẹ́sẹ̀kẹsẹ̀.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'Gba ohùn rẹ kí wọ́n lè san owó fún ẹ lẹ́sẹ̀kẹsẹ̀.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'SureCash Mining ni ọ̀nà tó rọrùn jù láti jèrè láti ilé.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'SureCash Mining ni ọ̀nà tó rọrùn jù láti jèrè láti ilé.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'Pe àwọn ọ̀rẹ́ rẹ kí ẹ jèrè papọ̀.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'Pe àwọn ọ̀rẹ́ rẹ kí ẹ jèrè papọ̀.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'Ṣe iṣẹ́ kékeré kí o jèrè owó lójoojúmọ́.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'Ṣe iṣẹ́ kékeré kí o jèrè owó lójoojúmọ́.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'SureCash Mining gbẹ́kẹ̀lé àwọn ará Nàìjíríà tó ń ṣiṣẹ́ kára.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'SureCash Mining gbẹ́kẹ̀lé àwọn ará Nàìjíríà tó ń ṣiṣẹ́ kára.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'Yọ owó rẹ jáde nígbàkúgbà tí o bá fẹ́.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'Yọ owó rẹ jáde nígbàkúgbà tí o bá fẹ́.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'Iṣẹ́ rẹ lójoojúmọ́ yẹ kí ó ní ẹ̀san lójoojúmọ́.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'Iṣẹ́ rẹ lójoojúmọ́ yẹ kí ó ní ẹ̀san lójoojúmọ́.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'SureCash Mining ń sọ ohùn rẹ di owó.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'SureCash Mining ń sọ ohùn rẹ di owó.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'Forúkọsílẹ̀ lọ́fẹ̀ẹ́ kí o bẹ̀rẹ̀ sí í jèrè lónìí.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'Forúkọsílẹ̀ lọ́fẹ̀ẹ́ kí o bẹ̀rẹ̀ sí í jèrè lónìí.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'SureCash Mining san owó gidi fún iṣẹ́ gidi.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'SureCash Mining san owó gidi fún iṣẹ́ gidi.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'Ka ọ̀rọ̀ tó rọrùn kí o jèrè owó lẹ́sẹ̀kẹsẹ̀.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'Ka ọ̀rọ̀ tó rọrùn kí o jèrè owó lẹ́sẹ̀kẹsẹ̀.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'SureCash Mining ń fún àwọn tó dúró ṣinṣin ní ẹ̀san.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'SureCash Mining ń fún àwọn tó dúró ṣinṣin ní ẹ̀san.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'Iṣẹ́ ohùn kọ̀ọ̀kan tí o parí máa ń wọ àpò rẹ.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'Iṣẹ́ ohùn kọ̀ọ̀kan tí o parí máa ń wọ àpò rẹ.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'SureCash Mining - ohùn rẹ, owó rẹ.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'SureCash Mining - ohùn rẹ, owó rẹ.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'Sọ̀rọ̀ kedere kí àpò owó rẹ lè dàgbà.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'Sọ̀rọ̀ kedere kí àpò owó rẹ lè dàgbà.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Yoruba sentence', 'Ẹgbẹẹgbẹ̀rún ọmọ Nàìjíríà ti ń jèrè pẹ̀lú SureCash Mining.', 'yo', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'yo' AND `promptText` = 'Ẹgbẹẹgbẹ̀rún ọmọ Nàìjíríà ti ń jèrè pẹ̀lú SureCash Mining.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'SureCash Mining tana biyan ku kuɗi kowace rana.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'SureCash Mining tana biyan ku kuɗi kowace rana.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'Muryar ku na iya samo muku kuɗi na gaske.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'Muryar ku na iya samo muku kuɗi na gaske.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'SureCash Mining tana biya da sauri kuma da kyau.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'SureCash Mining tana biya da sauri kuma da kyau.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'Ku shiga SureCash Mining yau ku fara samun kuɗi.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'Ku shiga SureCash Mining yau ku fara samun kuɗi.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'Ku yi rikodin muryar ku a biya ku nan take.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'Ku yi rikodin muryar ku a biya ku nan take.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'SureCash Mining ita ce hanya mafi sauƙi ta samun kuɗi a gida.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'SureCash Mining ita ce hanya mafi sauƙi ta samun kuɗi a gida.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'Ku gayyaci abokanku don samun kuɗi tare.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'Ku gayyaci abokanku don samun kuɗi tare.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'Ku yi ayyuka masu sauƙi ku sami kuɗi kowace rana.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'Ku yi ayyuka masu sauƙi ku sami kuɗi kowace rana.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'SureCash Mining ta amince da Najeriya masu aiki tuƙuru kamar ku.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'SureCash Mining ta amince da Najeriya masu aiki tuƙuru kamar ku.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'Ku cire kuɗin ku a duk lokacin da kuke so.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'Ku cire kuɗin ku a duk lokacin da kuke so.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'Aikin ku na yau da kullum ya cancanci lada.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'Aikin ku na yau da kullum ya cancanci lada.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'SureCash Mining tana mayar da muryar ku zuwa kuɗi.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'SureCash Mining tana mayar da muryar ku zuwa kuɗi.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'Ku yi rijista kyauta ku fara samun kuɗi yau.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'Ku yi rijista kyauta ku fara samun kuɗi yau.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'SureCash Mining tana biyan kuɗi na gaske don aiki na gaske.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'SureCash Mining tana biyan kuɗi na gaske don aiki na gaske.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'Ku karanta kalmomi masu sauƙi ku sami kuɗi nan take.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'Ku karanta kalmomi masu sauƙi ku sami kuɗi nan take.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'SureCash Mining tana ba da lada ga masu aiki tuƙuru.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'SureCash Mining tana ba da lada ga masu aiki tuƙuru.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'Kowane aiki da kuka kammala yana ƙara wa asusun ku.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'Kowane aiki da kuka kammala yana ƙara wa asusun ku.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'SureCash Mining - muryar ku, kuɗin ku.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'SureCash Mining - muryar ku, kuɗin ku.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'Ku yi magana a sarari asusun ku ya girma.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'Ku yi magana a sarari asusun ku ya girma.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Hausa sentence', 'Dubban Najeriya suna samun kuɗi tare da SureCash Mining.', 'ha', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ha' AND `promptText` = 'Dubban Najeriya suna samun kuɗi tare da SureCash Mining.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'SureCash Mining na-akwụ gị ụgwọ kwa ụbọchị.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'SureCash Mining na-akwụ gị ụgwọ kwa ụbọchị.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'Olu gị nwere ike ime ka ị nweta ezigbo ego.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'Olu gị nwere ike ime ka ị nweta ezigbo ego.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'SureCash Mining na-akwụ ụgwọ ngwa ngwa ma kwụọ nke ọma.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'SureCash Mining na-akwụ ụgwọ ngwa ngwa ma kwụọ nke ọma.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'Sonyere SureCash Mining taa malite inweta ego.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'Sonyere SureCash Mining taa malite inweta ego.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'Dee olu gị ka a kwụọ gị ụgwọ ozugbo.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'Dee olu gị ka a kwụọ gị ụgwọ ozugbo.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'SureCash Mining bụ ụzọ dịkarịsịrị mfe iji nweta ego n''ụlọ.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'SureCash Mining bụ ụzọ dịkarịsịrị mfe iji nweta ego n''ụlọ.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'Kpọọ ndị enyi gị ka unu nwetakọta ego ọnụ.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'Kpọọ ndị enyi gị ka unu nwetakọta ego ọnụ.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'Rụọ ọrụ dị mfe nweta ezigbo ego kwa ụbọchị.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'Rụọ ọrụ dị mfe nweta ezigbo ego kwa ụbọchị.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'SureCash Mining na-atụkwasị ndị Naijiria na-arụsi ọrụ ike obi.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'SureCash Mining na-atụkwasị ndị Naijiria na-arụsi ọrụ ike obi.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'Wepụ ego gị mgbe ọ bụla ị chọrọ.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'Wepụ ego gị mgbe ọ bụla ị chọrọ.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'Ọrụ gị kwa ụbọchị kwesịrị ụgwọ ọrụ kwa ụbọchị.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'Ọrụ gị kwa ụbọchị kwesịrị ụgwọ ọrụ kwa ụbọchị.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'SureCash Mining na-eme ka olu gị bụrụ ego.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'SureCash Mining na-eme ka olu gị bụrụ ego.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'Debanye aha n''efu ma malite inweta ego taa.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'Debanye aha n''efu ma malite inweta ego taa.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'SureCash Mining na-akwụ ezigbo ego maka ezigbo ọrụ.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'SureCash Mining na-akwụ ezigbo ego maka ezigbo ọrụ.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'Gụọ okwu dị mfe nweta ego ozugbo.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'Gụọ okwu dị mfe nweta ego ozugbo.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'SureCash Mining na-akwụ ndị na-arụsi ọrụ ike ụgwọ.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'SureCash Mining na-akwụ ndị na-arụsi ọrụ ike ụgwọ.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'Ọrụ olu ọ bụla ị rụchara na-abanye n''akpa ego gị.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'Ọrụ olu ọ bụla ị rụchara na-abanye n''akpa ego gị.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'SureCash Mining - olu gị, ego gị.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'SureCash Mining - olu gị, ego gị.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'Kwuo okwu nke ọma ka akpa ego gị too.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'Kwuo okwu nke ọma ka akpa ego gị too.');

INSERT INTO `VoiceTask` (`id`, `title`, `promptText`, `language`, `category`, `rewardAmount`, `dailyLimit`, `minDuration`, `maxDuration`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Igbo sentence', 'Ọtụtụ puku ndị Naijiria na-enweta ego na SureCash Mining.', 'ig', 'session', 25, 5, 6, 20, true, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `VoiceTask` WHERE `category` = 'session' AND `language` = 'ig' AND `promptText` = 'Ọtụtụ puku ndị Naijiria na-enweta ego na SureCash Mining.');
