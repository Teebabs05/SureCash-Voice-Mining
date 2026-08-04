import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { purchaseBill } from "@/lib/server/bills";
import { getDefaultVtuProvider, getVtuProvider } from "@/lib/payments/vtu-provider";

const NETWORKS = ["mtn", "airtel", "glo", "9mobile"] as const;

const schema = z.object({
  phone: z.string().min(10).max(16),
  network: z.enum(NETWORKS),
  amount: z.number().positive().max(50000),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const provider = await getDefaultVtuProvider();

    const purchase = await purchaseBill({
      userId: user.id,
      provider,
      serviceType: "AIRTIME",
      serviceId: body.network,
      recipient: body.phone,
      amount: body.amount,
      call: async (reference) => {
        const adapter = await getVtuProvider(provider);
        return adapter.buyAirtime({ reference, phone: body.phone, network: body.network, amount: body.amount });
      },
    });

    return NextResponse.json({ purchase });
  } catch (error) {
    return handleApiError(error);
  }
}
