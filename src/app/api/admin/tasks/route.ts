import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  type: z.string().min(2),
  actionUrl: z.string().url().optional().or(z.literal("")),
  rewardAmount: z.number().positive(),
  isRepeatable: z.boolean().default(false),
  requiresProof: z.boolean().default(false),
});

export async function GET() {
  try {
    await requireAdmin();
    const tasks = await prisma.taskCenterTask.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ tasks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());
    const task = await prisma.taskCenterTask.create({
      data: { ...body, actionUrl: body.actionUrl || null },
    });
    return NextResponse.json({ task });
  } catch (error) {
    return handleApiError(error);
  }
}
