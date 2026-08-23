import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

const schema = z.object({
  label: z.string().min(1),
  amount: z.number().nonnegative(),
  wallet: z.enum(["MAIN", "ENGAGEMENT", "SALES"]).default("ENGAGEMENT"),
  weight: z.number().int().nonnegative(),
  colorHex: z.string().min(4).default("#0D8A82"),
});

export async function GET() {
  try {
    await requireAdmin();
    const rewards = await prisma.spinReward.findMany({ orderBy: { amount: "asc" } });
    return NextResponse.json({ rewards });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());
    const reward = await prisma.spinReward.create({ data: body });
    return NextResponse.json({ reward });
  } catch (error) {
    return handleApiError(error);
  }
}
