import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";

const schema = z.object({ status: z.enum(["OPEN", "ANSWERED", "CLOSED"]) });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, email: true } },
        replies: { orderBy: { createdAt: "asc" }, include: { author: { select: { fullName: true, role: true } } } },
      },
    });
    if (!ticket) return jsonError("Ticket not found", 404);
    return NextResponse.json({ ticket });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { status } = schema.parse(await req.json());
    const ticket = await prisma.supportTicket.update({ where: { id }, data: { status } });
    return NextResponse.json({ ticket });
  } catch (error) {
    return handleApiError(error);
  }
}
