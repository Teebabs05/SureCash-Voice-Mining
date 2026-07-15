import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const type = searchParams.get("type");

    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: user.id, ...(type ? { wallet: { type: type as never } } : {}) },
      orderBy: { createdAt: "desc" },
      take: 20,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: { wallet: true },
    });

    const nextCursor = transactions.length === 20 ? transactions[transactions.length - 1].id : null;

    return NextResponse.json({ transactions, nextCursor });
  } catch (error) {
    return handleApiError(error);
  }
}
