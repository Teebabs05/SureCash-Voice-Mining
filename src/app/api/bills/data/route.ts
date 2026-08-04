import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { purchaseBill } from "@/lib/server/bills";
import { getDefaultVtuProvider, getVtuProvider } from "@/lib/payments/vtu-provider";

const NETWORKS = ["mtn", "airtel", "glo", "9mobile", "smile"] as const;

const schema = z.object({
  phone: z.string().min(10).max(16),
  network: z.enum(NETWORKS),
  variationId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const provider = await getDefaultVtuProvider();
    const adapter = await getVtuProvider(provider);

    // Re-fetch the plan so the price (and therefore the wallet debit) is
    // never trusted from client input.
    const variations = await adapter.listDataVariations(body.network);
    const plan = variations.find((v) => v.variationId === body.variationId);
    if (!plan) return jsonError("That data plan is no longer available - refresh and try again", 400);
    if (!plan.available) return jsonError("That data plan is currently unavailable", 400);

    const purchase = await purchaseBill({
      userId: user.id,
      provider,
      serviceType: "DATA",
      serviceId: body.network,
      variationId: body.variationId,
      recipient: body.phone,
      amount: plan.price,
      call: async (reference) =>
        adapter.buyData({ reference, phone: body.phone, network: body.network, variationId: body.variationId }),
    });

    return NextResponse.json({ purchase });
  } catch (error) {
    return handleApiError(error);
  }
}
