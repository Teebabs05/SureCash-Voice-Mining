import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { saveUploadedFile } from "@/lib/server/storage";
import { generateReference } from "@/lib/utils";
import { notifyUser } from "@/lib/server/notifications";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const amount = Number(form.get("amount"));
    const receipt = form.get("receipt");

    if (!amount || amount <= 0) return jsonError("Enter a valid amount", 422);
    if (!(receipt instanceof Blob)) return jsonError("Please attach your deposit receipt", 422);

    const buffer = Buffer.from(await receipt.arrayBuffer());
    const extension = (receipt.type.split("/")[1] || "jpg").split(";")[0];
    const receiptUrl = await saveUploadedFile({ folder: "receipts", buffer, extension });

    const deposit = await prisma.deposit.create({
      data: {
        userId: user.id,
        amount,
        method: "MANUAL_BANK",
        reference: generateReference("DEP"),
        receiptUrl,
        status: "PENDING",
      },
    });

    await notifyUser({
      userId: user.id,
      title: "Deposit submitted",
      body: `Your deposit of ${amount} is pending admin review.`,
      type: "WALLET",
    });

    return NextResponse.json({ deposit });
  } catch (error) {
    return handleApiError(error);
  }
}
