import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    await requireAdmin();
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { updatedAt: "desc" },
      include: { user: { select: { fullName: true, email: true } } },
    });
    return NextResponse.json({ tickets });
  } catch (error) {
    return handleApiError(error);
  }
}
