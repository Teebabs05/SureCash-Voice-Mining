import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const session = await prisma.session.findUnique({ where: { id } });
    if (!session || session.userId !== user.id) {
      return jsonError("Session not found", 404);
    }

    await prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
