import "server-only";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";
import { initiateBulkPayout, getBulkPayoutPayouts } from "@/lib/payments/korapay";
import { notifyUser } from "@/lib/server/notifications";
import { checkAchievements } from "@/lib/server/gamification";
import { writeAuditLog } from "@/lib/server/audit";

export const MIN_BULK_PAYOUT_COUNT = 2;
export const MAX_BULK_PAYOUT_COUNT = 50;

/**
 * Pays out several PENDING bank withdrawals in one Korapay Bulk Payout call
 * (min 2, max 50 per Korapay's own limit — see the confidence note in
 * src/lib/payments/korapay.ts). Distinct from attemptAutomaticPayout, which
 * fires per-withdrawal and can't use this endpoint since it always has
 * exactly one candidate at a time.
 */
export async function initiateKorapayBulkPayout(withdrawalIds: string[], adminId: string) {
  const ids = [...new Set(withdrawalIds)];
  if (ids.length < MIN_BULK_PAYOUT_COUNT) {
    throw new Error(`Select at least ${MIN_BULK_PAYOUT_COUNT} withdrawals for a bulk payout`);
  }
  if (ids.length > MAX_BULK_PAYOUT_COUNT) {
    throw new Error(`A Korapay bulk payout can only contain up to ${MAX_BULK_PAYOUT_COUNT} withdrawals`);
  }

  const withdrawals = await prisma.withdrawal.findMany({
    where: { id: { in: ids } },
    include: { bankAccount: true, user: true },
  });

  if (withdrawals.length !== ids.length) throw new Error("One or more withdrawals could not be found");

  for (const w of withdrawals) {
    if (w.status !== "PENDING") throw new Error(`Withdrawal ${w.reference} is not pending`);
    if (w.method !== "BANK" || !w.bankAccount) throw new Error(`Withdrawal ${w.reference} isn't a bank withdrawal`);
    if (!w.bankAccount.bankCode) {
      throw new Error(`Withdrawal ${w.reference}'s bank account has no bank code on file — review it in Admin > Bank Accounts first`);
    }
  }

  const batchReference = generateReference("KORAPAY_BATCH");

  const result = await initiateBulkPayout({
    batchReference,
    payouts: withdrawals.map((w) => ({
      reference: w.reference,
      amount: Number(w.amount),
      narration: `SureCash Mining withdrawal ${w.reference}`,
      bankCode: w.bankAccount!.bankCode,
      accountNumber: w.bankAccount!.accountNumber,
      accountName: w.bankAccount!.accountName,
      email: w.user.email,
    })),
  });

  if (result.status === "failed") {
    await writeAuditLog({
      userId: adminId,
      action: "admin.withdrawal_bulk_payout_failed",
      metadata: { batchReference, withdrawalIds: ids, message: result.message },
    });
    throw new Error(result.message ?? "Korapay bulk payout request failed");
  }

  await prisma.$transaction(async (tx) => {
    await tx.withdrawal.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "PROCESSING",
        payoutProvider: "KORAPAY",
        payoutReference: batchReference,
        autoPayoutAttempted: true,
        autoPayoutError: null,
      },
    });

    for (const w of withdrawals) {
      await notifyUser({
        userId: w.userId,
        title: "Withdrawal processing automatically",
        body: `Your withdrawal of ${w.amount} is being sent to your bank account via KORAPAY.`,
        type: "WALLET",
        client: tx,
      });
    }
  });

  await writeAuditLog({
    userId: adminId,
    action: "admin.withdrawal_bulk_payout_initiated",
    metadata: { batchReference, withdrawalIds: ids, count: ids.length },
  });

  return { batchReference, count: ids.length };
}

/**
 * Manual reconciliation fallback for a Korapay batch, same role as the
 * Binance "check status" action — polls per-payout status and updates each
 * Withdrawal row by its `reference`, in case a webhook was missed or
 * delayed.
 */
export async function syncKorapayBatch(batchReference: string, adminId: string) {
  const payouts = await getBulkPayoutPayouts(batchReference);
  if (payouts.length === 0) return { updated: 0 };

  let updated = 0;

  for (const payout of payouts) {
    if (payout.status !== "success" && payout.status !== "failed") continue;

    const withdrawal = await prisma.withdrawal.findUnique({ where: { reference: payout.reference } });
    if (!withdrawal || withdrawal.payoutReference !== batchReference) continue;

    if (payout.status === "success" && withdrawal.status !== "PAID") {
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
      updated++;
    } else if (payout.status === "failed" && withdrawal.status === "PROCESSING") {
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: "PENDING", autoPayoutError: payout.message ?? "Korapay reported this payout as failed" },
      });
      await notifyUser({
        userId: withdrawal.userId,
        title: "Withdrawal delayed",
        body: "Your withdrawal couldn't be completed automatically and is now under manual review.",
        type: "WALLET",
      });
      updated++;
    }
  }

  await writeAuditLog({
    userId: adminId,
    action: "admin.withdrawal_bulk_payout_synced",
    metadata: { batchReference, updated },
  });

  return { updated };
}
