import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { getDefaultVtuProvider, getVtuProvider } from "@/lib/payments/vtu-provider";

const schema = z.object({
  smartcardNumber: z.string().min(5).max(20),
  provider: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = schema.parse(await req.json());
    const adapter = await getVtuProvider(await getDefaultVtuProvider());
    const customer = await adapter.verifyCableCustomer(body);
    return NextResponse.json({ customer });
  } catch (error) {
    return handleApiError(error);
  }
}
