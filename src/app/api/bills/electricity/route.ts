import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { purchaseBill } from "@/lib/server/bills";
import { getDefaultVtuProvider, getVtuProvider } from "@/lib/payments/vtu-provider";

const schema = z.object({
  meterNumber: z.string().min(5).max(20),
  disco: z.string().min(1),
  meterType: z.enum(["prepaid", "postpaid"]),
  amount: z.number().positive().max(100000),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const provider = await getDefaultVtuProvider();
    const adapter = await getVtuProvider(provider);

    const purchase = await purchaseBill({
      userId: user.id,
      provider,
      serviceType: "ELECTRICITY",
      serviceId: body.disco,
      variationId: body.meterType,
      recipient: body.meterNumber,
      amount: body.amount,
      call: async (reference) =>
        adapter.buyElectricity({
          reference,
          meterNumber: body.meterNumber,
          disco: body.disco,
          meterType: body.meterType,
          amount: body.amount,
        }),
    });

    return NextResponse.json({ purchase });
  } catch (error) {
    return handleApiError(error);
  }
}
