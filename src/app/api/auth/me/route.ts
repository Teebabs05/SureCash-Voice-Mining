import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/current-user";
import { getWalletSummary } from "@/lib/server/wallet";
import { handleApiError, jsonError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Not authenticated", 401);

    const { wallets, total } = await getWalletSummary(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        tier: user.tier,
        referralCode: user.referralCode,
        xp: user.xp,
        level: user.level,
        streakCount: user.streakCount,
        longestStreak: user.longestStreak,
        lastMiningAt: user.lastMiningAt,
      },
      wallets,
      totalBalance: total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
