import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";

const schema = z.object({
  code: z.string().min(3).optional(),
  amount: z.number().positive().optional(),
  maxRedemptions: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());
    const data = body.code ? { ...body, code: body.code.toUpperCase() } : body;

    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) return jsonError("Promo code not found", 404);

    const promoCode = await prisma.promoCode.update({ where: { id }, data });
    return NextResponse.json({ promoCode });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) return jsonError("Promo code not found", 404);

    await prisma.promoCode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
