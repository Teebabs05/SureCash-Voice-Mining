import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    const purchases = await prisma.billPurchase.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ purchases });
  } catch (error) {
    return handleApiError(error);
  }
}
