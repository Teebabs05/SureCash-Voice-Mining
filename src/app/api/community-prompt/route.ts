import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { getSetting } from "@/lib/server/settings";

const DAY_MS = 24 * 60 * 60 * 1000;

// Shows once, on the first dashboard load that happens >=24h after signup -
// communityPromptSeenAt being set at all (regardless of when) means it's
// already been shown and should never show again.
export async function GET() {
  try {
    const user = await requireUser();
    const [whatsappUrl, telegramUrl] = await Promise.all([
      getSetting("social_whatsapp_url", ""),
      getSetting("social_telegram_url", ""),
    ]);

    const eligible = user.communityPromptSeenAt === null && Date.now() - user.createdAt.getTime() >= DAY_MS;
    const show = eligible && Boolean(whatsappUrl || telegramUrl);

    return NextResponse.json({ show, whatsappUrl, telegramUrl });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    await prisma.user.update({ where: { id: user.id }, data: { communityPromptSeenAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
