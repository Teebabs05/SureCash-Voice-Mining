import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { getWalletSummary } from "@/lib/server/wallet";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    const { wallets, total } = await getWalletSummary(user.id);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [recentTransactions, todayCredits, plan] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.walletTransaction.groupBy({
        by: ["walletId"],
        where: { userId: user.id, type: "CREDIT", createdAt: { gte: startOfDay } },
        _sum: { amount: true },
      }),
      user.planId ? prisma.plan.findUnique({ where: { id: user.planId }, select: { name: true } }) : null,
    ]);

    const todayByWallet = new Map(todayCredits.map((t) => [t.walletId, Number(t._sum.amount ?? 0)]));
    const walletsWithToday = wallets.map((w) => ({
      ...w,
      todayEarnings: todayByWallet.get(w.id) ?? 0,
    }));

    return NextResponse.json({
      wallets: walletsWithToday,
      totalBalance: total,
      recentTransactions,
      fullName: user.fullName,
      plan,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
