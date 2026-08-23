import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { purchaseBill } from "@/lib/server/bills";
import { getDefaultVtuProvider, getVtuProvider } from "@/lib/payments/vtu-provider";

const NETWORKS = ["mtn", "airtel", "glo", "9mobile"] as const;
const VALUES = [100, 200, 500] as const;

const schema = z.object({
  network: z.enum(NETWORKS),
  value: z.number().refine((v): v is (typeof VALUES)[number] => (VALUES as readonly number[]).includes(v), "Invalid pin value"),
  quantity: z.number().int().min(1).max(40),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const provider = await getDefaultVtuProvider();
    const adapter = await getVtuProvider(provider);
    const amount = body.value * body.quantity;

    const purchase = await purchaseBill({
      userId: user.id,
      provider,
      serviceType: "EPIN",
      serviceId: body.network,
      variationId: `${body.value}x${body.quantity}`,
      recipient: `${body.quantity} × ₦${body.value} ${body.network.toUpperCase()} pin${body.quantity > 1 ? "s" : ""}`,
      amount,
      call: async (reference) =>
        adapter.buyEpins({ reference, network: body.network, value: body.value, quantity: body.quantity }),
    });

    return NextResponse.json({ purchase });
  } catch (error) {
    return handleApiError(error);
  }
}
