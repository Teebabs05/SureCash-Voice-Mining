import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

const schema = z.object({ subject: z.string().min(3), message: z.string().min(3) });

export async function GET() {
  try {
    const user = await requireUser();
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ tickets });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { subject, message } = schema.parse(await req.json());
    const ticket = await prisma.supportTicket.create({
      data: { userId: user.id, subject, message },
    });
    return NextResponse.json({ ticket });
  } catch (error) {
    return handleApiError(error);
  }
}
