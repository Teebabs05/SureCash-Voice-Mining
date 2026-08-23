import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const account = await prisma.bankAccount.findUnique({ where: { id } });
    if (!account || account.userId !== user.id) return jsonError("Bank account not found", 404);

    try {
      await prisma.bankAccount.delete({ where: { id } });
    } catch (error) {
      // A past withdrawal references this account (FK restrict) - keep the
      // record rather than leaving withdrawal history dangling.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        return jsonError("This account can't be removed because it's linked to a past withdrawal. Contact support if it needs correcting.", 409);
      }
      throw error;
    }

    // Removing the default account shouldn't leave the user with no default
    // at all - hand it to whichever account they added next most recently.
    if (account.isPrimary) {
      const next = await prisma.bankAccount.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
      if (next) await prisma.bankAccount.update({ where: { id: next.id }, data: { isPrimary: true } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
