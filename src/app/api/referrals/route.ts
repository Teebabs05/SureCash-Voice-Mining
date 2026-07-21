import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { getReferralNetwork } from "@/lib/server/referral-tree";

export async function GET() {
  try {
    const user = await requireUser();

    const referrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        referred: { select: { fullName: true, email: true, emailVerified: true, createdAt: true, planId: true } },
      },
    });

    const totalEarned = referrals
      .filter((r) => r.rewardCredited)
      .reduce((sum, r) => sum + Number(r.rewardAmount), 0);
    const activatedReferrals = referrals.filter((r) => r.referred.planId).length;

    const network = await getReferralNetwork(user.id);

    return NextResponse.json({
      referralCode: user.referralCode,
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${user.referralCode}`,
      totalReferrals: referrals.length,
      activatedReferrals,
      pendingReferrals: referrals.length - activatedReferrals,
      totalEarned,
      referrals,
      network,
      networkSize: network.reduce((sum, l) => sum + l.count, 0),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
