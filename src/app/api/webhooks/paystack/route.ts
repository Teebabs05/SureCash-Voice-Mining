import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers.get("x-paystack-signature");

  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const reference = event.data.reference as string;
    const amount = event.data.amount / 100;

    await prisma.$transaction(async (tx) => {
      const deposit = await tx.deposit.findUnique({ where: { reference } });
      if (!deposit || deposit.status === "APPROVED") return;

      await tx.deposit.update({
        where: { id: deposit.id },
        data: { status: "APPROVED", verifiedAt: new Date(), gatewayData: event.data },
      });

      await creditWallet({
        userId: deposit.userId,
        type: "MAIN",
        amount,
        reason: "DEPOSIT",
        description: `Paystack deposit ${reference}`,
        client: tx,
      });

      await notifyUser({
        userId: deposit.userId,
        title: "Deposit successful",
        body: `Your deposit of ${amount} has been credited to your Main wallet.`,
        type: "WALLET",
        client: tx,
      });
    });
  }

  return NextResponse.json({ received: true });
}
