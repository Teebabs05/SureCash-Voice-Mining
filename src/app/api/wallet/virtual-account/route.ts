import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { createVirtualAccount, isBillstackConfigured } from "@/lib/payments/billstack";

/**
 * Returns the current user's dedicated BillStack virtual account, creating
 * it on first request. Any bank transfer into this account is credited to
 * the user's Main wallet automatically via /api/webhooks/billstack.
 */
export async function GET() {
  try {
    const user = await requireUser();

    if (!(await isBillstackConfigured())) {
      return jsonError("Bank transfer funding isn't configured yet", 503);
    }

    const existing = await prisma.virtualAccount.findUnique({ where: { userId: user.id } });
    if (existing) return NextResponse.json({ account: existing });

    const created = await createVirtualAccount({
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
    });

    const account = await prisma.virtualAccount.create({
      data: {
        userId: user.id,
        provider: "BILLSTACK",
        accountNumber: created.accountNumber,
        accountName: created.accountName,
        bankName: created.bankName,
        externalRef: created.externalRef,
      },
    });

    return NextResponse.json({ account });
  } catch (error) {
    return handleApiError(error);
  }
}
