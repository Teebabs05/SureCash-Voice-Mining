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
  // ---------------------------------------------------------------------
  await prisma.voiceTask.createMany({
    data: [
      { title: "English sentence", promptText: "SureCash Mining rewards hardworking users every day.", language: "en", rewardAmount: 20, dailyLimit: 5, minDuration: 6, maxDuration: 20 },
      { title: "English greeting", promptText: "Welcome to SureCash Mining, where your voice earns you money.", language: "en", rewardAmount: 20, dailyLimit: 5, minDuration: 6, maxDuration: 20 },
      { title: "Nigerian Pidgin sentence", promptText: "SureCash Mining go pay you well well if you work hard.", language: "pcm", rewardAmount: 22, dailyLimit: 5, minDuration: 6, maxDuration: 20 },
      { title: "French sentence", promptText: "SureCash Mining récompense les utilisateurs assidus chaque jour.", language: "fr", rewardAmount: 25, dailyLimit: 5, minDuration: 6, maxDuration: 20 },
      { title: "Yoruba sentence", promptText: "SureCash Mining a maa san ẹ ni owo lojoojumọ.", language: "yo", rewardAmount: 25, dailyLimit: 5, minDuration: 6, maxDuration: 20 },
      { title: "Hausa sentence", promptText: "SureCash Mining na biyan ku kudi kowace rana.", language: "ha", rewardAmount: 25, dailyLimit: 5, minDuration: 6, maxDuration: 20 },
      { title: "Igbo sentence", promptText: "SureCash Mining na-akwụ gị ụgwọ kwa ụbọchị.", language: "ig", rewardAmount: 25, dailyLimit: 5, minDuration: 6, maxDuration: 20 },
      { title: "Word game: pronounce", promptText: "Pronounce the word: opportunity", language: "en", category: "word_game", rewardAmount: 10, dailyLimit: 10, minDuration: 2, maxDuration: 8 },
    ],
    skipDuplicates: true,
  });

  // ---------------------------------------------------------------------
  // Task center
  // ---------------------------------------------------------------------
  await prisma.taskCenterTask.createMany({
    data: [
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
    ],
    skipDuplicates: true,
  });

  // ---------------------------------------------------------------------
  // Membership plans (paid, admin-editable pricing and per-activity rewards)
  // ---------------------------------------------------------------------
  await prisma.plan.createMany({
    data: [
      { name: "Voice Lite", price: 1500, voiceSessionReward: 100, wordGameReward: 60, sponsoredPostReward: 50, taskReward: 50, referralCommission: 800, sortOrder: 1 },
      { name: "Voice Starter", price: 3000, voiceSessionReward: 180, wordGameReward: 120, sponsoredPostReward: 90, taskReward: 90, referralCommission: 1800, sortOrder: 2 },
      { name: "Voice Pro", price: 5000, voiceSessionReward: 270, wordGameReward: 150, sponsoredPostReward: 150, taskReward: 150, referralCommission: 3000, sortOrder: 3 },
      { name: "Audio Elite", price: 9500, voiceSessionReward: 420, wordGameReward: 300, sponsoredPostReward: 200, taskReward: 200, referralCommission: 6000, sortOrder: 4 },
      { name: "Prime Artiste", price: 15000, voiceSessionReward: 600, wordGameReward: 400, sponsoredPostReward: 250, taskReward: 250, referralCommission: 10000, sortOrder: 5 },
    ],
    skipDuplicates: true,
  });

  // ---------------------------------------------------------------------
  // Daily missions (only for mission types the app actually tracks)
  // ---------------------------------------------------------------------
  await prisma.dailyMission.createMany({
    data: [
      { title: "Mine once today", description: "Claim your daily mining reward", type: "MINING", target: 1, rewardXp: 10, rewardAmount: 20, rewardWallet: "BONUS" },
      { title: "Complete 3 voice tasks", description: "Submit 3 approved voice recordings", type: "VOICE_TASK", target: 3, rewardXp: 20, rewardAmount: 30, rewardWallet: "BONUS" },
      { title: "Complete 1 task", description: "Finish any task from the Task Center", type: "TASK_CENTER", target: 1, rewardXp: 10, rewardAmount: 15, rewardWallet: "BONUS" },
    ],
    skipDuplicates: true,
  });

  // ---------------------------------------------------------------------
  // Lucky spin rewards
  // ---------------------------------------------------------------------
  await prisma.spinReward.createMany({
    data: [
      { label: "₦50 Bonus", amount: 50, wallet: "BONUS", weight: 30, colorHex: "#6A00FF" },
      { label: "₦100 Bonus", amount: 100, wallet: "BONUS", weight: 20, colorHex: "#FFD700" },
      { label: "₦200 Bonus", amount: 200, wallet: "BONUS", weight: 10, colorHex: "#00C853" },
      { label: "₦500 Jackpot", amount: 500, wallet: "BONUS", weight: 3, colorHex: "#FF2FB0" },
      { label: "Try Again", amount: 0, wallet: "BONUS", weight: 25, colorHex: "#94A3B8" },
      { label: "₦20 Bonus", amount: 20, wallet: "BONUS", weight: 12, colorHex: "#00C2FF" },
    ],
    skipDuplicates: true,
  });

  // ---------------------------------------------------------------------
  // Promo code
  // ---------------------------------------------------------------------
  await prisma.promoCode.upsert({
    where: { code: "WELCOME50" },
    update: {},
    create: { code: "WELCOME50", amount: 50, wallet: "BONUS", maxRedemptions: 1000 },
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
        create: [
          { type: "MAIN" }, { type: "MINING" }, { type: "VOICE" },
          { type: "REFERRAL" }, { type: "TASK" }, { type: "BONUS" },
        ],
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
          { type: "MINING", balance: 120 },
          { type: "VOICE", balance: 80 },
          { type: "REFERRAL", balance: 50 },
          { type: "TASK", balance: 30 },
          { type: "BONUS", balance: 10 },
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
