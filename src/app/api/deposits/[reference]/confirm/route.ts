import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";
import { getPaymentProvider } from "@/lib/payments/provider";

const GATEWAY_METHODS = ["PAYSTACK", "MONNIFY", "KORAPAY", "FLUTTERWAVE"] as const;
type GatewayMethod = (typeof GATEWAY_METHODS)[number];

function isGatewayMethod(method: string): method is GatewayMethod {
  return (GATEWAY_METHODS as readonly string[]).includes(method);
}

/**
 * Called by the client right after the gateway redirects back into the app,
 * so the "deposit successful" popup has something authoritative to show
 * instead of just trusting the redirect happened. The webhook is still the
 * primary way deposits get credited - this only exists as a same-request
 * fallback for the (rare, but real on shared hosting) case where the
 * webhook is slow or never arrives, so the user isn't left staring at a
 * "pending" balance for a payment the gateway already confirmed.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const user = await requireUser();
    const { reference } = await params;

    const deposit = await prisma.deposit.findUnique({ where: { reference } });
    if (!deposit || deposit.userId !== user.id) {
      return jsonError("Deposit not found", 404);
    }

    if (deposit.status === "APPROVED") {
      return NextResponse.json({ status: "success", amount: Number(deposit.amount) });
    }
    if (deposit.status === "REJECTED") {
      return NextResponse.json({ status: "failed" });
    }
    if (!isGatewayMethod(deposit.method)) {
      return NextResponse.json({ status: "pending" });
    }

    try {
      const provider = getPaymentProvider(deposit.method);
      const result = await provider.verify(reference);

      if (result.status === "success" && result.amount > 0) {
        const credited = await prisma.$transaction(async (tx) => {
          // Same atomic claim pattern as the webhooks - whichever of the
          // webhook or this endpoint gets there first wins, the other is a
          // no-op, so a payment never gets credited twice.
          const claimed = await tx.deposit.updateMany({
            where: { reference, status: { not: "APPROVED" } },
            data: { status: "APPROVED", verifiedAt: new Date() },
          });
          if (claimed.count === 0) return false;

          await creditWallet({
            userId: deposit.userId,
            type: "MAIN",
            amount: result.amount,
            reason: "DEPOSIT",
            description: `${deposit.method} deposit ${reference}`,
            client: tx,
          });
          await notifyUser({
            userId: deposit.userId,
            title: "Deposit successful",
            body: `Your deposit of ${result.amount} has been credited to your Main wallet.`,
            type: "WALLET",
            client: tx,
          });
          return true;
        });

        if (credited) return NextResponse.json({ status: "success", amount: result.amount });
        // Someone else (the webhook) already claimed it - re-read the fresh
        // amount rather than assuming result.amount is still accurate.
        const fresh = await prisma.deposit.findUnique({ where: { reference } });
        return NextResponse.json({ status: "success", amount: Number(fresh?.amount ?? result.amount) });
      }

      if (result.status === "failed") {
        return NextResponse.json({ status: "failed" });
      }
    } catch {
      // Gateway verify call itself failed/unavailable - fall through to
      // "pending" rather than surfacing an error; the webhook may still
      // land normally.
    }

    return NextResponse.json({ status: "pending" });
  } catch (error) {
    return handleApiError(error);
  }
}
