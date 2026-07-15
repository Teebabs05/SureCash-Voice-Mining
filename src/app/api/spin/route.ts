import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";

export async function GET() {
  try {
    const user = await requireUser();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [rewards, spinsToday] = await Promise.all([
      prisma.spinReward.findMany({ where: { isActive: true } }),
      prisma.spinHistory.count({ where: { userId: user.id, createdAt: { gte: startOfDay } } }),
    ]);

    return NextResponse.json({ rewards, canSpin: spinsToday === 0 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const spinsToday = await prisma.spinHistory.count({
      where: { userId: user.id, createdAt: { gte: startOfDay } },
    });
    if (spinsToday > 0) {
      return jsonError("You've already spun today. Come back tomorrow!", 429);
    }

    const rewards = await prisma.spinReward.findMany({ where: { isActive: true } });
    if (rewards.length === 0) {
      return jsonError("The spin wheel is not available right now", 503);
    }

    const totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen = rewards[rewards.length - 1];
    for (const reward of rewards) {
      if (roll < reward.weight) {
        chosen = reward;
        break;
      }
      roll -= reward.weight;
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.spinHistory.create({ data: { userId: user.id, spinRewardId: chosen.id } });

      if (Number(chosen.amount) > 0) {
        await creditWallet({
          userId: user.id,
          type: chosen.wallet,
          amount: Number(chosen.amount),
          reason: "SPIN_REWARD",
          description: `Lucky spin: ${chosen.label}`,
          client: tx,
        });
      }

      return chosen;
    });

    return NextResponse.json({ reward: result });
  } catch (error) {
    return handleApiError(error);
  }
}
