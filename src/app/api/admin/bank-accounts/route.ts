import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

// Only accounts that never got a real automatic name-match need a human to
// look at them - once autoVerified is true (Paystack resolved it) there's
// nothing left to manually check.
export async function GET() {
  try {
    await requireAdmin();
    const accounts = await prisma.bankAccount.findMany({
      where: { autoVerified: false, reviewedAt: null },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    return NextResponse.json({ accounts });
  } catch (error) {
    return handleApiError(error);
  }
}
