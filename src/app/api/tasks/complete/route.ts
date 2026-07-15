import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";
import { addXp, incrementMissionProgress } from "@/lib/server/gamification";
import { payReferralCommission } from "@/lib/server/referral-commission";
import { XP_CONFIG } from "@/lib/config";

const schema = z.object({
  taskId: z.string().min(1),
  proofUrl: z.string().url().optional(),
  proofText: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.emailVerified) {
      return jsonError("Please verify your email before completing tasks", 403);
    }

    const { taskId, proofUrl, proofText } = schema.parse(await req.json());
    const task = await prisma.taskCenterTask.findUnique({ where: { id: taskId } });
    if (!task || !task.isActive) return jsonError("Task not found", 404);

    if (!task.isRepeatable) {
      const existing = await prisma.userTaskCompletion.findFirst({ where: { userId: user.id, taskId } });
      if (existing) return jsonError("You've already completed this task", 409);
    }

    if (task.requiresProof) {
      if (!proofUrl && !proofText) {
        return jsonError("Please provide proof (a link or short description) for this task", 422);
      }
      const completion = await prisma.userTaskCompletion.create({
        data: {
          userId: user.id,
          taskId,
          status: "PENDING_REVIEW",
          proofUrl,
          proofText,
          rewardPaid: 0,
        },
      });
      return NextResponse.json({ completion, pending: true });
    }

    const result = await prisma.$transaction(async (tx) => {
      const completion = await tx.userTaskCompletion.create({
        data: { userId: user.id, taskId, rewardPaid: task.rewardAmount },
      });

      await creditWallet({
        userId: user.id,
        type: "TASK",
        amount: Number(task.rewardAmount),
        reason: "TASK_REWARD",
        description: `Task reward: ${task.title}`,
        client: tx,
      });

      await addXp(user.id, XP_CONFIG.perTaskCenter, tx);
      await incrementMissionProgress(user.id, "TASK_CENTER", 1, tx);
      await payReferralCommission({
        earnerId: user.id,
        earnedAmount: Number(task.rewardAmount),
        sourceReason: "TASK_REWARD",
        client: tx,
      });

      return completion;
    });

    return NextResponse.json({ completion: result, reward: Number(task.rewardAmount), pending: false });
  } catch (error) {
    return handleApiError(error);
  }
}
