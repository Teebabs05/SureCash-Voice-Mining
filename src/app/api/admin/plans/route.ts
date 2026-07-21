import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

const schema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  voiceSessionReward: z.number().nonnegative(),
  wordGameReward: z.number().nonnegative(),
  sponsoredPostReward: z.number().nonnegative(),
  taskReward: z.number().nonnegative(),
  referralCommission: z.number().nonnegative(),
  sortOrder: z.number().int().default(0),
  isPopular: z.boolean().default(false),
  voiceEarnEnabled: z.boolean().default(true),
  wordGameEnabled: z.boolean().default(true),
  taskCenterEnabled: z.boolean().default(true),
  sponsoredPostsEnabled: z.boolean().default(true),
});

export async function GET() {
  try {
    await requireAdmin();
    const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ plans });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());
    const plan = await prisma.plan.create({ data: body });
    return NextResponse.json({ plan });
  } catch (error) {
    return handleApiError(error);
  }
}
