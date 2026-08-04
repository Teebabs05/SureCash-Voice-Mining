import "server-only";
import { BillServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { debitWallet, creditWallet } from "@/lib/server/wallet";
import { generateReference } from "@/lib/utils";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog } from "@/lib/server/audit";
import type { VtuPurchaseResult } from "@/lib/payments/vtu-provider";

const SERVICE_LABELS: Record<BillServiceType, string> = {
  AIRTIME: "Airtime",
  DATA: "Data",
  ELECTRICITY: "Electricity",
  CABLE_TV: "Cable TV",
};

/**
 * Debits the user's MAIN wallet (never ENGAGEMENT/SALES — see the schema
 * comment on BillPurchase), creates the purchase record, then calls the
 * provider. On any failure the debit is reversed atomically with the
 * status flip, so a failed purchase never leaves money "stuck" - same
 * refund-on-failure guarantee the mining plan / withdrawal flows have.
 */
export async function purchaseBill(params: {
  userId: string;
  provider: "VTU_NG" | "VTUAFRICA";
  serviceType: BillServiceType;
  serviceId: string;
  variationId?: string;
  recipient: string;
  amount: number;
  call: (reference: string) => Promise<VtuPurchaseResult>;
}) {
  const reference = generateReference("BILL");

  const purchase = await prisma.$transaction(async (tx) => {
    await debitWallet({
      userId: params.userId,
      type: "MAIN",
      amount: params.amount,
      reason: "BILLS_PURCHASE",
      description: `${SERVICE_LABELS[params.serviceType]} - ${params.recipient}`,
      reference,
      client: tx,
    });
    return tx.billPurchase.create({
      data: {
        userId: params.userId,
        provider: params.provider,
        serviceType: params.serviceType,
        serviceId: params.serviceId,
        variationId: params.variationId,
        recipient: params.recipient,
        amount: params.amount,
        reference,
      },
    });
  });

  let result: VtuPurchaseResult;
  try {
    result = await params.call(reference);
  } catch (error) {
    result = { status: "failed", message: error instanceof Error ? error.message : "Purchase request failed" };
  }

  await resolvePurchase(purchase.id, result);

  await writeAuditLog({
    userId: params.userId,
    action: "bills.purchase",
    metadata: { billPurchaseId: purchase.id, reference, serviceType: params.serviceType, amount: params.amount },
  });

  return prisma.billPurchase.findUniqueOrThrow({ where: { id: purchase.id } });
}

/**
 * Applies a provider result to a purchase — used both right after the
 * initial call and from the requery reconciliation path, since a
 * "processing" purchase resolving later goes through the exact same
 * success/failure handling.
 */
export async function resolvePurchase(id: string, result: VtuPurchaseResult) {
  const purchase = await prisma.billPurchase.findUnique({ where: { id } });
  if (!purchase || purchase.status === "SUCCESS" || purchase.status === "FAILED" || purchase.status === "REFUNDED") return;

  if (result.status === "completed") {
    await prisma.billPurchase.update({
      where: { id },
      data: {
        status: "SUCCESS",
        providerOrderId: result.providerOrderId,
        token: result.token,
        units: result.units,
        providerResponse: (result.raw ?? undefined) as object | undefined,
        processedAt: new Date(),
      },
    });
    await notifyUser({
      userId: purchase.userId,
      title: "Purchase successful",
      body: `Your ${SERVICE_LABELS[purchase.serviceType]} purchase of ${purchase.amount} was successful.`,
      type: "WALLET",
    });
    return;
  }

  if (result.status === "failed" || result.status === "refunded") {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.billPurchase.updateMany({
        where: { id, status: { in: ["PENDING", "PROCESSING"] } },
        data: {
          status: "FAILED",
          errorMessage: result.message ?? "Purchase failed",
          providerResponse: (result.raw ?? undefined) as object | undefined,
          processedAt: new Date(),
        },
      });
      if (claimed.count === 0) return;
      await creditWallet({
        userId: purchase.userId,
        type: "MAIN",
        amount: Number(purchase.amount),
        reason: "BILLS_PURCHASE",
        description: `Refund - ${SERVICE_LABELS[purchase.serviceType]} purchase failed`,
        client: tx,
      });
    });
    await notifyUser({
      userId: purchase.userId,
      title: "Purchase failed",
      body: `Your ${SERVICE_LABELS[purchase.serviceType]} purchase couldn't be completed and has been refunded to your wallet.`,
      type: "WALLET",
    });
    return;
  }

  // Still processing on the provider's side - leave it, requery later.
  await prisma.billPurchase.update({
    where: { id },
    data: {
      status: "PROCESSING",
      providerOrderId: result.providerOrderId ?? purchase.providerOrderId,
      providerResponse: (result.raw ?? undefined) as object | undefined,
    },
  });
}
