import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

const schema = z.object({
  label: z.string().min(1).optional(),
  amount: z.number().nonnegative().optional(),
  wallet: z.enum(["MAIN", "ENGAGEMENT", "SALES"]).optional(),
  weight: z.number().int().nonnegative().optional(),
  colorHex: z.string().min(4).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());
    const reward = await prisma.spinReward.update({ where: { id }, data: body });
    return NextResponse.json({ reward });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const historyCount = await prisma.spinHistory.count({ where: { spinRewardId: id } });
    if (historyCount > 0) {
      // Spins reference this reward — deleting would orphan history, so
      // deactivate instead and let the admin hard-delete only once it has
      // never been won.
      await prisma.spinReward.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({
        success: true,
        hardDeleted: false,
        message: `This reward has been won ${historyCount} time(s) — deactivated instead of deleted.`,
      });
    }

    await prisma.spinReward.delete({ where: { id } });
    return NextResponse.json({ success: true, hardDeleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
