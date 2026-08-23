import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet, debitWallet, InsufficientBalanceError } from "@/lib/server/wallet";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  walletType: z.enum(["MAIN", "ENGAGEMENT", "SALES"]),
  direction: z.enum(["credit", "debit"]),
  amount: z.number().positive(),
  reason: z.string().min(3),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());
    const { ipAddress, userAgent } = getRequestMeta(req);

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, fullName: true } });
    if (!user) return jsonError("User not found", 404);

    const adjust = body.direction === "credit" ? creditWallet : debitWallet;
    await adjust({
      userId: id,
      type: body.walletType,
      amount: body.amount,
      reason: "ADMIN_ADJUSTMENT",
      description: `Manual ${body.direction} by admin: ${body.reason}`,
      metadata: { adminId: admin.id, adminNote: body.reason },
    });

    await notifyUser({
      userId: id,
      title: body.direction === "credit" ? "Wallet credited" : "Wallet debited",
      body: `An admin ${body.direction === "credit" ? "added" : "removed"} ${formatCurrency(body.amount)} ${
        body.direction === "credit" ? "to" : "from"
      } your ${body.walletType.toLowerCase()} wallet: ${body.reason}`,
      type: "ADMIN",
    });

    await writeAuditLog({
      userId: admin.id,
      action: `admin.wallet_${body.direction}`,
      ipAddress,
      userAgent,
      metadata: { targetUserId: id, walletType: body.walletType, amount: body.amount, reason: body.reason },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      return jsonError("User doesn't have enough balance in that wallet for this debit", 400);
    }
    return handleApiError(error);
  }
}
