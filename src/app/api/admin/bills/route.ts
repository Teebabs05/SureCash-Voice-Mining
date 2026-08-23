import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const purchases = await prisma.billPurchase.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { fullName: true, email: true } } },
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    return handleApiError(error);
  }
}
