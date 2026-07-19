import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/server/notifications";
import { checkAchievements } from "@/lib/server/gamification";
import { writeAuditLog } from "@/lib/server/audit";
import { verifyWebhookSignature } from "@/lib/payments/payvessel";

/**
 * PayVessel webhook receiver — withdrawal/transfer confirmation only (no
 * deposit handling; see the scope note in src/lib/payments/payvessel.ts).
 * Best-effort like the other gateways: the signature scheme (HMAC-SHA512
 * over the full raw body, `payvessel-http-signature` header) is reasonably
 * well-sourced, but the event/field names below are extracted defensively
 * since the exact payload shape wasn't confirmed.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("payvessel-http-signature");

  if (!(await verifyWebhookSignature(rawBody, signature))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const data = body.data ?? body;
  const reference: string | undefined = data.reference ?? data.transaction_reference;
  const status = String(data.status ?? "").toLowerCase();

  if (!reference) return NextResponse.json({ received: true, note: "No reference" });

  const withdrawal = await prisma.withdrawal.findUnique({ where: { reference } });
  if (!withdrawal) return NextResponse.json({ received: true, note: "No matching withdrawal" });

  const succeeded = status === "success" || status === "successful" || status === "completed";
  const failed = status === "failed" || status === "reversed";

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
      metadata: { withdrawalId: withdrawal.id, provider: "PAYVESSEL" },
    });
  }

  return NextResponse.json({ received: true });
}
