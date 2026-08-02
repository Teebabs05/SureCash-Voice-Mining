import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    await requireAdmin();

    const submissions = await prisma.userTaskCompletion.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        task: { select: { id: true, title: true, type: true } },
      },
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    return handleApiError(error);
  }
}
