import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, handleApiError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";

/**
 * Meant to be hit once a day by an external cron job (DirectAdmin's Cron
 * Jobs, since this app has no built-in scheduler on shared hosting) with
 * `Authorization: Bearer <CRON_SECRET>`. Safe to call more often than daily
 * or to miss a day entirely - each active investment tracks its own
 * nextPayoutAt and this catches up however many days' payouts are due,
 * rather than assuming exactly one day passed since the last run.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) return jsonError("CRON_SECRET is not configured", 500);

    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return jsonError("Unauthorized", 401);
    }

    const now = new Date();
    const due = await prisma.userMiningPlan.findMany({
      where: { status: "ACTIVE", nextPayoutAt: { lte: now } },
      include: { plan: true },
    });

    let processed = 0;
    let totalPaidOut = 0;

    for (const investment of due) {
      const result = await prisma.$transaction(async (tx) => {
        let cursor = await tx.userMiningPlan.findUniqueOrThrow({ where: { id: investment.id } });
        let paidThisRun = 0;
        let payoutsThisRun = 0;

        while (cursor.status === "ACTIVE" && cursor.nextPayoutAt <= now) {
          const dailyReturn = Number(investment.plan.dailyReturn);

          await creditWallet({
            userId: cursor.userId,
            type: "MAIN",
            amount: dailyReturn,
            reason: "MINING_PLAN_PAYOUT",
            description: `Daily return: ${investment.plan.name}`,
            client: tx,
          });

          await tx.miningPlanPayout.create({
            data: { userMiningPlanId: cursor.id, userId: cursor.userId, amount: dailyReturn },
          });

          const reachedEnd = cursor.nextPayoutAt >= cursor.endsAt;
          const nextPayoutAt = new Date(cursor.nextPayoutAt.getTime() + 24 * 60 * 60 * 1000);

          cursor = await tx.userMiningPlan.update({
            where: { id: cursor.id },
            data: {
              totalEarned: { increment: dailyReturn },
              nextPayoutAt,
              status: reachedEnd ? "COMPLETED" : "ACTIVE",
            },
          });

          paidThisRun += dailyReturn;
          payoutsThisRun += 1;
        }

        return { paidThisRun, payoutsThisRun, completed: cursor.status === "COMPLETED", userId: cursor.userId };
      });

      if (result.payoutsThisRun > 0) {
        processed += 1;
        totalPaidOut += result.paidThisRun;
        notifyUser({
          userId: result.userId,
          title: result.completed ? "Mining plan completed" : "Mining plan payout",
          body: result.completed
            ? `Your ${investment.plan.name} investment has finished - your final payout of ${result.paidThisRun} was credited.`
            : `Your ${investment.plan.name} investment paid out ${result.paidThisRun} today.`,
          type: "WALLET",
        }).catch(() => {});
      }
    }

    return NextResponse.json({ processed, totalPaidOut });
  } catch (error) {
    return handleApiError(error);
  }
}
