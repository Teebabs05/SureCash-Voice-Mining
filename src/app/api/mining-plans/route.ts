import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const user = await requireUser();

    const [plans, investments] = await Promise.all([
      prisma.miningPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.userMiningPlan.findMany({
        where: { userId: user.id },
        include: { plan: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ plans, investments });
  } catch (error) {
    return handleApiError(error);
  }
}
