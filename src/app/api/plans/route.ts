import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    const plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ plans, currentPlanId: user.planId });
  } catch (error) {
    return handleApiError(error);
  }
}
