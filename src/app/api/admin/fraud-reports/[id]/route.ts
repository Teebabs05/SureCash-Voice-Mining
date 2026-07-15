import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

const schema = z.object({ status: z.enum(["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { status } = schema.parse(await req.json());

    const report = await prisma.fraudReport.update({
      where: { id },
      data: {
        status,
        reviewedById: admin.id,
        resolvedAt: status === "RESOLVED" || status === "DISMISSED" ? new Date() : null,
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    return handleApiError(error);
  }
}
