import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet, debitWallet } from "@/lib/server/wallet";
import { getSetting } from "@/lib/server/settings";

export async function GET() {
  try {
    const user = await requireUser();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [rewards, spinsToday, history, extraSpinPrice] = await Promise.all([
      prisma.spinReward.findMany({ where: { isActive: true } }),
      prisma.spinHistory.count({ where: { userId: user.id, createdAt: { gte: startOfDay } } }),
      prisma.spinHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { spinReward: { select: { label: true, amount: true } } },
      }),
      getSetting("spin_extra_spin_price", 50),
    ]);

    return NextResponse.json({
      rewards,
      canSpin: spinsToday === 0,
      spinsToday,
      extraSpinPrice,
      history: history.map((h) => ({
        id: h.id,
        label: h.spinReward.label,
        amount: h.spinReward.amount,
        createdAt: h.createdAt,
      })),
    });
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
    const isPaidSpin = spinsToday > 0;
    const extraSpinPrice = await getSetting("spin_extra_spin_price", 50);

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
      if (isPaidSpin) {
        await debitWallet({
          userId: user.id,
          type: "MAIN",
          amount: extraSpinPrice,
          reason: "EXTRA_SPIN_PURCHASE",
          description: "Bought an extra spin",
          client: tx,
        });
      }

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

    return NextResponse.json({ reward: result, paid: isPaidSpin, pricePaid: isPaidSpin ? extraSpinPrice : 0 });
  } catch (error) {
    return handleApiError(error);
  }
}
