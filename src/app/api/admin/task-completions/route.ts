import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const status = req.nextUrl.searchParams.get("status");

    // "auto_rejected" surfaces system-auto-rejected duplicate screenshots
    // specifically (proofImageHash set) for admin to review/override -
    // the system takes the lead on the decision, this is the override path.
    const where =
      status === "auto_rejected"
        ? { status: "REJECTED", proofImageHash: { not: null } }
        : { status: "PENDING_REVIEW" };

    const completions = await prisma.userTaskCompletion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { user: { select: { fullName: true, email: true } }, task: true },
    });
    return NextResponse.json({ completions });
  } catch (error) {
    return handleApiError(error);
  }
}
