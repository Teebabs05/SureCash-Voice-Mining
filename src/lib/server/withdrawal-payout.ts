import "server-only";
import { prisma } from "@/lib/prisma";
import { getDefaultPayoutProvider, getPayoutProvider } from "@/lib/payments/payout-provider";
import { withdrawUsdt, isBinanceConfigured } from "@/lib/payments/binance";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog } from "@/lib/server/audit";

/**
 * Attempts instant automatic disbursement — bank transfer through the
 * configured gateway, or USDT through Binance if configured. Runs after the
 * withdrawal row + wallet debit are already committed, since it involves an
 * external network call that shouldn't sit inside a DB transaction. Never
 * throws — on any failure the withdrawal simply stays PENDING for manual
 * admin processing, which is the existing fallback path.
 */
export async function attemptAutomaticPayout(withdrawalId: string) {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: { bankAccount: true, cryptoWallet: true, user: true },
  });
  if (!withdrawal || withdrawal.status !== "PENDING") return;

  if (withdrawal.method === "USDT" && withdrawal.cryptoWallet) {
    await attemptCryptoPayout(withdrawal.id, withdrawal.cryptoWallet, Number(withdrawal.usdtAmount), withdrawal.reference, withdrawal.userId);
    return;
  }

  if (withdrawal.method !== "BANK" || !withdrawal.bankAccount) return;

  const bankAccount = withdrawal.bankAccount;
  const provider = getDefaultPayoutProvider();
  const adapter = getPayoutProvider(provider);

  try {
    let recipientCode = provider === "PAYSTACK" ? bankAccount.paystackRecipientCode : null;

    if (!recipientCode) {
      const recipient = await adapter.resolveRecipient({
        bankCode: bankAccount.bankCode,
        accountNumber: bankAccount.accountNumber,
        accountName: bankAccount.accountName,
        email: withdrawal.user.email,
      });
      recipientCode = recipient.recipientCode;

      if (provider === "PAYSTACK") {
        await prisma.bankAccount.update({
          where: { id: bankAccount.id },
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

/**
 * USDT disbursement via Binance. Unlike the bank-transfer gateways, Binance
 * doesn't push a webhook on completion — final confirmation happens when an
 * admin uses the "check status" action (POST
 * /api/admin/withdrawals/[id]/check-crypto-status), which polls
 * getWithdrawStatus(). A no-op (stays PENDING for manual sending) if
 * BINANCE_API_KEY/SECRET aren't configured, same as before this was wired up.
 */
async function attemptCryptoPayout(
  withdrawalId: string,
  cryptoWallet: { address: string; network: string },
  usdtAmount: number,
  reference: string,
  userId: string
) {
  if (!isBinanceConfigured()) return;

  try {
    const result = await withdrawUsdt({
      network: cryptoWallet.network as "TRC20" | "ERC20" | "BEP20",
      address: cryptoWallet.address,
      amount: usdtAmount,
      withdrawOrderId: reference,
    });

    if (result.status === "failed") {
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: { autoPayoutAttempted: true, autoPayoutError: result.message ?? "Withdrawal request failed", payoutProvider: "BINANCE" },
      });
      await writeAuditLog({
        userId,
        action: "withdrawal.auto_payout_failed",
        metadata: { withdrawalId, provider: "BINANCE", message: result.message },
      });
      return;
    }

    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: "PROCESSING",
        payoutProvider: "BINANCE",
        payoutReference: result.withdrawId,
        autoPayoutAttempted: true,
      },
    });

    await notifyUser({
      userId,
      title: "USDT withdrawal processing",
      body: `Your withdrawal of ${usdtAmount} USDT is being sent to your wallet.`,
      type: "WALLET",
    });
    await writeAuditLog({
      userId,
      action: "withdrawal.auto_payout_initiated",
      metadata: { withdrawalId, provider: "BINANCE" },
    });
  } catch (error) {
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        autoPayoutAttempted: true,
        autoPayoutError: error instanceof Error ? error.message : "Automatic payout unavailable",
      },
    });
  }
}
