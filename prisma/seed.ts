import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SureCash Mining...");

  // ---------------------------------------------------------------------
  // Levels — matches the master plan's Beginner -> Elite progression.
  // ---------------------------------------------------------------------
  await prisma.level.createMany({
    data: [
      { level: 1, title: "Beginner", xpRequired: 0, bonusAmount: 0 },
      { level: 2, title: "Speaker", xpRequired: 200, bonusAmount: 50 },
      { level: 3, title: "Expert", xpRequired: 600, bonusAmount: 150 },
      { level: 4, title: "Champion", xpRequired: 1500, bonusAmount: 300 },
      { level: 5, title: "Elite", xpRequired: 3500, bonusAmount: 500 },
      { level: 6, title: "Elite II", xpRequired: 7000, bonusAmount: 750 },
      { level: 7, title: "Elite III", xpRequired: 12000, bonusAmount: 1000 },
    ],
    skipDuplicates: true,
  });

  // ---------------------------------------------------------------------
  // Achievements
  // ---------------------------------------------------------------------
  await prisma.achievement.createMany({
    data: [
      { code: "FIRST_RECORDING", title: "First Recording", description: "Submitted your first voice recording", icon: "mic", xpReward: 20 },
      { code: "RECORDINGS_50", title: "50 Recordings", description: "Completed 50 approved voice recordings", icon: "mic", xpReward: 50 },
      { code: "RECORDINGS_100", title: "100 Recordings", description: "Completed 100 approved voice recordings", icon: "mic", xpReward: 100 },
      { code: "RECORDINGS_1000", title: "1000 Recordings", description: "Completed 1000 approved voice recordings", icon: "mic", xpReward: 500 },
      { code: "VOICE_EXPERT", title: "Voice Expert", description: "A seasoned voice task earner", icon: "mic", xpReward: 100 },
      { code: "FIRST_WITHDRAWAL", title: "First Withdrawal", description: "Completed your first withdrawal", icon: "banknote", xpReward: 30 },
      { code: "INVITE_10", title: "Invite 10 Friends", description: "10 referrals verified and credited", icon: "users", xpReward: 80 },
      { code: "INVITE_100", title: "Invite 100 Friends", description: "100 referrals verified and credited", icon: "users", xpReward: 600 },
      { code: "TOP_REFERRER", title: "Top Referrer", description: "A top-performing referrer", icon: "users", xpReward: 80 },
      { code: "STREAK_30", title: "Complete 30 Days", description: "Kept a 30-day mining streak alive", icon: "flame", xpReward: 200 },
      { code: "VIP_MEMBER", title: "VIP Member", description: "Reached Elite level", icon: "gem", xpReward: 150 },
    ],
    skipDuplicates: true,
  });

  // ---------------------------------------------------------------------
  // Voice tasks — multi-language, matching the 6s-20s spec.
  //
  // These models have no DB-level unique constraint on their natural key
  // (title/label), so `createMany({ skipDuplicates: true })` can't actually
  // dedupe anything — it silently re-inserts every row each time the seed
  // runs. Find-or-create per row instead, keyed on title (+ language for
  // voice tasks, since two prompts can share a title in different tongues).
  // ---------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic over Prisma's per-model delegate types
  async function findOrCreate(model: any, where: Record<string, unknown>, data: Record<string, unknown>) {
    const existing = await model.findFirst({ where });
    if (!existing) await model.create({ data });
  }

  const voiceTasks = [
    { title: "English sentence", promptText: "SureCash Mining rewards hardworking users every day.", language: "en", rewardAmount: 20, dailyLimit: 5, minDuration: 6, maxDuration: 20 },
    { title: "English greeting", promptText: "Welcome to SureCash Mining, where your voice earns you money.", language: "en", rewardAmount: 20, dailyLimit: 5, minDuration: 6, maxDuration: 20 },
    { title: "Nigerian Pidgin sentence", promptText: "SureCash Mining go pay you well well if you work hard.", language: "pcm", rewardAmount: 22, dailyLimit: 5, minDuration: 6, maxDuration: 20 },
    { title: "French sentence", promptText: "SureCash Mining récompense les utilisateurs assidus chaque jour.", language: "fr", rewardAmount: 25, dailyLimit: 5, minDuration: 6, maxDuration: 20 },
    { title: "Yoruba sentence", promptText: "SureCash Mining a maa san ẹ ni owo lojoojumọ.", language: "yo", rewardAmount: 25, dailyLimit: 5, minDuration: 6, maxDuration: 20 },
    { title: "Hausa sentence", promptText: "SureCash Mining na biyan ku kudi kowace rana.", language: "ha", rewardAmount: 25, dailyLimit: 5, minDuration: 6, maxDuration: 20 },
    { title: "Igbo sentence", promptText: "SureCash Mining na-akwụ gị ụgwọ kwa ụbọchị.", language: "ig", rewardAmount: 25, dailyLimit: 5, minDuration: 6, maxDuration: 20 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: opportunity", language: "en", category: "word_game", syllables: "Op-por-tu-ni-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: beautiful", language: "en", category: "word_game", syllables: "Beau-ti-ful", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: celebration", language: "en", category: "word_game", syllables: "Cel-e-bra-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: community", language: "en", category: "word_game", syllables: "Com-mu-ni-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: generation", language: "en", category: "word_game", syllables: "Gen-er-a-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: important", language: "en", category: "word_game", syllables: "Im-por-tant", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: technology", language: "en", category: "word_game", syllables: "Tech-nol-o-gy", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: consistency", language: "en", category: "word_game", syllables: "Con-sis-ten-cy", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: entertainment", language: "en", category: "word_game", syllables: "En-ter-tain-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: responsibility", language: "en", category: "word_game", syllables: "Re-spon-si-bil-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: wonderful", language: "en", category: "word_game", syllables: "Won-der-ful", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: happiness", language: "en", category: "word_game", syllables: "Hap-pi-ness", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: adventure", language: "en", category: "word_game", syllables: "Ad-ven-ture", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: cucumber", language: "en", category: "word_game", syllables: "Cu-cum-ber", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: dinosaur", language: "en", category: "word_game", syllables: "Di-no-saur", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: elephant", language: "en", category: "word_game", syllables: "El-e-phant", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: calendar", language: "en", category: "word_game", syllables: "Cal-en-dar", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: umbrella", language: "en", category: "word_game", syllables: "Um-brel-la", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: chocolate", language: "en", category: "word_game", syllables: "Choc-o-late", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: hospital", language: "en", category: "word_game", syllables: "Hos-pi-tal", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: computer", language: "en", category: "word_game", syllables: "Com-pu-ter", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: furniture", language: "en", category: "word_game", syllables: "Fur-ni-ture", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: vacation", language: "en", category: "word_game", syllables: "Va-ca-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: medicine", language: "en", category: "word_game", syllables: "Med-i-cine", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: newspaper", language: "en", category: "word_game", syllables: "News-pa-per", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: telephone", language: "en", category: "word_game", syllables: "Tel-e-phone", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: beginning", language: "en", category: "word_game", syllables: "Be-gin-ning", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: yesterday", language: "en", category: "word_game", syllables: "Yes-ter-day", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: tomorrow", language: "en", category: "word_game", syllables: "To-mor-row", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: afternoon", language: "en", category: "word_game", syllables: "Af-ter-noon", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: breakfast", language: "en", category: "word_game", syllables: "Break-fast", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: surprise", language: "en", category: "word_game", syllables: "Sur-prise", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: remember", language: "en", category: "word_game", syllables: "Re-mem-ber", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: together", language: "en", category: "word_game", syllables: "To-geth-er", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: favorite", language: "en", category: "word_game", syllables: "Fa-vor-ite", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: building", language: "en", category: "word_game", syllables: "Build-ing", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: business", language: "en", category: "word_game", syllables: "Busi-ness", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: children", language: "en", category: "word_game", syllables: "Chil-dren", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: exercise", language: "en", category: "word_game", syllables: "Ex-er-cise", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: neighbor", language: "en", category: "word_game", syllables: "Neigh-bor", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: holiday", language: "en", category: "word_game", syllables: "Hol-i-day", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: birthday", language: "en", category: "word_game", syllables: "Birth-day", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: sandwich", language: "en", category: "word_game", syllables: "Sand-wich", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: mountain", language: "en", category: "word_game", syllables: "Moun-tain", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: sunshine", language: "en", category: "word_game", syllables: "Sun-shine", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: rainbow", language: "en", category: "word_game", syllables: "Rain-bow", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: blanket", language: "en", category: "word_game", syllables: "Blan-ket", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: kitchen", language: "en", category: "word_game", syllables: "Kitch-en", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: pillow", language: "en", category: "word_game", syllables: "Pil-low", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: window", language: "en", category: "word_game", syllables: "Win-dow", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: education", language: "en", category: "word_game", syllables: "Ed-u-ca-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: information", language: "en", category: "word_game", syllables: "In-for-ma-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: imagination", language: "en", category: "word_game", syllables: "Im-ag-i-na-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: congratulations", language: "en", category: "word_game", syllables: "Con-grat-u-la-tions", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: determination", language: "en", category: "word_game", syllables: "De-ter-mi-na-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: organization", language: "en", category: "word_game", syllables: "Or-gan-i-za-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: communication", language: "en", category: "word_game", syllables: "Com-mu-ni-ca-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: examination", language: "en", category: "word_game", syllables: "Ex-am-i-na-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: explanation", language: "en", category: "word_game", syllables: "Ex-pla-na-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: transportation", language: "en", category: "word_game", syllables: "Trans-por-ta-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: environment", language: "en", category: "word_game", syllables: "En-vi-ron-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: government", language: "en", category: "word_game", syllables: "Gov-ern-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: development", language: "en", category: "word_game", syllables: "De-vel-op-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: investment", language: "en", category: "word_game", syllables: "In-vest-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: achievement", language: "en", category: "word_game", syllables: "A-chieve-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: improvement", language: "en", category: "word_game", syllables: "Im-prove-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: requirement", language: "en", category: "word_game", syllables: "Re-quire-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: agreement", language: "en", category: "word_game", syllables: "A-gree-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: movement", language: "en", category: "word_game", syllables: "Move-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: statement", language: "en", category: "word_game", syllables: "State-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: treatment", language: "en", category: "word_game", syllables: "Treat-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: equipment", language: "en", category: "word_game", syllables: "E-quip-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: instrument", language: "en", category: "word_game", syllables: "In-stru-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: document", language: "en", category: "word_game", syllables: "Doc-u-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: moment", language: "en", category: "word_game", syllables: "Mo-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: comment", language: "en", category: "word_game", syllables: "Com-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: element", language: "en", category: "word_game", syllables: "El-e-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: compliment", language: "en", category: "word_game", syllables: "Com-pli-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: experiment", language: "en", category: "word_game", syllables: "Ex-per-i-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: apartment", language: "en", category: "word_game", syllables: "A-part-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: department", language: "en", category: "word_game", syllables: "De-part-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: appointment", language: "en", category: "word_game", syllables: "Ap-point-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: disappointment", language: "en", category: "word_game", syllables: "Dis-ap-point-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: management", language: "en", category: "word_game", syllables: "Man-age-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: arrangement", language: "en", category: "word_game", syllables: "Ar-range-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: announcement", language: "en", category: "word_game", syllables: "An-nounce-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: replacement", language: "en", category: "word_game", syllables: "Re-place-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: enhancement", language: "en", category: "word_game", syllables: "En-hance-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: involvement", language: "en", category: "word_game", syllables: "In-volve-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: settlement", language: "en", category: "word_game", syllables: "Set-tle-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: advertisement", language: "en", category: "word_game", syllables: "Ad-ver-tise-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: amusement", language: "en", category: "word_game", syllables: "A-muse-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: excitement", language: "en", category: "word_game", syllables: "Ex-cite-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: engagement", language: "en", category: "word_game", syllables: "En-gage-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: punishment", language: "en", category: "word_game", syllables: "Pun-ish-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: establishment", language: "en", category: "word_game", syllables: "Es-tab-lish-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: accomplishment", language: "en", category: "word_game", syllables: "Ac-com-plish-ment", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: understanding", language: "en", category: "word_game", syllables: "Un-der-stand-ing", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: relationship", language: "en", category: "word_game", syllables: "Re-la-tion-ship", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: friendship", language: "en", category: "word_game", syllables: "Friend-ship", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: leadership", language: "en", category: "word_game", syllables: "Lead-er-ship", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: citizenship", language: "en", category: "word_game", syllables: "Cit-i-zen-ship", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: membership", language: "en", category: "word_game", syllables: "Mem-ber-ship", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: partnership", language: "en", category: "word_game", syllables: "Part-ner-ship", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: ownership", language: "en", category: "word_game", syllables: "Own-er-ship", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: scholarship", language: "en", category: "word_game", syllables: "Schol-ar-ship", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: championship", language: "en", category: "word_game", syllables: "Cham-pi-on-ship", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: possibility", language: "en", category: "word_game", syllables: "Pos-si-bil-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: availability", language: "en", category: "word_game", syllables: "A-vail-a-bil-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: capability", language: "en", category: "word_game", syllables: "Ca-pa-bil-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: flexibility", language: "en", category: "word_game", syllables: "Flex-i-bil-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: reliability", language: "en", category: "word_game", syllables: "Re-li-a-bil-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: probability", language: "en", category: "word_game", syllables: "Prob-a-bil-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: accountability", language: "en", category: "word_game", syllables: "Ac-count-a-bil-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: sustainability", language: "en", category: "word_game", syllables: "Sus-tain-a-bil-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: accessibility", language: "en", category: "word_game", syllables: "Ac-ces-si-bil-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: compatibility", language: "en", category: "word_game", syllables: "Com-pat-i-bil-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: creativity", language: "en", category: "word_game", syllables: "Cre-a-tiv-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: productivity", language: "en", category: "word_game", syllables: "Pro-duc-tiv-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: university", language: "en", category: "word_game", syllables: "U-ni-ver-si-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: curiosity", language: "en", category: "word_game", syllables: "Cu-ri-os-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: generosity", language: "en", category: "word_game", syllables: "Gen-er-os-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: security", language: "en", category: "word_game", syllables: "Se-cu-ri-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: authority", language: "en", category: "word_game", syllables: "Au-thor-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: majority", language: "en", category: "word_game", syllables: "Ma-jor-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: minority", language: "en", category: "word_game", syllables: "Mi-nor-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: priority", language: "en", category: "word_game", syllables: "Pri-or-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: quality", language: "en", category: "word_game", syllables: "Qual-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: quantity", language: "en", category: "word_game", syllables: "Quan-ti-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: reality", language: "en", category: "word_game", syllables: "Re-al-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: personality", language: "en", category: "word_game", syllables: "Per-son-al-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: nationality", language: "en", category: "word_game", syllables: "Na-tion-al-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: originality", language: "en", category: "word_game", syllables: "O-rig-i-nal-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: individuality", language: "en", category: "word_game", syllables: "In-di-vid-u-al-i-ty", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: biology", language: "en", category: "word_game", syllables: "Bi-ol-o-gy", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: psychology", language: "en", category: "word_game", syllables: "Psy-chol-o-gy", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: geography", language: "en", category: "word_game", syllables: "Ge-og-ra-phy", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: photography", language: "en", category: "word_game", syllables: "Pho-tog-ra-phy", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: philosophy", language: "en", category: "word_game", syllables: "Phi-los-o-phy", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: economy", language: "en", category: "word_game", syllables: "E-con-o-my", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: democracy", language: "en", category: "word_game", syllables: "De-moc-ra-cy", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: energy", language: "en", category: "word_game", syllables: "En-er-gy", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: strategy", language: "en", category: "word_game", syllables: "Strat-e-gy", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: category", language: "en", category: "word_game", syllables: "Cat-e-go-ry", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: laboratory", language: "en", category: "word_game", syllables: "Lab-o-ra-to-ry", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: dictionary", language: "en", category: "word_game", syllables: "Dic-tion-ar-y", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: anniversary", language: "en", category: "word_game", syllables: "An-ni-ver-sa-ry", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: necessary", language: "en", category: "word_game", syllables: "Nec-es-sar-y", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: temporary", language: "en", category: "word_game", syllables: "Tem-po-rar-y", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: voluntary", language: "en", category: "word_game", syllables: "Vol-un-tar-y", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: ordinary", language: "en", category: "word_game", syllables: "Or-di-nar-y", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: extraordinary", language: "en", category: "word_game", syllables: "Ex-tra-or-di-nar-y", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: secretary", language: "en", category: "word_game", syllables: "Sec-re-tar-y", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: vocabulary", language: "en", category: "word_game", syllables: "Vo-cab-u-lar-y", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: imaginary", language: "en", category: "word_game", syllables: "I-mag-i-nar-y", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: temperature", language: "en", category: "word_game", syllables: "Tem-per-a-ture", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: literature", language: "en", category: "word_game", syllables: "Lit-er-a-ture", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: signature", language: "en", category: "word_game", syllables: "Sig-na-ture", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: structure", language: "en", category: "word_game", syllables: "Struc-ture", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: picture", language: "en", category: "word_game", syllables: "Pic-ture", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: nature", language: "en", category: "word_game", syllables: "Na-ture", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: culture", language: "en", category: "word_game", syllables: "Cul-ture", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: agriculture", language: "en", category: "word_game", syllables: "Ag-ri-cul-ture", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: architecture", language: "en", category: "word_game", syllables: "Ar-chi-tec-ture", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: manufacture", language: "en", category: "word_game", syllables: "Man-u-fac-ture", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: infrastructure", language: "en", category: "word_game", syllables: "In-fra-struc-ture", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: character", language: "en", category: "word_game", syllables: "Char-ac-ter", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: characteristic", language: "en", category: "word_game", syllables: "Char-ac-ter-is-tic", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: atmosphere", language: "en", category: "word_game", syllables: "At-mos-phere", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: hemisphere", language: "en", category: "word_game", syllables: "Hem-i-sphere", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: calculator", language: "en", category: "word_game", syllables: "Cal-cu-la-tor", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: generator", language: "en", category: "word_game", syllables: "Gen-er-a-tor", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: elevator", language: "en", category: "word_game", syllables: "El-e-va-tor", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: refrigerator", language: "en", category: "word_game", syllables: "Re-frig-er-a-tor", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: graduation", language: "en", category: "word_game", syllables: "Grad-u-a-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: registration", language: "en", category: "word_game", syllables: "Reg-is-tra-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: application", language: "en", category: "word_game", syllables: "Ap-pli-ca-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: presentation", language: "en", category: "word_game", syllables: "Pre-sen-ta-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: conversation", language: "en", category: "word_game", syllables: "Con-ver-sa-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: observation", language: "en", category: "word_game", syllables: "Ob-ser-va-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: preparation", language: "en", category: "word_game", syllables: "Prep-a-ra-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: cooperation", language: "en", category: "word_game", syllables: "Co-op-er-a-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: concentration", language: "en", category: "word_game", syllables: "Con-cen-tra-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: population", language: "en", category: "word_game", syllables: "Pop-u-la-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: reputation", language: "en", category: "word_game", syllables: "Rep-u-ta-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: temptation", language: "en", category: "word_game", syllables: "Temp-ta-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: expectation", language: "en", category: "word_game", syllables: "Ex-pec-ta-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: invitation", language: "en", category: "word_game", syllables: "In-vi-ta-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    { title: "Word game: pronounce", promptText: "Pronounce the word: situation", language: "en", category: "word_game", syllables: "Sit-u-a-tion", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
  ];
  for (const task of voiceTasks) {
    await findOrCreate(prisma.voiceTask, { title: task.title, language: task.language, promptText: task.promptText }, task);
  }

  // ---------------------------------------------------------------------
  // Task center
  // ---------------------------------------------------------------------
  const taskCenterTasks = [
    { title: "Follow us on TikTok", description: "Follow @surecashmining on TikTok", type: "social", actionUrl: "https://tiktok.com", rewardAmount: 30, requiresProof: true },
    { title: "Like our Facebook Page", description: "Like SureCash Mining on Facebook", type: "social", actionUrl: "https://facebook.com", rewardAmount: 20, requiresProof: true },
    { title: "Watch our YouTube video", description: "Watch the intro video to the end", type: "social", actionUrl: "https://youtube.com", rewardAmount: 25, requiresProof: false },
    { title: "Join our Telegram group", description: "Join the SureCash Mining Telegram community", type: "social", actionUrl: "https://t.me", rewardAmount: 30, requiresProof: true },
    { title: "Join our WhatsApp group", description: "Join the SureCash Mining WhatsApp community", type: "social", actionUrl: "https://wa.me", rewardAmount: 30, requiresProof: true },
    { title: "Download our app", description: "Install the SureCash Mining PWA to your home screen", type: "app", rewardAmount: 40, requiresProof: false },
    { title: "Visit our website", description: "Visit surecashmining.app and explore", type: "website", actionUrl: "https://example.com", rewardAmount: 10, requiresProof: false },
    { title: "Daily check-in", description: "Check in once a day for a small bonus", type: "checkin", rewardAmount: 5, isRepeatable: true, requiresProof: false },
    { title: "Financial literacy quiz", description: "Answer a short quiz about saving money", type: "quiz", rewardAmount: 15, requiresProof: false },
    { title: "Platform survey", description: "Tell us how we can improve SureCash Mining", type: "survey", rewardAmount: 15, requiresProof: false },
  ];
  for (const task of taskCenterTasks) {
    await findOrCreate(prisma.taskCenterTask, { title: task.title }, task);
  }

  // ---------------------------------------------------------------------
  // Membership plans (paid, admin-editable pricing and per-activity rewards)
  // ---------------------------------------------------------------------
  const plans = [
    { name: "Voice Lite", price: 1500, voiceSessionReward: 100, wordGameReward: 60, sponsoredPostReward: 50, taskReward: 50, referralCommission: 800, sortOrder: 1 },
    { name: "Voice Starter", price: 3000, voiceSessionReward: 180, wordGameReward: 120, sponsoredPostReward: 90, taskReward: 90, referralCommission: 1800, sortOrder: 2, isPopular: true },
    { name: "Voice Pro", price: 5000, voiceSessionReward: 270, wordGameReward: 150, sponsoredPostReward: 150, taskReward: 150, referralCommission: 3000, sortOrder: 3 },
    { name: "Audio Elite", price: 9500, voiceSessionReward: 420, wordGameReward: 300, sponsoredPostReward: 200, taskReward: 200, referralCommission: 6000, sortOrder: 4 },
    { name: "Prime Artiste", price: 15000, voiceSessionReward: 600, wordGameReward: 400, sponsoredPostReward: 250, taskReward: 250, referralCommission: 10000, sortOrder: 5 },
  ];
  for (const plan of plans) {
    await findOrCreate(prisma.plan, { name: plan.name }, plan);
  }

  // ---------------------------------------------------------------------
  // Daily missions (only for mission types the app actually tracks)
  // ---------------------------------------------------------------------
  const dailyMissions = [
    { title: "Mine once today", description: "Claim your daily mining reward", type: "MINING", target: 1, rewardXp: 10, rewardAmount: 20, rewardWallet: "ENGAGEMENT" as const },
    { title: "Complete 3 voice tasks", description: "Submit 3 approved voice recordings", type: "VOICE_TASK", target: 3, rewardXp: 20, rewardAmount: 30, rewardWallet: "ENGAGEMENT" as const },
    { title: "Complete 1 task", description: "Finish any task from the Task Center", type: "TASK_CENTER", target: 1, rewardXp: 10, rewardAmount: 15, rewardWallet: "ENGAGEMENT" as const },
  ];
  for (const mission of dailyMissions) {
    await findOrCreate(prisma.dailyMission, { title: mission.title }, mission);
  }

  // ---------------------------------------------------------------------
  // Lucky spin rewards
  // ---------------------------------------------------------------------
  const spinRewards = [
    { label: "₦50 Bonus", amount: 50, wallet: "ENGAGEMENT" as const, weight: 30, colorHex: "#0D8A82" },
    { label: "₦100 Bonus", amount: 100, wallet: "ENGAGEMENT" as const, weight: 20, colorHex: "#F5A623" },
    { label: "₦200 Bonus", amount: 200, wallet: "ENGAGEMENT" as const, weight: 10, colorHex: "#12B76A" },
    { label: "₦500 Jackpot", amount: 500, wallet: "ENGAGEMENT" as const, weight: 3, colorHex: "#E2497A" },
    { label: "Try Again", amount: 0, wallet: "ENGAGEMENT" as const, weight: 25, colorHex: "#94A3B8" },
    { label: "₦20 Bonus", amount: 20, wallet: "ENGAGEMENT" as const, weight: 12, colorHex: "#2563EB" },
  ];
  for (const reward of spinRewards) {
    await findOrCreate(prisma.spinReward, { label: reward.label }, reward);
  }

  // ---------------------------------------------------------------------
  // Promo code
  // ---------------------------------------------------------------------
  await prisma.promoCode.upsert({
    where: { code: "WELCOME50" },
    update: {},
    create: { code: "WELCOME50", amount: 50, wallet: "ENGAGEMENT", maxRedemptions: 1000 },
  });

  // ---------------------------------------------------------------------
  // Admin user
  // ---------------------------------------------------------------------
  const adminEmail = "admin@surecash.app";
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      fullName: "SureCash Admin",
      passwordHash: adminPasswordHash,
      role: "SUPERADMIN",
      emailVerified: true,
      referralCode: "ADMIN0001",
      tier: "VIP",
      wallets: {
        create: [{ type: "MAIN" }, { type: "ENGAGEMENT" }, { type: "SALES" }],
      },
      adminProfile: { create: { department: "Platform", permissions: ["*"] } },
    },
  });
  console.log(`Admin user ready: ${admin.email} / Admin@12345`);

  // ---------------------------------------------------------------------
  // Demo user
  // ---------------------------------------------------------------------
  const demoEmail = "demo@surecash.app";
  const demoPasswordHash = await bcrypt.hash("Demo@12345", 12);
  const demo = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      fullName: "Demo User",
      passwordHash: demoPasswordHash,
      role: "USER",
      emailVerified: true,
      referralCode: "DEMO0001",
      xp: 120,
      streakCount: 3,
      longestStreak: 5,
      wallets: {
        create: [
          { type: "MAIN", balance: 500 },
          { type: "ENGAGEMENT", balance: 240 },
          { type: "SALES", balance: 50 },
        ],
      },
    },
  });
  console.log(`Demo user ready: ${demo.email} / Demo@12345`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
