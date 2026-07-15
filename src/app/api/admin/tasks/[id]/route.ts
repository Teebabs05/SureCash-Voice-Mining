import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

const schema = z.object({
  title: z.string().min(2).optional(),
  rewardAmount: z.number().positive().optional(),
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
