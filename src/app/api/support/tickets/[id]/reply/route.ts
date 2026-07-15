import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";

const schema = z.object({ message: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { message } = schema.parse(await req.json());

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket || ticket.userId !== user.id) return jsonError("Ticket not found", 404);
    if (ticket.status === "CLOSED") return jsonError("This ticket is closed", 409);

    const reply = await prisma.supportTicketReply.create({
      data: { ticketId: id, authorId: user.id, message, isAdmin: false },
    });
    await prisma.supportTicket.update({ where: { id }, data: { status: "OPEN" } });

    return NextResponse.json({ reply });
  } catch (error) {
    return handleApiError(error);
  }
}
