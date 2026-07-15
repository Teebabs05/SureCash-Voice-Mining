import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    const devices = await prisma.device.findMany({
      where: { userId: user.id },
      orderBy: { lastSeenAt: "desc" },
    });
    return NextResponse.json({ devices });
  } catch (error) {
    return handleApiError(error);
  }
}
