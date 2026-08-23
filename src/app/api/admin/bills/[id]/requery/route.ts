import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { getVtuProvider } from "@/lib/payments/vtu-provider";
import { resolvePurchase } from "@/lib/server/bills";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { ipAddress, userAgent } = getRequestMeta(req);

    const purchase = await prisma.billPurchase.findUnique({ where: { id } });
    if (!purchase) return jsonError("Purchase not found", 404);
    if (purchase.status !== "PROCESSING" && purchase.status !== "PENDING") {
      return jsonError("This purchase isn't awaiting confirmation", 409);
    }

    const adapter = await getVtuProvider(purchase.provider);
    const result = await adapter.requeryOrder(purchase.reference);
    if (result) await resolvePurchase(purchase.id, result);

    await writeAuditLog({ userId: admin.id, action: "admin.bill_purchase_requeried", ipAddress, userAgent, metadata: { billPurchaseId: id } });

    const updated = await prisma.billPurchase.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({
      purchase: updated,
      note: result ? undefined : "No update yet from the provider",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
