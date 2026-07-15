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

const schema = z.object({ action: z.enum(["approve", "reject"]) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { action } = schema.parse(await req.json());
    const { ipAddress, userAgent } = getRequestMeta(req);

    const completion = await prisma.userTaskCompletion.findUnique({ where: { id }, include: { task: true } });
    if (!completion) return jsonError("Completion not found", 404);
    if (completion.status !== "PENDING_REVIEW") return jsonError("Already resolved", 409);

    await prisma.$transaction(async (tx) => {
      await tx.userTaskCompletion.update({
        where: { id },
        data: {
          status: action === "approve" ? "completed" : "REJECTED",
          rewardPaid: action === "approve" ? completion.task.rewardAmount : 0,
        },
      });

      if (action === "approve") {
        await creditWallet({
          userId: completion.userId,
          type: "TASK",
          amount: Number(completion.task.rewardAmount),
          reason: "TASK_REWARD",
          description: `Task reward (verified): ${completion.task.title}`,
          client: tx,
        });
        await addXp(completion.userId, XP_CONFIG.perTaskCenter, tx);
        await incrementMissionProgress(completion.userId, "TASK_CENTER", 1, tx);
        await payReferralCommission({
          earnerId: completion.userId,
          earnedAmount: Number(completion.task.rewardAmount),
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
