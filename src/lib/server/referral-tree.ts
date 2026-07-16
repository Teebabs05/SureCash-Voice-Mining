import "server-only";
import { prisma } from "@/lib/prisma";

export interface ReferralLevel {
  level: number;
  count: number;
  verifiedCount: number;
}

/**
 * Downstream referral network breakdown (level 1 = direct referrals, level 2
 * = their referrals, etc.), computed via breadth-first traversal of
 * User.referredById. Visualization only — commission is still paid only to
 * the direct (level 1) referrer, see payReferralCommission().
 */
export async function getReferralNetwork(userId: string, maxDepth = 3): Promise<ReferralLevel[]> {
  const levels: ReferralLevel[] = [];
  let currentIds = [userId];

  for (let level = 1; level <= maxDepth; level++) {
    if (currentIds.length === 0) {
      levels.push({ level, count: 0, verifiedCount: 0 });
      continue;
    }

    const users = await prisma.user.findMany({
      where: { referredById: { in: currentIds } },
      select: { id: true, emailVerified: true },
    });

    levels.push({
      level,
      count: users.length,
      verifiedCount: users.filter((u) => u.emailVerified).length,
    });
    currentIds = users.map((u) => u.id);
  }

  return levels;
}
