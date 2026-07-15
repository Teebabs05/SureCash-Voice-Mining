import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";
import { checkAchievements } from "@/lib/server/gamification";
import { writeAuditLog } from "@/lib/server/audit";

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

  // Final confirmation for withdrawals we sent through the Paystack Transfer
  // API in withdrawal-payout.ts — the transfer's `reference` field was set
  // to our own Withdrawal.reference, so we can look it up directly.
  if (event.event === "transfer.success") {
    const reference = event.data.reference as string;

    await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({ where: { reference } });
      if (!withdrawal || withdrawal.status === "PAID") return;

      await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: "PAID", processedAt: new Date() },
      });

      await notifyUser({
        userId: withdrawal.userId,
        title: "Withdrawal paid",
        body: `Your withdrawal of ${withdrawal.amount} has been sent to your bank account.`,
        type: "WALLET",
        client: tx,
      });

      await checkAchievements(withdrawal.userId, "WITHDRAWAL_PAID", tx);
    });
  }

  if (event.event === "transfer.failed" || event.event === "transfer.reversed") {
    const reference = event.data.reference as string;
    const withdrawal = await prisma.withdrawal.findUnique({ where: { reference } });

    if (withdrawal && withdrawal.status === "PROCESSING") {
      // Leave funds debited (already reserved for payout) and drop back to
      // PENDING so an admin can retry or complete the payout manually —
      // don't auto-reverse, since the transfer may still be retriable.
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: "PENDING", autoPayoutError: event.data.message ?? "Transfer failed at the gateway" },
      });
      await notifyUser({
        userId: withdrawal.userId,
        title: "Withdrawal delayed",
        body: "Your withdrawal couldn't be completed automatically and is now under manual review.",
        type: "WALLET",
      });
      await writeAuditLog({
        userId: withdrawal.userId,
        action: "withdrawal.auto_payout_webhook_failed",
        metadata: { withdrawalId: withdrawal.id, event: event.event },
      });
    }
  }

  return NextResponse.json({ received: true });
}
