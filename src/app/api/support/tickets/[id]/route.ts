import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { replies: { orderBy: { createdAt: "asc" }, include: { author: { select: { fullName: true, role: true } } } } },
    });
    if (!ticket || ticket.userId !== user.id) return jsonError("Ticket not found", 404);
    return NextResponse.json({ ticket });
  } catch (error) {
    return handleApiError(error);
  }
}
