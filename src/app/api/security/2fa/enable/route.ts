import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function POST() {
  try {
    const user = await requireUser();
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
