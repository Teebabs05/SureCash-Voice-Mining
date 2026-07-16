import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";
import { checkAchievements } from "@/lib/server/gamification";
import { writeAuditLog } from "@/lib/server/audit";

/**
 * BillStack webhook receiver.
 *
 * IMPORTANT — best-effort: BillStack's docs were unreachable from the build
 * environment, so the real payload shape and any signature-header scheme
 * they use could not be confirmed. Two safeguards make this defensible
 * without that confirmation:
 *  1. Auth is a shared-secret token in the webhook URL itself (set the
 *     BillStack dashboard's webhook URL to
 *     `<domain>/api/webhooks/billstack?token=<BILLSTACK_WEBHOOK_SECRET>`),
 *     not a body/header signature — verify this is still needed once you
 *     can confirm whether BillStack signs requests, and layer that
 *     verification on top of (not instead of) this token check.
 *  2. Field extraction below tries several common key names defensively;
 *     the raw payload is logged so you can adjust the field names once you
 *     see a real event come through.
 */
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.BILLSTACK_WEBHOOK_SECRET;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Invalid webhook token" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  console.log("[billstack:webhook]", JSON.stringify(body));

  const data = body.data ?? body;
  const eventType = String(body.event ?? body.type ?? "").toLowerCase();
  const reference: string | undefined = data.reference ?? data.transactionRef ?? data.sessionId ?? data.session_id;
  const amount: number | undefined = data.amount ?? data.settled_amount;
  const status: string = String(data.status ?? "").toLowerCase();
  const accountNumber: string | undefined = data.account_number ?? data.accountNumber ?? data.virtual_account_number;

  const isPaymentEvent = eventType.includes("payment") || eventType.includes("collection") || eventType.includes("credit");
  const isTransferEvent = eventType.includes("transfer") || eventType.includes("disburse") || eventType.includes("payout");

  if (isPaymentEvent && reference && amount && accountNumber) {
    const virtualAccount = await prisma.virtualAccount.findFirst({ where: { accountNumber } });
    if (!virtualAccount) {
      return NextResponse.json({ received: true, note: "No matching virtual account" });
    }

    const succeeded = status === "" || status.includes("success") || status.includes("completed");
    if (!succeeded) return NextResponse.json({ received: true });

    await prisma.$transaction(async (tx) => {
      const existing = await tx.deposit.findUnique({ where: { reference } });
      if (existing) return;

      await tx.deposit.create({
        data: {
          userId: virtualAccount.userId,
          amount,
          method: "BILLSTACK",
          reference,
          status: "APPROVED",
          verifiedAt: new Date(),
          gatewayData: body,
        },
      });

      await creditWallet({
        userId: virtualAccount.userId,
        type: "MAIN",
        amount,
        reason: "DEPOSIT",
        description: `BillStack bank transfer ${reference}`,
        client: tx,
      });

      await notifyUser({
        userId: virtualAccount.userId,
        title: "Deposit successful",
        body: `Your deposit of ${amount} has been credited to your Main wallet.`,
        type: "WALLET",
        client: tx,
      });
    });

    return NextResponse.json({ received: true });
  }

  if (isTransferEvent && reference) {
    const withdrawal = await prisma.withdrawal.findUnique({ where: { reference } });
    if (!withdrawal) return NextResponse.json({ received: true, note: "No matching withdrawal" });

    const succeeded = status.includes("success") || status.includes("completed");
    const failed = status.includes("fail") || status.includes("revers");

    if (succeeded && withdrawal.status !== "PAID") {
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
    } else if (failed && withdrawal.status === "PROCESSING") {
      // Same policy as the Paystack webhook: drop back to PENDING for
      // manual admin retry/completion rather than auto-reversing.
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
        metadata: { withdrawalId: withdrawal.id, provider: "BILLSTACK" },
      });
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true, note: "Unrecognized event" });
}
