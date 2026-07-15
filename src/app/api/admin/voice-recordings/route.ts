import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "FLAGGED";

    const recordings = await prisma.voiceRecording.findMany({
      where: { status: status as never },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { fullName: true, email: true } },
        voiceTask: { select: { title: true, rewardAmount: true } },
        aiResult: true,
      },
    });

    return NextResponse.json({ recordings });
  } catch (error) {
    return handleApiError(error);
  }
}
