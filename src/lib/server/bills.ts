import "server-only";
import { BillServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { debitWallet, creditWallet } from "@/lib/server/wallet";
import { generateReference, formatCurrency } from "@/lib/utils";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog } from "@/lib/server/audit";
import type { VtuPurchaseResult, AirtimeToCashResult } from "@/lib/payments/vtu-provider";

const SERVICE_LABELS: Record<BillServiceType, string> = {
  AIRTIME: "Airtime",
  DATA: "Data",
  ELECTRICITY: "Electricity",
  CABLE_TV: "Cable TV",
  AIRTIME_TO_CASH: "Airtime to Cash",
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

/**
 * Airtime-to-Cash runs the opposite direction from every other bill: no
 * wallet debit up front (there's nothing to charge - the user is sending
 * VTUAfrica real airtime outside the app), and VTUAfrica's own docs say
 * this always comes back "Processing" initially - the real outcome (and
 * the actual amount to credit, after VTUAfrica's conversion fee) only
 * arrives via their webhook. See resolveAirtimeToCashWebhook.
 */
export async function initiateAirtimeToCash(params: {
  userId: string;
  network: string;
  senderEmail: string;
  senderPhone: string;
  amount: number;
  sitePhone: string;
  convert: (reference: string) => Promise<AirtimeToCashResult>;
}) {
  const reference = generateReference("A2C");

  const purchase = await prisma.billPurchase.create({
    data: {
      userId: params.userId,
      provider: "VTUAFRICA",
      serviceType: "AIRTIME_TO_CASH",
      serviceId: params.network,
      recipient: params.senderPhone,
      amount: params.amount,
      reference,
    },
  });

  let result: AirtimeToCashResult;
  try {
    result = await params.convert(reference);
  } catch (error) {
    result = { status: "failed", message: error instanceof Error ? error.message : "Conversion request failed" };
  }

  if (result.status === "failed") {
    await prisma.billPurchase.update({
      where: { id: purchase.id },
      data: {
        status: "FAILED",
        errorMessage: result.message ?? "Conversion request failed",
        providerResponse: (result.raw ?? undefined) as object | undefined,
        processedAt: new Date(),
      },
    });
  } else {
    // "processing" is VTUAfrica's documented normal response here - no
    // wallet action until the webhook confirms the real credited amount.
    await prisma.billPurchase.update({
      where: { id: purchase.id },
      data: { status: "PROCESSING", providerResponse: (result.raw ?? undefined) as object | undefined },
    });
  }

  await writeAuditLog({
    userId: params.userId,
    action: "bills.airtime_to_cash_initiated",
    metadata: { billPurchaseId: purchase.id, reference, network: params.network, amount: params.amount },
  });

  return prisma.billPurchase.findUniqueOrThrow({ where: { id: purchase.id } });
}

/**
 * Called from /api/webhooks/vtuafrica once VTUAfrica confirms an
 * Airtime2Cash conversion - credits ENGAGEMENT with the real `credit`
 * amount from their payload (after their conversion fee), never the
 * claimed `amount`. Idempotent: safe to call more than once for the same
 * reference (e.g. a redelivered webhook) since it only acts while the
 * purchase is still PENDING/PROCESSING.
 */
export async function resolveAirtimeToCashWebhook(
  reference: string,
  result: { status: "completed" | "failed"; creditAmount?: number; message?: string; raw: unknown }
): Promise<boolean> {
  const purchase = await prisma.billPurchase.findUnique({ where: { reference } });
  if (!purchase || purchase.serviceType !== "AIRTIME_TO_CASH") return false;
  if (purchase.status === "SUCCESS" || purchase.status === "FAILED") return true;

  if (result.status === "completed" && result.creditAmount) {
    const creditAmount = result.creditAmount;
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.billPurchase.updateMany({
        where: { id: purchase.id, status: { in: ["PENDING", "PROCESSING"] } },
        data: {
          status: "SUCCESS",
          creditAmount,
          providerResponse: (result.raw ?? undefined) as object | undefined,
          processedAt: new Date(),
        },
      });
      if (claimed.count === 0) return;
      await creditWallet({
        userId: purchase.userId,
        type: "ENGAGEMENT",
        amount: creditAmount,
        reason: "BILLS_PURCHASE",
        description: "Airtime to Cash conversion",
        client: tx,
      });
    });
    await notifyUser({
      userId: purchase.userId,
      title: "Airtime converted to cash",
      body: `${formatCurrency(creditAmount)} has been credited to your Engagement wallet.`,
      type: "WALLET",
    });
  } else {
    await prisma.billPurchase.update({
      where: { id: purchase.id },
      data: {
        status: "FAILED",
        errorMessage: result.message ?? "Conversion failed",
        providerResponse: (result.raw ?? undefined) as object | undefined,
        processedAt: new Date(),
      },
    });
    await notifyUser({
      userId: purchase.userId,
      title: "Airtime conversion failed",
      body: result.message ?? "Your airtime-to-cash conversion couldn't be completed.",
      type: "WALLET",
    });
  }
  return true;
}
