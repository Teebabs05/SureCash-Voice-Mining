import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { getWalletSummary } from "@/lib/server/wallet";
import { handleApiError } from "@/lib/server/api-response";
import { getSetting } from "@/lib/server/settings";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfWeek() {
  const d = startOfToday();
  d.setDate(d.getDate() - d.getDay());
  return d;
}
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function GET() {
  try {
    const user = await requireUser();
    const { wallets, total } = await getWalletSummary(user.id);

    const [today, week, month, lifetime, pendingVoice, currentLevel, nextLevel, socials, bankAccountCount, announcement] =
      await Promise.all([
        prisma.walletTransaction.aggregate({
          where: { userId: user.id, type: "CREDIT", createdAt: { gte: startOfToday() } },
          _sum: { amount: true },
        }),
        prisma.walletTransaction.aggregate({
          where: { userId: user.id, type: "CREDIT", createdAt: { gte: startOfWeek() } },
          _sum: { amount: true },
        }),
        prisma.walletTransaction.aggregate({
          where: { userId: user.id, type: "CREDIT", createdAt: { gte: startOfMonth() } },
          _sum: { amount: true },
        }),
        prisma.walletTransaction.aggregate({
          where: { userId: user.id, type: "CREDIT" },
          _sum: { amount: true },
        }),
        prisma.voiceRecording.findMany({
          where: { userId: user.id, status: { in: ["PENDING", "PROCESSING"] } },
          include: { voiceTask: { select: { rewardAmount: true } } },
        }),
        prisma.level.findUnique({ where: { level: user.level } }),
        prisma.level.findFirst({ where: { level: { gt: user.level } }, orderBy: { level: "asc" } }),
        prisma.user.findUniqueOrThrow({
          where: { id: user.id },
          select: { facebookUrl: true, instagramHandle: true, tiktokHandle: true },
        }),
        prisma.bankAccount.count({ where: { userId: user.id } }),
        getSetting("pinned_announcement", ""),
      ]);

    const pendingRewards = pendingVoice.reduce((sum, r) => sum + Number(r.voiceTask.rewardAmount), 0);

    const xpIntoLevel = user.xp - (currentLevel?.xpRequired ?? 0);
    const xpForNextLevel = nextLevel ? nextLevel.xpRequired - (currentLevel?.xpRequired ?? 0) : 0;
    const levelProgressPercent = nextLevel ? Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100)) : 100;

    const linkedSocialsCount = [socials.facebookUrl, socials.instagramHandle, socials.tiktokHandle].filter(
      Boolean
    ).length;
    const setupSteps = [
      { key: "verify_email", label: "Verify your email", done: user.emailVerified, href: "/profile" },
      {
        key: "link_socials",
        label: "Link 2 social accounts",
        done: linkedSocialsCount >= 2,
        href: "/profile/social-accounts",
      },
      { key: "add_bank_account", label: "Add a withdrawal bank account", done: bankAccountCount > 0, href: "/profile/bank-account" },
    ];

    return NextResponse.json({
      user: {
        fullName: user.fullName,
        level: user.level,
        levelTitle: currentLevel?.title ?? "Newcomer",
        xp: user.xp,
        streakCount: user.streakCount,
        emailVerified: user.emailVerified,
      },
      wallets,
      totalBalance: total,
      earnings: {
        today: Number(today._sum.amount ?? 0),
        week: Number(week._sum.amount ?? 0),
        month: Number(month._sum.amount ?? 0),
        lifetime: Number(lifetime._sum.amount ?? 0),
        pending: pendingRewards,
      },
      levelProgress: {
        percent: levelProgressPercent,
        nextLevelTitle: nextLevel?.title ?? null,
        nextLevelBonus: nextLevel ? Number(nextLevel.bonusAmount) : null,
      },
      setupSteps,
      announcement: announcement || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
