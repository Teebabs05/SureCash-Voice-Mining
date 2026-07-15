import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { formatCurrency } from "@/lib/utils";

function firstName(fullName: string) {
  return fullName.split(" ")[0];
}

/**
 * Community feed built entirely from real platform events — no fabricated
 * users or amounts — so it stays trustworthy even as engagement content.
 */
export async function GET() {
  try {
    await requireUser();

    const [withdrawals, voiceApprovals, achievements, referrals] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { status: "PAID" },
        orderBy: { processedAt: "desc" },
        take: 15,
        include: { user: { select: { fullName: true } } },
      }),
      prisma.voiceRecording.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { user: { select: { fullName: true } } },
      }),
      prisma.userAchievement.findMany({
        orderBy: { earnedAt: "desc" },
        take: 15,
        include: { user: { select: { fullName: true } }, achievement: { select: { title: true } } },
      }),
      prisma.referral.findMany({
        where: { rewardCredited: true },
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { referrer: { select: { fullName: true } } },
      }),
    ]);

    const events = [
      ...withdrawals.map((w) => ({
        id: `w_${w.id}`,
        icon: "withdrawal" as const,
        text: `${firstName(w.user.fullName)} just completed a withdrawal of ${formatCurrency(Number(w.amount))}`,
        createdAt: w.processedAt ?? w.createdAt,
      })),
      ...voiceApprovals.map((r) => ({
        id: `v_${r.id}`,
        icon: "voice" as const,
        text: `${firstName(r.user.fullName)} earned a reward from a voice task`,
        createdAt: r.createdAt,
      })),
      ...achievements.map((a) => ({
        id: `a_${a.id}`,
        icon: "achievement" as const,
        text: `${firstName(a.user.fullName)} unlocked "${a.achievement.title}"`,
        createdAt: a.earnedAt,
      })),
      ...referrals.map((r) => ({
        id: `r_${r.id}`,
        icon: "referral" as const,
        text: `${firstName(r.referrer.fullName)} earned a referral bonus`,
        createdAt: r.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ events: events.slice(0, 30) });
  } catch (error) {
    return handleApiError(error);
  }
}
