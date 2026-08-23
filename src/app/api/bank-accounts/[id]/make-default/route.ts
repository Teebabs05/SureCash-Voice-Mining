import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const account = await prisma.bankAccount.findUnique({ where: { id } });
    if (!account || account.userId !== user.id) return jsonError("Bank account not found", 404);

    await prisma.$transaction([
      prisma.bankAccount.updateMany({ where: { userId: user.id, isPrimary: true }, data: { isPrimary: false } }),
      prisma.bankAccount.update({ where: { id }, data: { isPrimary: true } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
