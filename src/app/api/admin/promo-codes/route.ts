import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

const schema = z.object({
  code: z.string().trim().toUpperCase().min(3),
  amount: z.number().positive(),
  wallet: z.enum(["MAIN", "MINING", "VOICE", "REFERRAL", "TASK", "BONUS"]).default("BONUS"),
  maxRedemptions: z.number().int().positive().default(1),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const promoCodes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ promoCodes });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());
    const promoCode = await prisma.promoCode.create({
      data: { ...body, expiresAt: body.expiresAt ? new Date(body.expiresAt) : null },
    });
    return NextResponse.json({ promoCode });
  } catch (error) {
    return handleApiError(error);
  }
}
