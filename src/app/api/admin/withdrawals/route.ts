import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const withdrawals = await prisma.withdrawal.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { fullName: true, email: true } }, bankAccount: true },
    });

    return NextResponse.json({ withdrawals });
  } catch (error) {
    return handleApiError(error);
  }
}
