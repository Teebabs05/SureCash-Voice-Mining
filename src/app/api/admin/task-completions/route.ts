import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    await requireAdmin();
    const completions = await prisma.userTaskCompletion.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true, email: true } }, task: true },
    });
    return NextResponse.json({ completions });
  } catch (error) {
    return handleApiError(error);
  }
}
