import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

const schema = z.object({ isActive: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { isActive } = schema.parse(await req.json());
    const promoCode = await prisma.promoCode.update({ where: { id }, data: { isActive } });
    return NextResponse.json({ promoCode });
  } catch (error) {
    return handleApiError(error);
  }
}
