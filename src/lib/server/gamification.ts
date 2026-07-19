import "server-only";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { creditWallet } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";

type Tx = Prisma.TransactionClient;

export async function addXp(userId: string, amount: number, client: Tx) {
  const user = await client.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
  });

  const nextLevel = await client.level.findFirst({
    where: { level: { gt: user.level }, xpRequired: { lte: user.xp } },
    orderBy: { level: "desc" },
  });

  if (nextLevel && nextLevel.level > user.level) {
    await client.user.update({ where: { id: userId }, data: { level: nextLevel.level } });

    if (Number(nextLevel.bonusAmount) > 0) {
      await creditWallet({
        userId,
        type: "ENGAGEMENT",
        amount: Number(nextLevel.bonusAmount),
        reason: "LEVEL_UP_BONUS",
        description: `Level ${nextLevel.level} bonus: ${nextLevel.title}`,
        client,
      });
    }

    await notifyUser({
      userId,
      title: `Level up! You're now level ${nextLevel.level}`,
      body: `${nextLevel.title} — keep earning to unlock the next level.`,
      type: "GAMIFICATION",
      client,
    });

    await checkAchievements(userId, "LEVEL_UP", client);
  }

  return user;
}

const STREAK_GRACE_HOURS = 48;

export async function bumpMiningStreak(userId: string, client: Tx) {
  const user = await client.user.findUniqueOrThrow({ where: { id: userId } });
  const now = new Date();

  let nextStreak = 1;
  if (user.lastMiningAt) {
    const hoursSince = (now.getTime() - user.lastMiningAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < STREAK_GRACE_HOURS) {
      nextStreak = user.streakCount + 1;
    }
  }

  return client.user.update({
    where: { id: userId },
    data: {
      streakCount: nextStreak,
      longestStreak: Math.max(nextStreak, user.longestStreak),
      lastMiningAt: now,
    },
  });
}

/**
 * Formats a date as a plain `YYYY-MM-DD` string (local calendar day).
 *
 * `UserMissionProgress.date` is a MySQL `@db.Date` column. Passing a JS
 * `Date` object for it worked fine in Prisma's normal (structured) query
 * builder, but the raw `$executeRaw` INSERT below serializes `Date`
 * parameters differently - the two paths could disagree on which calendar
 * day a midnight `Date` instance actually represents, so a row inserted
 * "for today" by the raw query wouldn't be found by the structured
 * `findUniqueOrThrow` lookup right after it. A plain date-only string is
 * unambiguous to both, since there's no time-of-day/timezone left to
 * convert.
 */
export function dateOnlyKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function incrementMissionProgress(userId: string, missionType: string, by: number, client: Tx) {
  const missions = await client.dailyMission.findMany({ where: { type: missionType, isActive: true } });
  const today = dateOnlyKey();

  for (const mission of missions) {
    // Prisma's upsert() does a SELECT then INSERT-or-UPDATE, which isn't
    // atomic - under MySQL's default REPEATABLE READ isolation, two
    // near-simultaneous calls (e.g. a resubmitted request on a flaky
    // connection) can both miss the SELECT, race to INSERT, and the loser
    // throws a unique-constraint error. Worse, a plain retry-with-update
    // can *also* fail with "record not found", because the loser's
    // transaction snapshot may not yet see the winner's committed row even
    // though the constraint proves it exists. A raw `INSERT ... ON
    // DUPLICATE KEY UPDATE` is a single atomic statement at the database
    // level, so this race can't happen at all.
    await client.$executeRaw`
      INSERT INTO \`UserMissionProgress\` (\`id\`, \`userId\`, \`missionId\`, \`date\`, \`progress\`, \`completed\`)
      VALUES (${randomUUID()}, ${userId}, ${mission.id}, ${today}, ${by}, false)
      ON DUPLICATE KEY UPDATE \`progress\` = \`progress\` + ${by}
    `;
    const progress = await client.userMissionProgress.findUniqueOrThrow({
      where: { userId_missionId_date: { userId, missionId: mission.id, date: today } },
    });

    if (!progress.completed && progress.progress >= mission.target) {
      await client.userMissionProgress.update({
        where: { id: progress.id },
        data: { completed: true, claimedAt: new Date() },
      });

      if (Number(mission.rewardAmount) > 0) {
        await creditWallet({
          userId,
          type: mission.rewardWallet,
          amount: Number(mission.rewardAmount),
          reason: "MISSION_REWARD",
          description: `Mission complete: ${mission.title}`,
          client,
        });
      }
      if (mission.rewardXp > 0) {
        await addXp(userId, mission.rewardXp, client);
      }
      await notifyUser({
        userId,
        title: "Mission complete!",
        body: `You completed "${mission.title}" and earned your reward.`,
        type: "GAMIFICATION",
        client,
      });
    }
  }
}

async function grantAchievement(userId: string, code: string, client: Tx) {
  const achievement = await client.achievement.findUnique({ where: { code } });
  if (!achievement) return;

  const existing = await client.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
  });
  if (existing) return;

  await client.userAchievement.create({ data: { userId, achievementId: achievement.id } });
  if (achievement.xpReward > 0) await addXp(userId, achievement.xpReward, client);

  await notifyUser({
    userId,
    title: `Achievement unlocked: ${achievement.title}`,
    body: achievement.description,
    type: "GAMIFICATION",
    client,
  });
}

/** Checks milestone-based achievements after key actions. Cheap point checks, not a rules engine. */
export async function checkAchievements(
  userId: string,
  trigger: "WITHDRAWAL_PAID" | "VOICE_TASK_APPROVED" | "REFERRAL_CREDITED" | "LEVEL_UP" | "MINING_STREAK",
  client: Tx
) {
  if (trigger === "WITHDRAWAL_PAID") {
    const count = await client.withdrawal.count({ where: { userId, status: "PAID" } });
    if (count === 1) await grantAchievement(userId, "FIRST_WITHDRAWAL", client);
  }

  if (trigger === "VOICE_TASK_APPROVED") {
    const count = await client.voiceRecording.count({ where: { userId, status: "APPROVED" } });
    if (count === 1) await grantAchievement(userId, "FIRST_RECORDING", client);
    if (count >= 50) {
      await grantAchievement(userId, "RECORDINGS_50", client);
      await grantAchievement(userId, "VOICE_EXPERT", client);
    }
    if (count >= 100) await grantAchievement(userId, "RECORDINGS_100", client);
    if (count >= 1000) await grantAchievement(userId, "RECORDINGS_1000", client);
  }

  if (trigger === "REFERRAL_CREDITED") {
    const count = await client.referral.count({ where: { referrerId: userId, rewardCredited: true } });
    if (count >= 10) {
      await grantAchievement(userId, "INVITE_10", client);
      await grantAchievement(userId, "TOP_REFERRER", client);
    }
    if (count >= 100) await grantAchievement(userId, "INVITE_100", client);
  }

  if (trigger === "LEVEL_UP") {
    const user = await client.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.level >= 5) await grantAchievement(userId, "VIP_MEMBER", client);
  }

  if (trigger === "MINING_STREAK") {
    const user = await client.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.streakCount >= 30) await grantAchievement(userId, "STREAK_30", client);
  }
}
