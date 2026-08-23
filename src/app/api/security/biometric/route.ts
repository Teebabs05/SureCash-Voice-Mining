import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    const deviceCount = await prisma.webAuthnCredential.count({ where: { userId: user.id } });
    return NextResponse.json({ enabled: deviceCount > 0, deviceCount });
  } catch (error) {
    return handleApiError(error);
  }
}

// Turns biometric login off by removing every registered device for this
// account - simplest mapping for a single on/off toggle in Settings.
export async function DELETE() {
  try {
    const user = await requireUser();
    await prisma.webAuthnCredential.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
