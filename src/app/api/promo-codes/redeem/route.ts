import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";

const schema = z.object({ code: z.string().trim().toUpperCase().min(3) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { code } = schema.parse(await req.json());

    const promo = await prisma.promoCode.findUnique({ where: { code } });
    if (!promo || !promo.isActive) return jsonError("Invalid promo code", 404);
    if (promo.expiresAt && promo.expiresAt < new Date()) return jsonError("This promo code has expired", 410);
    if (promo.redemptionCount >= promo.maxRedemptions) return jsonError("This promo code has been fully redeemed", 410);

    const already = await prisma.promoCodeRedemption.findUnique({
      where: { userId_promoCodeId: { userId: user.id, promoCodeId: promo.id } },
    });
    if (already) return jsonError("You've already redeemed this code", 409);

    await prisma.$transaction(async (tx) => {
      await tx.promoCodeRedemption.create({ data: { userId: user.id, promoCodeId: promo.id } });
      await tx.promoCode.update({ where: { id: promo.id }, data: { redemptionCount: { increment: 1 } } });
      await creditWallet({
        userId: user.id,
        type: promo.wallet,
        amount: Number(promo.amount),
        reason: "ADMIN_ADJUSTMENT",
        description: `Promo code redeemed: ${promo.code}`,
        client: tx,
      });
    });

    return NextResponse.json({ amount: Number(promo.amount), wallet: promo.wallet });
  } catch (error) {
    return handleApiError(error);
  }
}
