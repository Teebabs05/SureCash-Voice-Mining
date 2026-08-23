import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { purchaseBill } from "@/lib/server/bills";
import { getDefaultVtuProvider, getVtuProvider } from "@/lib/payments/vtu-provider";

const schema = z.object({
  customerId: z.string().min(1).max(30),
  provider: z.string().min(1),
  amount: z.number().positive().max(500000),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const providerName = await getDefaultVtuProvider();
    const adapter = await getVtuProvider(providerName);

    const purchase = await purchaseBill({
      userId: user.id,
      provider: providerName,
      serviceType: "BETTING",
      serviceId: body.provider,
      recipient: body.customerId,
      amount: body.amount,
      call: async (reference) =>
        adapter.fundBetting({ reference, customerId: body.customerId, provider: body.provider, amount: body.amount }),
    });

    return NextResponse.json({ purchase });
  } catch (error) {
    return handleApiError(error);
  }
}
