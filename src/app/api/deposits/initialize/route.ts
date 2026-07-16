import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { getPaymentProvider } from "@/lib/payments/provider";
import { generateReference } from "@/lib/utils";

const schema = z.object({
  amount: z.number().positive(),
  method: z.enum(["PAYSTACK", "MONNIFY", "KORAPAY", "FLUTTERWAVE"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { amount, method } = schema.parse(await req.json());

    const reference = generateReference("DEP");
    const provider = getPaymentProvider(method);

    let authorizationUrl: string;
    try {
      const result = await provider.initialize({ amount, email: user.email, reference, name: user.fullName });
      authorizationUrl = result.authorizationUrl;
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : `${method} is unavailable`, 503);
    }

    await prisma.deposit.create({
      data: { userId: user.id, amount, method, reference, status: "PENDING" },
    });

    return NextResponse.json({ authorizationUrl, reference });
  } catch (error) {
    return handleApiError(error);
  }
}
