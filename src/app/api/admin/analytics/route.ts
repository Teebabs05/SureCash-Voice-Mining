import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export async function GET() {
  try {
    await requireAdmin();

    const sevenDaysAgo = daysAgo(7);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      verifiedUsers,
      usersWithDeposit,
      olderThan7Days,
      activeOlderThan7Days,
      mostActiveTxnCounts,
      voiceAllTime,
      voiceToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.deposit.findMany({ where: { status: "APPROVED" }, distinct: ["userId"], select: { userId: true } }),
      prisma.user.count({ where: { createdAt: { lt: sevenDaysAgo } } }),
      prisma.user.count({
        where: {
          createdAt: { lt: sevenDaysAgo },
          walletTransactions: { some: { createdAt: { gte: sevenDaysAgo } } },
        },
      }),
      prisma.walletTransaction.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: { _all: true },
        orderBy: { _count: { userId: "desc" } },
        take: 10,
      }),
      prisma.voiceRecording.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.voiceRecording.groupBy({
        by: ["status"],
        where: { createdAt: { gte: startOfDay } },
        _count: { _all: true },
      }),
    ]);

    const mostActiveUsers = await prisma.user.findMany({
      where: { id: { in: mostActiveTxnCounts.map((r) => r.userId) } },
      select: { id: true, fullName: true, level: true },
    });
    const activeCountMap = new Map(mostActiveTxnCounts.map((r) => [r.userId, r._count._all]));

    function successRate(rows: { status: string; _count: { _all: number } }[]) {
      const approved = rows.find((r) => r.status === "APPROVED")?._count._all ?? 0;
      const rejected = rows.find((r) => r.status === "REJECTED")?._count._all ?? 0;
      const flagged = rows.find((r) => r.status === "FLAGGED")?._count._all ?? 0;
      const total = approved + rejected + flagged;
      return {
        approved,
        rejected,
        flagged,
        total,
        successRatePercent: total > 0 ? Math.round((approved / total) * 100) : null,
      };
    }

    return NextResponse.json({
      conversionRate: {
        emailVerifiedPercent: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
        depositedPercent: totalUsers > 0 ? Math.round((usersWithDeposit.length / totalUsers) * 100) : 0,
      },
      retention: {
        d7ActivePercent: olderThan7Days > 0 ? Math.round((activeOlderThan7Days / olderThan7Days) * 100) : null,
        eligibleUsers: olderThan7Days,
      },
      mostActiveUsers: mostActiveUsers
        .map((u) => ({ ...u, transactionCount: activeCountMap.get(u.id) ?? 0 }))
        .sort((a, b) => b.transactionCount - a.transactionCount),
      voice: {
        allTime: successRate(voiceAllTime),
        today: successRate(voiceToday),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
