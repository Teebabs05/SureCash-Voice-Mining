import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    await requireAdmin();
    const plans = await prisma.miningPlan.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ plans });
  } catch (error) {
    return handleApiError(error);
  }
}

const schema = z.object({
  name: z.string().trim().min(2),
  price: z.number().positive(),
  dailyReturn: z.number().positive(),
  durationDays: z.number().int().positive().default(30),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().default(0),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());

    const plan = await prisma.miningPlan.create({ data: body });
    return NextResponse.json({ plan });
  } catch (error) {
    return handleApiError(error);
  }
}
