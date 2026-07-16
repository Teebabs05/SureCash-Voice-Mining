import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";
import { checkAchievements } from "@/lib/server/gamification";
import { writeAuditLog } from "@/lib/server/audit";
import { verifyWebhookSignature } from "@/lib/payments/flutterwave";

/**
 * Flutterwave webhook receiver. Unlike the HMAC-based schemes elsewhere in
 * this file, Flutterwave's "signature" is a static secret string
 * (FLUTTERWAVE_WEBHOOK_HASH, set to match whatever you configured in their
 * dashboard) echoed back verbatim in the `verif-hash` header — see
 * src/lib/payments/flutterwave.ts.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("verif-hash");
  if (!(await verifyWebhookSignature(signature))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = await req.json().catch(() => null);
  if (!event) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const eventType = String(event.event ?? "").toLowerCase();
  const data = event.data ?? {};

  if (eventType.includes("charge")) {
    const reference: string | undefined = data.tx_ref;
    const amount = Number(data.amount ?? 0);
    const status = String(data.status ?? "").toLowerCase();

    if (reference && status === "successful" && amount > 0) {
      await prisma.$transaction(async (tx) => {
        const deposit = await tx.deposit.findUnique({ where: { reference } });
        if (!deposit || deposit.status === "APPROVED") return;

        await tx.deposit.update({
          where: { id: deposit.id },
          data: { status: "APPROVED", verifiedAt: new Date(), gatewayData: event },
        });

        await creditWallet({
          userId: deposit.userId,
          type: "MAIN",
          amount,
          reason: "DEPOSIT",
          description: `Flutterwave deposit ${reference}`,
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

  if (eventType.includes("transfer")) {
    const reference: string | undefined = data.reference;
    const status = String(data.status ?? "").toLowerCase();

    if (!reference) return NextResponse.json({ received: true });
    const withdrawal = await prisma.withdrawal.findUnique({ where: { reference } });
    if (!withdrawal) return NextResponse.json({ received: true, note: "No matching withdrawal" });

    if (status === "successful" && withdrawal.status !== "PAID") {
      await prisma.$transaction(async (tx) => {
        await tx.withdrawal.update({ where: { id: withdrawal.id }, data: { status: "PAID", processedAt: new Date() } });
        await notifyUser({
          userId: withdrawal.userId,
          title: "Withdrawal paid",
          body: `Your withdrawal of ${withdrawal.amount} has been sent to your bank account.`,
          type: "WALLET",
          client: tx,
        });
        await checkAchievements(withdrawal.userId, "WITHDRAWAL_PAID", tx);
      });
    } else if (status === "failed" && withdrawal.status === "PROCESSING") {
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: "PENDING", autoPayoutError: data.complete_message ?? "Transfer failed at the gateway" },
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
        metadata: { withdrawalId: withdrawal.id, provider: "FLUTTERWAVE" },
      });
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true, note: "Unrecognized event" });
}
