import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

const schema = z.object({
  name: z.string().trim().min(2).optional(),
  price: z.number().positive().optional(),
  dailyReturn: z.number().positive().optional(),
  durationDays: z.number().int().positive().optional(),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());

    const plan = await prisma.miningPlan.update({ where: { id }, data: body });
    return NextResponse.json({ plan });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Investments reference this plan (onDelete: RESTRICT) - deactivate
    // instead of a hard delete whenever any investment (past or active)
    // exists, so history stays intact and readable.
    const hasInvestments = await prisma.userMiningPlan.findFirst({ where: { planId: id } });
    if (hasInvestments) {
      const plan = await prisma.miningPlan.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ plan, deactivatedOnly: true });
    }

    await prisma.miningPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
