import "server-only";
import { Prisma, WalletType, TxnReason } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateReference, formatCurrency } from "@/lib/utils";
import { WALLET_TYPES } from "@/lib/config";
import { sendEmail, walletActivityEmailHtml } from "@/lib/notifications/email";

type Tx = Prisma.TransactionClient;

const REASON_LABELS: Record<TxnReason, string> = {
  DAILY_MINING: "Daily mining reward",
  VOICE_TASK_REWARD: "Voice task reward",
  TASK_REWARD: "Task reward",
  REFERRAL_BONUS: "Referral bonus",
  DEPOSIT: "Wallet deposit",
  WITHDRAWAL: "Withdrawal",
  WITHDRAWAL_REVERSAL: "Withdrawal reversed",
  ADMIN_ADJUSTMENT: "Wallet adjustment",
  SPIN_REWARD: "Lucky Spin reward",
  MISSION_REWARD: "Mission reward",
  LEVEL_UP_BONUS: "Level-up bonus",
  WALLET_TRANSFER: "Wallet transfer",
  PLAN_ACTIVATION: "Plan purchase",
  PLAN_COMMISSION: "Referral commission",
  SPONSORED_POST_REWARD: "Sponsored post reward",
  EXTRA_SPIN_PURCHASE: "Extra spin purchase",
  MINING_PLAN_PURCHASE: "Mining plan investment",
  MINING_PLAN_PAYOUT: "Mining plan daily return",
  AD_REWARD: "Watch-ad reward",
};

// Fire-and-forget, same convention as notifyUser()'s push dispatch - a
// failed or slow email send should never hold up or fail the wallet
// operation itself.
async function sendWalletActivityEmail(params: {
  client: Tx;
  userId: string;
  direction: "CREDIT" | "DEBIT";
  reason: TxnReason;
  description?: string;
  amount: number;
  balanceAfter: Prisma.Decimal;
}) {
  const user = await params.client.user.findUnique({
    where: { id: params.userId },
    select: { email: true, fullName: true, emailNotificationsEnabled: true },
  });
  if (!user || !user.emailNotificationsEnabled) return;

  sendEmail({
    to: user.email,
    subject: `${REASON_LABELS[params.reason]} - ${formatCurrency(params.amount)}`,
    html: walletActivityEmailHtml({
      fullName: user.fullName,
      direction: params.direction,
      reasonLabel: REASON_LABELS[params.reason],
      amount: formatCurrency(params.amount),
      balanceAfter: formatCurrency(Number(params.balanceAfter)),
      description: params.description,
    }),
  }).catch(() => {});
}

export class InsufficientBalanceError extends Error {
  constructor() {
    super("Insufficient wallet balance");
  }
}

export async function ensureWalletsForUser(userId: string, client: Tx | typeof prisma = prisma) {
  await Promise.all(
    WALLET_TYPES.map((type) =>
      client.wallet.upsert({
        where: { userId_type: { userId, type } },
        update: {},
        create: { userId, type },
      })
    )
  );
}

async function getOrCreateWallet(client: Tx, userId: string, type: WalletType) {
  return client.wallet.upsert({
    where: { userId_type: { userId, type } },
    update: {},
    create: { userId, type },
  });
}

export async function creditWallet(params: {
  userId: string;
  type: WalletType;
  amount: number;
  reason: TxnReason;
  description?: string;
  metadata?: Record<string, unknown>;
  reference?: string;
  client?: Tx;
}) {
  const run = async (tx: Tx) => {
    const wallet = await getOrCreateWallet(tx, params.userId, params.type);
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: params.amount } },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: params.userId,
        type: "CREDIT",
        reason: params.reason,
        amount: params.amount,
        balanceAfter: updated.balance,
        reference: params.reference ?? generateReference("TXN"),
        description: params.description,
        metadata: params.metadata as Prisma.InputJsonValue,
      },
    });

    sendWalletActivityEmail({
      client: tx,
      userId: params.userId,
      direction: "CREDIT",
      reason: params.reason,
      description: params.description,
      amount: params.amount,
      balanceAfter: updated.balance,
    }).catch(() => {});

    return transaction;
  };

  return params.client ? run(params.client) : prisma.$transaction(run);
}

export async function debitWallet(params: {
  userId: string;
  type: WalletType;
  amount: number;
  reason: TxnReason;
  description?: string;
  metadata?: Record<string, unknown>;
  reference?: string;
  client?: Tx;
}) {
  const run = async (tx: Tx) => {
    const wallet = await getOrCreateWallet(tx, params.userId, params.type);

    const result = await tx.wallet.updateMany({
      where: { id: wallet.id, balance: { gte: params.amount } },
      data: { balance: { decrement: params.amount } },
    });

    if (result.count === 0) {
      throw new InsufficientBalanceError();
    }

    const updated = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: params.userId,
        type: "DEBIT",
        reason: params.reason,
        amount: params.amount,
        balanceAfter: updated.balance,
        reference: params.reference ?? generateReference("TXN"),
        description: params.description,
        metadata: params.metadata as Prisma.InputJsonValue,
      },
    });

    sendWalletActivityEmail({
      client: tx,
      userId: params.userId,
      direction: "DEBIT",
      reason: params.reason,
      description: params.description,
      amount: params.amount,
      balanceAfter: updated.balance,
    }).catch(() => {});

    return transaction;
  };

  return params.client ? run(params.client) : prisma.$transaction(run);
}

export async function getWalletSummary(userId: string) {
  await ensureWalletsForUser(userId);
  const wallets = await prisma.wallet.findMany({ where: { userId } });
  const total = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  return { wallets, total };
}
