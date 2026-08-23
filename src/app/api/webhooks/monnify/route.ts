import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";
import { checkAchievements } from "@/lib/server/gamification";
import { writeAuditLog } from "@/lib/server/audit";
import { verifyWebhookSignature } from "@/lib/payments/monnify";

/**
 * Monnify webhook receiver — best-effort, see the confidence note in
 * src/lib/payments/monnify.ts. The `eventType` + `eventData` wrapper shape
 * and the `monnify-signature` HMAC-SHA512 header are the parts built from
 * solid training knowledge; the exact field names inside `eventData` are
 * extracted defensively (multiple common key names tried) in case they
 * differ from what's coded here.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("monnify-signature");

  if (!(await verifyWebhookSignature(rawBody, signature))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventType = String(event.eventType ?? event.event ?? "").toUpperCase();
  const data = event.eventData ?? event.data ?? {};

  if (eventType.includes("TRANSACTION")) {
    const reference: string | undefined = data.paymentReference ?? data.reference;
    const amount: number = Number(data.amountPaid ?? data.amount ?? 0);
    const status = String(data.paymentStatus ?? data.status ?? "").toUpperCase();
    const succeeded = status === "PAID" || status === "OVERPAID" || eventType.includes("SUCCESSFUL");

    if (reference && succeeded && amount > 0) {
      await prisma.$transaction(async (tx) => {
        // Atomic status flip - see the paystack webhook for why a plain
        // read-then-check isn't safe against redelivered webhooks.
        const claimed = await tx.deposit.updateMany({
          where: { reference, status: { not: "APPROVED" } },
          data: { status: "APPROVED", verifiedAt: new Date(), gatewayData: event },
        });
        if (claimed.count === 0) return;

        const deposit = await tx.deposit.findUniqueOrThrow({ where: { reference } });

        await creditWallet({
          userId: deposit.userId,
          type: "MAIN",
          amount,
          reason: "DEPOSIT",
          description: `Monnify deposit ${reference}`,
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

  if (eventType.includes("DISBURSEMENT")) {
    const reference: string | undefined = data.reference;
    const status = String(data.status ?? "").toUpperCase();
    const succeeded = status === "SUCCESS" || eventType.includes("SUCCESSFUL");
    const failed = status === "FAILED" || eventType.includes("FAILED");

    if (!reference) return NextResponse.json({ received: true });
    const withdrawal = await prisma.withdrawal.findUnique({ where: { reference } });
    if (!withdrawal) return NextResponse.json({ received: true, note: "No matching withdrawal" });

    if (succeeded && withdrawal.status !== "PAID") {
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.withdrawal.updateMany({
          where: { id: withdrawal.id, status: { not: "PAID" } },
          data: { status: "PAID", processedAt: new Date() },
        });
        if (claimed.count === 0) return;
        await notifyUser({
          userId: withdrawal.userId,
          title: "Withdrawal paid",
          body: `Your withdrawal of ${withdrawal.amount} has been sent to your bank account.`,
          type: "WALLET",
          client: tx,
        });
        await checkAchievements(withdrawal.userId, "WITHDRAWAL_PAID", tx);
      });
    } else if (failed && withdrawal.status === "PROCESSING") {
      // Same policy as the Paystack/BillStack webhooks: drop back to PENDING
      // for manual admin retry/completion rather than auto-reversing.
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: "PENDING", autoPayoutError: data.message ?? "Transfer failed at the gateway" },
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
        metadata: { withdrawalId: withdrawal.id, provider: "MONNIFY" },
      });
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true, note: "Unrecognized event" });
}
