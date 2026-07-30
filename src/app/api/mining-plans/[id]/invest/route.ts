import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { debitWallet } from "@/lib/server/wallet";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { ipAddress, userAgent } = getRequestMeta(req);

    const plan = await prisma.miningPlan.findUnique({ where: { id } });
    if (!plan || !plan.isActive) {
      return jsonError("This mining plan is not available", 404);
    }

    const startedAt = new Date();
    const nextPayoutAt = new Date(startedAt.getTime() + 24 * 60 * 60 * 1000);
    const endsAt = new Date(startedAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const investment = await prisma.$transaction(async (tx) => {
      await debitWallet({
        userId: user.id,
        type: "MAIN",
        amount: Number(plan.price),
        reason: "MINING_PLAN_PURCHASE",
        description: `Invested in ${plan.name}`,
        client: tx,
      });

      return tx.userMiningPlan.create({
        data: {
          userId: user.id,
          planId: plan.id,
          amountInvested: plan.price,
          startedAt,
          nextPayoutAt,
          endsAt,
        },
      });
    });

    await writeAuditLog({
      userId: user.id,
      action: "mining_plan.invest",
      ipAddress,
      userAgent,
      metadata: { planId: plan.id, planName: plan.name, amount: Number(plan.price) },
    });

    return NextResponse.json({ investment });
  } catch (error) {
    return handleApiError(error);
  }
}
