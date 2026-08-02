import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

const schema = z.object({ note: z.string().optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { note } = schema.parse(await req.json().catch(() => ({})));
    const { ipAddress, userAgent } = getRequestMeta(req);

    const submission = await prisma.userTaskCompletion.findUnique({ where: { id }, include: { task: true } });
    if (!submission) return jsonError("Submission not found", 404);
    if (submission.status !== "PENDING_REVIEW") return jsonError("Submission already reviewed", 409);

    await prisma.$transaction(async (tx) => {
      await tx.userTaskCompletion.update({
        where: { id },
        data: { status: "REJECTED", reviewedById: admin.id, reviewedAt: new Date(), adminNote: note, rewardPaid: 0 },
      });

      await notifyUser({
        userId: submission.userId,
        title: "Task submission rejected",
        body: note || `Your submission for "${submission.task.title}" was rejected.`,
        type: "GAMIFICATION",
        client: tx,
      });
    });

    await writeAuditLog({
      userId: admin.id,
      action: "task_submission.reject",
      ipAddress,
      userAgent,
      metadata: { submissionId: id, targetUserId: submission.userId, note },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
