import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function POST() {
  try {
    const user = await requireUser();
    await prisma.notification.updateMany({
      where: { OR: [{ userId: user.id }, { isBroadcast: true }], isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
