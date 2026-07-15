import "server-only";
import { Prisma, WalletType, TxnReason } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";
import { WALLET_TYPES } from "@/lib/config";

type Tx = Prisma.TransactionClient;

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

    return tx.walletTransaction.create({
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

    return tx.walletTransaction.create({
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
  };

  return params.client ? run(params.client) : prisma.$transaction(run);
}

export async function getWalletSummary(userId: string) {
  await ensureWalletsForUser(userId);
  const wallets = await prisma.wallet.findMany({ where: { userId } });
  const total = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  return { wallets, total };
}
