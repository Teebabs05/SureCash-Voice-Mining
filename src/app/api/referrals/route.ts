import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const user = await requireUser();

    const referrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { referred: { select: { fullName: true, email: true, emailVerified: true, createdAt: true } } },
    });

    const totalEarned = referrals
      .filter((r) => r.rewardCredited)
      .reduce((sum, r) => sum + Number(r.rewardAmount), 0);

    return NextResponse.json({
      referralCode: user.referralCode,
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${user.referralCode}`,
      totalReferrals: referrals.length,
      totalEarned,
      referrals,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
