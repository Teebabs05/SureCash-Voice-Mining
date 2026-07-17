import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

const schema = z.object({
  title: z.string().min(2).optional(),
  promptText: z.string().min(2).optional(),
  category: z.enum(["session", "word_game"]).optional(),
  rewardAmount: z.number().positive().optional(),
  dailyLimit: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());
    const task = await prisma.voiceTask.update({ where: { id }, data: body });
    return NextResponse.json({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const recordingCount = await prisma.voiceRecording.count({ where: { voiceTaskId: id } });
    if (recordingCount > 0) {
      // Recordings reference this task — deleting would orphan reward/history
      // data, so deactivate instead and let the admin hard-delete only once
      // it has no submissions.
      await prisma.voiceTask.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({
        success: true,
        hardDeleted: false,
        message: `Task has ${recordingCount} recording(s) — deactivated instead of deleted.`,
      });
    }

    await prisma.voiceTask.delete({ where: { id } });
    return NextResponse.json({ success: true, hardDeleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
