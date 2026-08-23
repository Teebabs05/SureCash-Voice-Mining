import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";
import { addXp, incrementMissionProgress } from "@/lib/server/gamification";
import { payReferralCommission } from "@/lib/server/referral-commission";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";
import { XP_CONFIG } from "@/lib/config";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { ipAddress, userAgent } = getRequestMeta(req);

    const submission = await prisma.userTaskCompletion.findUnique({ where: { id }, include: { task: true } });
    if (!submission) return jsonError("Submission not found", 404);
    if (submission.status !== "PENDING_REVIEW") return jsonError("Submission already reviewed", 409);

    const reward = Number(submission.rewardPaid);

    await prisma.$transaction(async (tx) => {
      await tx.userTaskCompletion.update({
        where: { id },
        data: { status: "completed", reviewedById: admin.id, reviewedAt: new Date() },
      });

      if (reward > 0) {
        await creditWallet({
          userId: submission.userId,
          type: "ENGAGEMENT",
          amount: reward,
          reason: "TASK_REWARD",
          description: `Task reward: ${submission.task.title}`,
          client: tx,
        });
        await payReferralCommission({
          earnerId: submission.userId,
          earnedAmount: reward,
          sourceReason: "TASK_REWARD",
          client: tx,
        });
      }

      await addXp(submission.userId, XP_CONFIG.perTaskCenter, tx);
      await incrementMissionProgress(submission.userId, "TASK_CENTER", 1, tx);

      await notifyUser({
        userId: submission.userId,
        title: "Task approved",
        body: `Your submission for "${submission.task.title}" was approved${reward > 0 ? ` — ${reward} credited.` : "."}`,
        type: "GAMIFICATION",
        client: tx,
      });
    });

    await writeAuditLog({
      userId: admin.id,
      action: "task_submission.approve",
      ipAddress,
      userAgent,
      metadata: { submissionId: id, targetUserId: submission.userId, reward },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
