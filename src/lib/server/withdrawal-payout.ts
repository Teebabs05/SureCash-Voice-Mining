import "server-only";
import { prisma } from "@/lib/prisma";
import { getDefaultPayoutProvider, getPayoutProvider } from "@/lib/payments/payout-provider";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog } from "@/lib/server/audit";

/**
 * Attempts instant automatic disbursement through the configured gateway
 * (Paystack live; Monnify/Korapay/PayVessel stubbed until credentials are
 * added). Runs after the withdrawal row + wallet debit are already
 * committed, since it involves an external network call that shouldn't sit
 * inside a DB transaction. Never throws — on any failure the withdrawal
 * simply stays PENDING for manual admin processing, which is the existing
 * fallback path.
 */
export async function attemptAutomaticPayout(withdrawalId: string) {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: { bankAccount: true },
  });
  if (!withdrawal || withdrawal.status !== "PENDING") return;

  const provider = getDefaultPayoutProvider();
  const adapter = getPayoutProvider(provider);

  try {
    let recipientCode = provider === "PAYSTACK" ? withdrawal.bankAccount.paystackRecipientCode : null;

    if (!recipientCode) {
      const recipient = await adapter.resolveRecipient({
        bankCode: withdrawal.bankAccount.bankCode,
        accountNumber: withdrawal.bankAccount.accountNumber,
        accountName: withdrawal.bankAccount.accountName,
      });
      recipientCode = recipient.recipientCode;

      if (provider === "PAYSTACK") {
        await prisma.bankAccount.update({
          where: { id: withdrawal.bankAccountId },
          data: { paystackRecipientCode: recipientCode },
        });
      }
    }

    const result = await adapter.initiateTransfer({
      amount: Number(withdrawal.amount),
      recipientCode,
      reference: withdrawal.reference,
      reason: `SureCash Mining withdrawal ${withdrawal.reference}`,
    });

    if (result.status === "failed") {
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: { autoPayoutAttempted: true, autoPayoutError: result.message ?? "Transfer failed", payoutProvider: provider },
      });
      await writeAuditLog({
        userId: withdrawal.userId,
        action: "withdrawal.auto_payout_failed",
        metadata: { withdrawalId, provider, message: result.message },
      });
      return;
    }

    // "success" or "pending" both mean the gateway accepted the transfer —
    // final confirmation arrives via webhook (see /api/webhooks/paystack).
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: "PROCESSING",
        payoutProvider: provider,
        payoutReference: result.transferCode ?? withdrawal.reference,
        autoPayoutAttempted: true,
      },
    });

    await notifyUser({
      userId: withdrawal.userId,
      title: "Withdrawal processing automatically",
      body: `Your withdrawal of ${withdrawal.amount} is being sent to your bank account via ${provider}.`,
      type: "WALLET",
    });
    await writeAuditLog({
      userId: withdrawal.userId,
      action: "withdrawal.auto_payout_initiated",
      metadata: { withdrawalId, provider },
    });
  } catch (error) {
    // Provider not configured, network error, etc — silent fallback to manual.
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        autoPayoutAttempted: true,
        autoPayoutError: error instanceof Error ? error.message : "Automatic payout unavailable",
      },
    });
  }
}
