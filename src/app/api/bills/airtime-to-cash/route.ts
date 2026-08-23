import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { initiateAirtimeToCash } from "@/lib/server/bills";
import { getAirtimeToCashProvider } from "@/lib/payments/vtu-provider";

const schema = z.object({
  network: z.enum(["mtn", "airtel", "glo", "9mobile"]),
  senderPhone: z.string().min(10).max(16),
  amount: z.number().positive(),
  sitePhone: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const provider = await getAirtimeToCashProvider();

    const purchase = await initiateAirtimeToCash({
      userId: user.id,
      network: body.network,
      senderEmail: user.email,
      senderPhone: body.senderPhone,
      amount: body.amount,
      sitePhone: body.sitePhone,
      convert: (reference) =>
        provider.convert({
          reference,
          network: body.network,
          senderEmail: user.email,
          senderPhone: body.senderPhone,
          amount: body.amount,
          sitePhone: body.sitePhone,
        }),
    });

    return NextResponse.json({ purchase });
  } catch (error) {
    return handleApiError(error);
  }
}
