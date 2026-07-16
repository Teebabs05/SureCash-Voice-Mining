import "server-only";
import { Prisma, TxnReason } from "@prisma/client";
import { creditWallet } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";
import { REFERRAL_CONFIG } from "@/lib/config";

type Tx = Prisma.TransactionClient;

/**
 * On top of the flat signup bonus, referrers earn an ongoing commission
 * whenever the people they referred earn from mining, voice tasks, or the
 * task center — mirroring Voicearn's "referral commission" income stream.
 */
export async function payReferralCommission(params: {
  earnerId: string;
  earnedAmount: number;
  sourceReason: TxnReason;
  client: Tx;
}) {
  const earner = await params.client.user.findUnique({ where: { id: params.earnerId } });
  if (!earner?.referredById) return;

  const commission = Number((params.earnedAmount * (REFERRAL_CONFIG.commissionPercent / 100)).toFixed(2));
  if (commission <= 0) return;

  await creditWallet({
    userId: earner.referredById,
    type: "SALES",
    amount: commission,
    reason: "REFERRAL_BONUS",
    description: `${REFERRAL_CONFIG.commissionPercent}% commission from a referred user's earnings`,
    client: params.client,
  });

  await notifyUser({
    userId: earner.referredById,
    title: "Referral commission earned",
    body: `You earned a commission from a referred user's activity.`,
    type: "REFERRAL",
    client: params.client,
  });
}
