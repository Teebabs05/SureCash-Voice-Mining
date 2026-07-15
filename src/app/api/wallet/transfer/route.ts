import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { creditWallet, debitWallet } from "@/lib/server/wallet";
import { generateReference } from "@/lib/utils";

const walletTypes = ["MAIN", "MINING", "VOICE", "REFERRAL", "TASK", "BONUS"] as const;

const schema = z
  .object({
    from: z.enum(walletTypes),
    to: z.enum(walletTypes),
    amount: z.number().positive(),
  })
  .refine((v) => v.from !== v.to, { message: "Choose two different wallets" });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { from, to, amount } = schema.parse(await req.json());
    const reference = generateReference("XFR");

    await prisma.$transaction(async (tx) => {
      await debitWallet({
        userId: user.id,
        type: from,
        amount,
        reason: "WALLET_TRANSFER",
        description: `Transfer to ${to} wallet`,
        reference: `${reference}_OUT`,
        client: tx,
      });
      await creditWallet({
        userId: user.id,
        type: to,
        amount,
        reason: "WALLET_TRANSFER",
        description: `Transfer from ${from} wallet`,
        reference: `${reference}_IN`,
        client: tx,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
