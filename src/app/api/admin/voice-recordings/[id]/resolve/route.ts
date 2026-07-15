import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

const schema = z.object({ action: z.enum(["approve", "reject"]) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { action } = schema.parse(await req.json());
    const { ipAddress, userAgent } = getRequestMeta(req);

    const recording = await prisma.voiceRecording.findUnique({ where: { id }, include: { voiceTask: true } });
    if (!recording) return jsonError("Recording not found", 404);
    if (recording.status !== "FLAGGED" && recording.status !== "PENDING") {
      return jsonError("Recording already resolved", 409);
    }

    await prisma.$transaction(async (tx) => {
      await tx.voiceRecording.update({
        where: { id },
        data: {
          status: action === "approve" ? "APPROVED" : "REJECTED",
          rewardAmount: action === "approve" ? recording.voiceTask.rewardAmount : null,
          reviewedAt: new Date(),
        },
      });

      if (action === "approve") {
        await creditWallet({
          userId: recording.userId,
          type: "VOICE",
          amount: Number(recording.voiceTask.rewardAmount),
          reason: "VOICE_TASK_REWARD",
          description: `Voice task reward (manual review): ${recording.voiceTask.title}`,
          client: tx,
        });
      }

      await notifyUser({
        userId: recording.userId,
        title: action === "approve" ? "Voice recording approved" : "Voice recording rejected",
        body:
          action === "approve"
            ? "Your flagged recording was reviewed and approved. Reward credited."
            : "Your flagged recording was reviewed and rejected.",
        type: "VOICE_TASK",
        client: tx,
      });
    });

    await writeAuditLog({ userId: admin.id, action: `admin.voice_recording_${action}d`, ipAddress, userAgent, metadata: { recordingId: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
