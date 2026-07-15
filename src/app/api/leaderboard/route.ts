import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

function maskName(name: string) {
  const [first, ...rest] = name.split(" ");
  return rest.length ? `${first} ${rest[0][0]}.` : first;
}

export async function GET() {
  try {
    await requireUser();

    const [topEarners, topMiners, referralCounts] = await Promise.all([
      prisma.user.findMany({
        orderBy: { xp: "desc" },
        take: 10,
        select: { id: true, fullName: true, level: true, xp: true },
      }),
      prisma.user.findMany({
        orderBy: { streakCount: "desc" },
        take: 10,
        select: { id: true, fullName: true, streakCount: true, level: true },
      }),
      prisma.referral.groupBy({
        by: ["referrerId"],
        where: { rewardCredited: true },
        _count: { _all: true },
        orderBy: { _count: { referrerId: "desc" } },
        take: 10,
      }),
    ]);

    const referrers = await prisma.user.findMany({
      where: { id: { in: referralCounts.map((r) => r.referrerId) } },
      select: { id: true, fullName: true, level: true },
    });
    const referrerMap = new Map(referrers.map((r) => [r.id, r]));

    return NextResponse.json({
      topEarners: topEarners.map((u) => ({ ...u, fullName: maskName(u.fullName) })),
      topMiners: topMiners.map((u) => ({ ...u, fullName: maskName(u.fullName) })),
      topReferrers: referralCounts
        .map((r) => ({
          fullName: referrerMap.has(r.referrerId) ? maskName(referrerMap.get(r.referrerId)!.fullName) : "—",
          level: referrerMap.get(r.referrerId)?.level ?? 1,
          referralCount: r._count._all,
        }))
        .filter((r) => r.fullName !== "—"),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
