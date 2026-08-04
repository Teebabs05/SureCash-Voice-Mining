import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { getAirtimeToCashProvider } from "@/lib/payments/vtu-provider";

const schema = z.object({ network: z.enum(["mtn", "airtel", "glo", "9mobile"]) });

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = schema.parse(await req.json());
    const provider = await getAirtimeToCashProvider();
    const availability = await provider.checkAvailability(body.network);
    return NextResponse.json({ availability });
  } catch (error) {
    return handleApiError(error);
  }
}
