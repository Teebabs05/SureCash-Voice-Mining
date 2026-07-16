import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";
import { addXp, incrementMissionProgress } from "@/lib/server/gamification";
import { payReferralCommission } from "@/lib/server/referral-commission";
import { saveUploadedFile } from "@/lib/server/storage";
import { hashBuffer } from "@/lib/server/file-hash";
import { XP_CONFIG } from "@/lib/config";

type Tx = Prisma.TransactionClient;

async function approveAndPay(
  tx: Tx,
  params: { userId: string; taskId: string; title: string; reward: number; proofUrl?: string; proofText?: string; proofImageUrl?: string; proofImageHash?: string }
) {
  const completion = await tx.userTaskCompletion.create({
    data: {
      userId: params.userId,
      taskId: params.taskId,
      status: "completed",
      proofUrl: params.proofUrl,
      proofText: params.proofText,
      proofImageUrl: params.proofImageUrl,
      proofImageHash: params.proofImageHash,
      rewardPaid: params.reward,
    },
  });

  await creditWallet({
    userId: params.userId,
    type: "TASK",
    amount: params.reward,
    reason: "TASK_REWARD",
    description: `Task reward: ${params.title}`,
    client: tx,
  });

  await addXp(params.userId, XP_CONFIG.perTaskCenter, tx);
  await incrementMissionProgress(params.userId, "TASK_CENTER", 1, tx);
  await payReferralCommission({
    earnerId: params.userId,
    earnedAmount: params.reward,
    sourceReason: "TASK_REWARD",
    client: tx,
  });

  return completion;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.emailVerified) {
      return jsonError("Please verify your email before completing tasks", 403);
    }

    const form = await req.formData();
    const taskId = String(form.get("taskId") ?? "");
    const proofUrl = form.get("proofUrl") ? String(form.get("proofUrl")) : undefined;
    const proofText = form.get("proofText") ? String(form.get("proofText")) : undefined;
    const proofImage = form.get("proofImage");

    if (!taskId) return jsonError("Missing task", 422);
    if (proofUrl && !/^https?:\/\//.test(proofUrl)) return jsonError("Proof link must be a valid URL", 422);

    const task = await prisma.taskCenterTask.findUnique({ where: { id: taskId } });
    if (!task || !task.isActive) return jsonError("Task not found", 404);

    if (task.type === "sponsored_post") {
      const socials = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { facebookUrl: true, instagramHandle: true, tiktokHandle: true },
      });
      const linkedCount = [socials.facebookUrl, socials.instagramHandle, socials.tiktokHandle].filter(Boolean).length;
      if (linkedCount < 2) {
        return jsonError("Link at least 2 social accounts before submitting sponsored posts", 403);
      }
    }

    if (!task.isRepeatable) {
      // Exclude REJECTED so a user whose submission was auto- or
      // admin-rejected can still retry with fresh, original proof.
      const existing = await prisma.userTaskCompletion.findFirst({
        where: { userId: user.id, taskId, status: { not: "REJECTED" } },
      });
      if (existing) return jsonError("You've already completed this task", 409);
    }

    // A user's active plan re-prices task rewards at a flat rate for the
    // task's type (sponsored post vs general task), overriding the
    // individual task's own rewardAmount. Users with no active plan keep
    // today's per-task reward.
    const plan = user.planId ? await prisma.plan.findUnique({ where: { id: user.planId } }) : null;
    const effectiveReward = Number(
      plan ? (task.type === "sponsored_post" ? plan.sponsoredPostReward : plan.taskReward) : task.rewardAmount
    );

    if (task.requiresProof) {
      if (!(proofImage instanceof Blob) && !proofUrl && !proofText) {
        return jsonError("Please provide proof (a screenshot, link, or short description) for this task", 422);
      }

      // A proof screenshot can be verified automatically: hash it and check
      // for reuse. A link/description alone can't be automatically verified,
      // so it still goes to manual admin review same as before. The system
      // takes the lead on this decision, but a rejected duplicate is still
      // persisted (with the proof) rather than silently discarded, so
      // admin can review and override an auto-reject that turns out to be
      // a false positive.
      if (proofImage instanceof Blob) {
        const buffer = Buffer.from(await proofImage.arrayBuffer());
        const proofImageHash = hashBuffer(buffer);
        const extension = (proofImage.type.split("/")[1] || "jpg").split(";")[0];
        const proofImageUrl = await saveUploadedFile({ folder: "task-proofs", buffer, extension });

        const duplicate = await prisma.userTaskCompletion.findFirst({
          where: { proofImageHash, status: { not: "REJECTED" } },
        });
        if (duplicate) {
          const completion = await prisma.userTaskCompletion.create({
            data: {
              userId: user.id,
              taskId,
              status: "REJECTED",
              proofUrl,
              proofText,
              proofImageUrl,
              proofImageHash,
              rewardPaid: 0,
            },
          });
          return NextResponse.json(
            {
              error: "This screenshot has already been submitted for a task - flagged for admin review.",
              completion,
              autoRejected: true,
            },
            { status: 409 }
          );
        }

        const completion = await prisma.$transaction((tx) =>
          approveAndPay(tx, {
            userId: user.id,
            taskId,
            title: task.title,
            reward: effectiveReward,
            proofUrl,
            proofText,
            proofImageUrl,
            proofImageHash,
          })
        );

        return NextResponse.json({ completion, reward: effectiveReward, pending: false });
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

    const result = await prisma.$transaction((tx) =>
      approveAndPay(tx, { userId: user.id, taskId, title: task.title, reward: effectiveReward })
    );

    return NextResponse.json({ completion: result, reward: effectiveReward, pending: false });
  } catch (error) {
    return handleApiError(error);
  }
}
