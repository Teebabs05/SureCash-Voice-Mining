import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";

const schema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(2).optional(),
  type: z.string().min(2).optional(),
  actionUrl: z.string().optional(),
  rewardAmount: z.number().positive().optional(),
  requiresProof: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());
    const task = await prisma.taskCenterTask.update({ where: { id }, data: body });
    return NextResponse.json({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const completionCount = await prisma.userTaskCompletion.count({ where: { taskId: id } });
    if (completionCount > 0) {
      // Completions reference this task — deleting would orphan reward
      // history, so deactivate instead and let the admin hard-delete only
      // once it has no submissions.
      await prisma.taskCenterTask.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({
        success: true,
        hardDeleted: false,
        message: `Task has ${completionCount} submission(s) — deactivated instead of deleted.`,
      });
    }

    const existing = await prisma.taskCenterTask.findUnique({ where: { id } });
    if (!existing) return jsonError("Task not found", 404);

    await prisma.taskCenterTask.delete({ where: { id } });
    return NextResponse.json({ success: true, hardDeleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
