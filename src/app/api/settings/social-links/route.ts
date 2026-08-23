import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { getSetting } from "@/lib/server/settings";

export async function GET() {
  try {
    await requireUser();
    const [whatsappUrl, telegramUrl] = await Promise.all([
      getSetting("social_whatsapp_url", ""),
      getSetting("social_telegram_url", ""),
    ]);
    return NextResponse.json({ whatsappUrl, telegramUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
