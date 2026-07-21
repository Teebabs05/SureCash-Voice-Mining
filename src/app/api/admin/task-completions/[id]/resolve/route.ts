import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";
import { addXp, incrementMissionProgress } from "@/lib/server/gamification";
import { payReferralCommission } from "@/lib/server/referral-commission";
import { notifyUser } from "@/lib/server/notifications";
import { XP_CONFIG } from "@/lib/config";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";
import { isActivePlanRequired } from "@/lib/server/plan-gate";

const schema = z.object({ action: z.enum(["approve", "reject"]) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { action } = schema.parse(await req.json());
    const { ipAddress, userAgent } = getRequestMeta(req);

    const completion = await prisma.userTaskCompletion.findUnique({ where: { id }, include: { task: true } });
    if (!completion) return jsonError("Completion not found", 404);
    // The system takes the lead on auto-resolving proof screenshots, but
    // admin can still override a REJECTED (including auto-rejected
    // duplicate) completion by approving it - e.g. a false-positive
    // duplicate match. Re-rejecting an already-REJECTED item is a no-op,
    // not allowed.
    if (completion.status !== "PENDING_REVIEW" && completion.status !== "REJECTED") {
      return jsonError("Already resolved", 409);
    }
    if (completion.status === "REJECTED" && action === "reject") {
      return jsonError("Already rejected", 409);
    }

    const completingUser = await prisma.user.findUniqueOrThrow({ where: { id: completion.userId } });
    const plan = completingUser.planId ? await prisma.plan.findUnique({ where: { id: completingUser.planId } }) : null;
    const planRequired = !plan && (await isActivePlanRequired());
    const effectiveReward = planRequired
      ? 0
      : plan
        ? completion.task.type === "sponsored_post"
          ? plan.sponsoredPostReward
          : plan.taskReward
        : completion.task.rewardAmount;

    await prisma.$transaction(async (tx) => {
      await tx.userTaskCompletion.update({
        where: { id },
        data: {
          status: action === "approve" ? "completed" : "REJECTED",
          rewardPaid: action === "approve" ? effectiveReward : 0,
        },
      });

      if (action === "approve") {
        await creditWallet({
          userId: completion.userId,
          type: "ENGAGEMENT",
          amount: Number(effectiveReward),
          reason: "TASK_REWARD",
          description: `Task reward (verified): ${completion.task.title}`,
          client: tx,
        });
        await addXp(completion.userId, XP_CONFIG.perTaskCenter, tx);
        await incrementMissionProgress(completion.userId, "TASK_CENTER", 1, tx);
        await payReferralCommission({
          earnerId: completion.userId,
          earnedAmount: Number(effectiveReward),
          sourceReason: "TASK_REWARD",
          client: tx,
        });
      }

      await notifyUser({
        userId: completion.userId,
        title: action === "approve" ? "Task approved" : "Task rejected",
        body:
          action === "approve"
            ? `Your submission for "${completion.task.title}" was approved. Reward credited.`
            : `Your submission for "${completion.task.title}" was rejected.`,
        type: "SYSTEM",
        client: tx,
      });
    });

    await writeAuditLog({
      userId: admin.id,
      action: `admin.task_completion_${action}d`,
      ipAddress,
      userAgent,
      metadata: { completionId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
