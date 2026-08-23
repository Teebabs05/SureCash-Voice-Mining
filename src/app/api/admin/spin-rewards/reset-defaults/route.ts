import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

// 50/70/100/200 combine for exactly a 10% chance to win per spin (weighted
// toward the smaller amounts); 500/1000 are shown on the wheel but carry
// zero weight so they can never actually be won; the rest is "Try Again".
const DEFAULTS = [
  { label: "Try Again", amount: 0, wallet: "ENGAGEMENT" as const, weight: 900, colorHex: "#94A3B8" },
  { label: "₦50 Bonus", amount: 50, wallet: "ENGAGEMENT" as const, weight: 40, colorHex: "#0D8A82" },
  { label: "₦70 Bonus", amount: 70, wallet: "ENGAGEMENT" as const, weight: 30, colorHex: "#2563EB" },
  { label: "₦100 Bonus", amount: 100, wallet: "ENGAGEMENT" as const, weight: 20, colorHex: "#F5A623" },
  { label: "₦200 Bonus", amount: 200, wallet: "ENGAGEMENT" as const, weight: 10, colorHex: "#12B76A" },
  { label: "₦500 Jackpot", amount: 500, wallet: "ENGAGEMENT" as const, weight: 0, colorHex: "#E2497A" },
  { label: "₦1000 Jackpot", amount: 1000, wallet: "ENGAGEMENT" as const, weight: 0, colorHex: "#7C3AED" },
];

export async function POST() {
  try {
    await requireAdmin();

    const existing = await prisma.spinReward.findMany();
    const defaultLabels = new Set(DEFAULTS.map((d) => d.label));

    await prisma.$transaction(async (tx) => {
      for (const row of existing) {
        if (!defaultLabels.has(row.label)) {
          await tx.spinReward.update({ where: { id: row.id }, data: { isActive: false } });
        }
      }

      for (const def of DEFAULTS) {
        const match = existing.find((r) => r.label === def.label);
        if (match) {
          await tx.spinReward.update({ where: { id: match.id }, data: { ...def, isActive: true } });
        } else {
          await tx.spinReward.create({ data: { ...def, isActive: true } });
        }
      }
    });

    const rewards = await prisma.spinReward.findMany({ orderBy: { amount: "asc" } });
    return NextResponse.json({ rewards });
  } catch (error) {
    return handleApiError(error);
  }
}
