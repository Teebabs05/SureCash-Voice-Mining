import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

const schema = z.object({
  token: z.string().min(1),
  platform: z.string().default("android"),
});

/**
 * Called by the Android app's WebView bridge (window.SureCashMiningApp.registerPushToken,
 * see AndroidPushBridge) after every page load with its current Firebase token.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { token, platform } = schema.parse(await req.json());

    await prisma.deviceToken.upsert({
      where: { token },
      update: { userId: user.id, platform },
      create: { userId: user.id, token, platform },
    });

    return NextResponse.json({ registered: true });
  } catch (error) {
    return handleApiError(error);
  }
}
