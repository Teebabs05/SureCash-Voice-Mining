import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { purchaseBill } from "@/lib/server/bills";
import { getDefaultVtuProvider, getVtuProvider } from "@/lib/payments/vtu-provider";

const schema = z.object({
  smartcardNumber: z.string().min(5).max(20),
  provider: z.string().min(1),
  variationId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const provider = await getDefaultVtuProvider();
    const adapter = await getVtuProvider(provider);

    // Re-fetch the bouquet price rather than trust client input.
    const variations = await adapter.listCableVariations(body.provider);
    const bouquet = variations.find((v) => v.variationId === body.variationId);
    if (!bouquet) return jsonError("That bouquet is no longer available - refresh and try again", 400);
    if (!bouquet.available) return jsonError("That bouquet is currently unavailable", 400);

    const purchase = await purchaseBill({
      userId: user.id,
      provider,
      serviceType: "CABLE_TV",
      serviceId: body.provider,
      variationId: body.variationId,
      recipient: body.smartcardNumber,
      amount: bouquet.price,
      call: async (reference) =>
        adapter.buyCableTv({
          reference,
          smartcardNumber: body.smartcardNumber,
          provider: body.provider,
          variationId: body.variationId,
        }),
    });

    return NextResponse.json({ purchase });
  } catch (error) {
    return handleApiError(error);
  }
}
