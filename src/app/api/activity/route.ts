import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { formatCurrency } from "@/lib/utils";

function firstNameCity(fullName: string) {
  return fullName.split(" ")[0];
}

/**
 * Builds a real-activity feed from actual platform events (not fabricated
 * names/amounts) so the ticker stays trustworthy. Returns an empty array —
 * rendered as a generic system message client-side — when there isn't
 * enough real activity yet, rather than inventing fake ones.
 */
export async function GET() {
  try {
    await requireUser();

    const [withdrawals, voiceApprovals] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { status: "PAID" },
        orderBy: { processedAt: "desc" },
        take: 5,
        include: { user: { select: { fullName: true } } },
      }),
      prisma.voiceRecording.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { fullName: true } } },
      }),
    ]);

    const events = [
      ...withdrawals.map((w) => ({
        id: `w_${w.id}`,
        text: `${firstNameCity(w.user.fullName)} just completed a withdrawal of ${formatCurrency(Number(w.amount))}`,
        createdAt: w.processedAt ?? w.createdAt,
      })),
      ...voiceApprovals.map((r) => ({
        id: `v_${r.id}`,
        text: `${firstNameCity(r.user.fullName)} earned a reward from a voice task`,
        createdAt: r.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ events: events.slice(0, 8) });
  } catch (error) {
    return handleApiError(error);
  }
}
