import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { notifyUser } from "@/lib/server/notifications";

const schema = z.object({ message: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { message } = schema.parse(await req.json());

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status: "ANSWERED" },
    });

    const reply = await prisma.supportTicketReply.create({
      data: { ticketId: id, authorId: admin.id, message, isAdmin: true },
    });

    await notifyUser({
      userId: ticket.userId,
      title: "Support replied to your ticket",
      body: `"${ticket.subject}" has a new reply from support.`,
      type: "SYSTEM",
    });

    return NextResponse.json({ reply });
  } catch (error) {
    return handleApiError(error);
  }
}
