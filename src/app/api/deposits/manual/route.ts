import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { saveUploadedFile } from "@/lib/server/storage";
import { generateReference } from "@/lib/utils";
import { notifyUser } from "@/lib/server/notifications";
import { hashBuffer } from "@/lib/server/file-hash";
import { getSetting } from "@/lib/server/settings";
import { sendEmail, manualDepositSubmittedEmailHtml } from "@/lib/notifications/email";

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
    const receiptHash = hashBuffer(buffer);

    // A receipt image already in use by another pending/approved deposit is
    // a clear reuse/fraud signal - refuse the submission outright rather
    // than queuing it for manual review. Resubmission is still allowed if
    // every prior match was REJECTED (e.g. the user just mistyped the
    // amount and is correcting it with the same real receipt).
    const duplicate = await prisma.deposit.findFirst({
      where: { receiptHash, status: { in: ["PENDING", "APPROVED"] } },
    });
    if (duplicate) {
      return jsonError("This receipt has already been submitted. Please upload a fresh receipt for this transfer.", 409);
    }

    const extension = (receipt.type.split("/")[1] || "jpg").split(";")[0];
    const receiptUrl = await saveUploadedFile({ folder: "receipts", buffer, extension });

    const deposit = await prisma.deposit.create({
      data: {
        userId: user.id,
        amount,
        method: "MANUAL_BANK",
        reference: generateReference("DEP"),
        receiptUrl,
        receiptHash,
        status: "PENDING",
      },
    });

    await notifyUser({
      userId: user.id,
      title: "Deposit submitted",
      body: `Your deposit of ${amount} is pending admin review.`,
      type: "WALLET",
    });

    // Best-effort — a notification failure should never block the user's
    // submission, which has already succeeded at this point.
    getSetting("support_notification_email", "").then((supportEmail) => {
      if (!supportEmail) return;
      return sendEmail({
        to: supportEmail,
        subject: "New manual deposit awaiting review",
        html: manualDepositSubmittedEmailHtml({
          fullName: user.fullName,
          email: user.email,
          amount: String(amount),
          reference: deposit.reference,
          reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/deposits`,
        }),
      });
    }).catch(() => {});

    return NextResponse.json({ deposit });
  } catch (error) {
    return handleApiError(error);
  }
}
