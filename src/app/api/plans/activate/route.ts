import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { debitWallet, creditWallet } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";
import { generateReference } from "@/lib/utils";

const schema = z.object({ planId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { planId } = schema.parse(await req.json());
    const { ipAddress, userAgent } = getRequestMeta(req);

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) return jsonError("Plan not found", 404);

    const reference = generateReference("PLAN");

    await prisma.$transaction(async (tx) => {
      await debitWallet({
        userId: user.id,
        type: "MAIN",
        amount: Number(plan.price),
        reason: "PLAN_ACTIVATION",
        description: `Activated ${plan.name}`,
        reference: `${reference}-DEBIT`,
        client: tx,
      });

      await tx.user.update({
        where: { id: user.id },
        data: { planId: plan.id, planActivatedAt: new Date() },
      });

      if (user.referredById) {
        await creditWallet({
          userId: user.referredById,
          type: "REFERRAL",
          amount: Number(plan.referralCommission),
          reason: "PLAN_COMMISSION",
          description: `Commission: your referral activated ${plan.name}`,
          reference: `${reference}-COMMISSION`,
          client: tx,
        });

        await notifyUser({
          userId: user.referredById,
          title: "Referral commission earned",
          body: `A friend you referred activated ${plan.name} - you earned a commission.`,
          type: "REFERRAL",
          client: tx,
        });
      }
    });

    await notifyUser({
      userId: user.id,
      title: "Plan activated",
      body: `You activated ${plan.name}. Your new rates are live.`,
      type: "SYSTEM",
    });
    await writeAuditLog({
      userId: user.id,
      action: "plan.activate",
      ipAddress,
      userAgent,
      metadata: { planId: plan.id, planName: plan.name, price: Number(plan.price) },
    });

    return NextResponse.json({ plan });
  } catch (error) {
    return handleApiError(error);
  }
}
