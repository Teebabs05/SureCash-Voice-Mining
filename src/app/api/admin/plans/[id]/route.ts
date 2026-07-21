import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";

const schema = z.object({
  name: z.string().min(2).optional(),
  price: z.number().positive().optional(),
  voiceSessionReward: z.number().nonnegative().optional(),
  wordGameReward: z.number().nonnegative().optional(),
  sponsoredPostReward: z.number().nonnegative().optional(),
  taskReward: z.number().nonnegative().optional(),
  referralCommission: z.number().nonnegative().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  voiceEarnDailyLimit: z.number().int().positive().optional(),
  wordGameDailyLimit: z.number().int().positive().optional(),
  taskCenterDailyLimit: z.number().int().positive().optional(),
  sponsoredPostsDailyLimit: z.number().int().positive().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) return jsonError("Plan not found", 404);

    const plan = await prisma.plan.update({ where: { id }, data: body });
    return NextResponse.json({ plan });
  } catch (error) {
    return handleApiError(error);
  }
}
