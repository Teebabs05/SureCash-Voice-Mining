import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { getDefaultVtuProvider, getVtuProvider } from "@/lib/payments/vtu-provider";

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const network = new URL(req.url).searchParams.get("network") ?? undefined;
    const provider = await getVtuProvider(await getDefaultVtuProvider());
    const variations = await provider.listDataVariations(network);
    return NextResponse.json({ variations });
  } catch (error) {
    return handleApiError(error);
  }
}
