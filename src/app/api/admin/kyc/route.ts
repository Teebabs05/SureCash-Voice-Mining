import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    await requireAdmin();
    const documents = await prisma.kycDocument.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, fullName: true, email: true, kycStatus: true } } },
    });
    return NextResponse.json({ documents });
  } catch (error) {
    return handleApiError(error);
  }
}
