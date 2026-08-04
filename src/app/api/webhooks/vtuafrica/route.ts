import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAirtimeToCashWebhook } from "@/lib/server/bills";

/**
 * VTUAfrica's docs don't describe any signature/auth scheme for this
 * webhook (unlike Korapay's HMAC or VTU.ng's user_pin-signed payload) -
 * security here relies on `ref` being an unguessable reference this app
 * generated itself (generateReference("A2C")), plus a sanity check that
 * the reported amount matches what this specific conversion claimed.
 * Worth tightening if VTUAfrica documents a real signature scheme later.
 *
 * Per their docs, the response body itself matters - VTUAfrica won't
 * consider the merchant "successfully funded" without a response
 * containing "code":101 or "status":"Completed".
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.ref) return NextResponse.json({ code: 400, message: "Missing ref" }, { status: 400 });

  const reference = String(body.ref);
  const status = String(body.status ?? "").toLowerCase();
  const claimedAmount = body.amount != null ? Number(body.amount) : null;

  const purchase = await prisma.billPurchase.findUnique({ where: { reference } });
  if (!purchase || purchase.serviceType !== "AIRTIME_TO_CASH") {
    return NextResponse.json({ code: 404, message: "Unknown reference" }, { status: 404 });
  }
  if (claimedAmount != null && Math.abs(claimedAmount - Number(purchase.amount)) > 0.01) {
    console.error("[webhooks:vtuafrica] amount mismatch", JSON.stringify({ reference, claimedAmount, expected: purchase.amount }));
    return NextResponse.json({ code: 400, message: "Amount mismatch" }, { status: 400 });
  }

  await resolveAirtimeToCashWebhook(reference, {
    status: status === "completed" ? "completed" : "failed",
    creditAmount: body.credit != null ? Number(body.credit) : undefined,
    message: typeof body.message === "string" ? body.message : undefined,
    raw: body,
  });

  return NextResponse.json({ code: 101, status: "Completed", message: "Webhook processed" });
}
