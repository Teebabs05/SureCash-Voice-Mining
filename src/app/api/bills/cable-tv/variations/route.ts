import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { getDefaultVtuProvider, getVtuProvider } from "@/lib/payments/vtu-provider";

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const provider = new URL(req.url).searchParams.get("provider") ?? undefined;
    const adapter = await getVtuProvider(await getDefaultVtuProvider());
    const variations = await adapter.listCableVariations(provider);
    return NextResponse.json({ variations });
  } catch (error) {
    return handleApiError(error);
  }
}
