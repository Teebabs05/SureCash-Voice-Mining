import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { getWalletSummary } from "@/lib/server/wallet";
import { handleApiError } from "@/lib/server/api-response";
import { getSetting } from "@/lib/server/settings";
import { dateOnlyKey } from "@/lib/server/gamification";
import { isActivePlanRequired } from "@/lib/server/plan-gate";

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
    const planRequiredSetting = await isActivePlanRequired();
    const planRequired = planRequiredSetting && !user.planId;

    const [
      today,
      week,
      month,
      lifetime,
      pendingVoice,
      currentLevel,
      nextLevel,
      socials,
      bankAccountCount,
      announcement,
      plan,
      withdrawnLifetime,
      voiceDoneToday,
      taskDoneToday,
      sponsoredDoneToday,
    ] = await Promise.all([
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
        select: { facebookUrl: true, instagramHandle: true, tiktokHandle: true, avatarUrl: true },
      }),
      prisma.bankAccount.count({ where: { userId: user.id } }),
      getSetting("pinned_announcement", ""),
      user.planId ? prisma.plan.findUnique({ where: { id: user.planId } }) : null,
      prisma.withdrawal.aggregate({
        where: { userId: user.id, status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.voiceRecording.count({
        where: { userId: user.id, status: "APPROVED", createdAt: { gte: startOfToday() } },
      }),
      prisma.userTaskCompletion.count({
        where: { userId: user.id, status: "completed", createdAt: { gte: startOfToday() } },
      }),
      prisma.sponsoredShare.count({
        where: { userId: user.id, status: "APPROVED", date: dateOnlyKey() },
      }),
    ]);

    const pendingRewards = pendingVoice.reduce((sum, r) => sum + Number(r.voiceTask.rewardAmount), 0);

    const xpIntoLevel = user.xp - (currentLevel?.xpRequired ?? 0);
    const xpForNextLevel = nextLevel ? nextLevel.xpRequired - (currentLevel?.xpRequired ?? 0) : 0;
    const levelProgressPercent = nextLevel ? Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100)) : 100;

    const linkedSocialsCount = [socials.facebookUrl, socials.instagramHandle, socials.tiktokHandle].filter(
      Boolean
    ).length;
    const setupSteps = [
      ...(planRequiredSetting
        ? [{ key: "activate_plan", label: "Activate a plan", done: Boolean(user.planId), href: "/plans" }]
        : []),
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
        handle: `@${user.fullName.split(" ")[0]}`,
        avatarUrl: socials.avatarUrl,
        level: user.level,
        levelTitle: currentLevel?.title ?? "Newcomer",
        xp: user.xp,
        streakCount: user.streakCount,
        emailVerified: user.emailVerified,
      },
      plan: plan
        ? {
            name: plan.name,
            voiceSessionReward: Number(plan.voiceSessionReward),
            wordGameReward: Number(plan.wordGameReward),
            taskReward: Number(plan.taskReward),
          }
        : null,
      wallets,
      totalBalance: total,
      earnings: {
        today: Number(today._sum.amount ?? 0),
        week: Number(week._sum.amount ?? 0),
        month: Number(month._sum.amount ?? 0),
        lifetime: Number(lifetime._sum.amount ?? 0),
        pending: pendingRewards,
      },
      planRequired,
      withdrawnLifetime: Number(withdrawnLifetime._sum.amount ?? 0),
      activitiesToday: voiceDoneToday + taskDoneToday + sponsoredDoneToday,
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
