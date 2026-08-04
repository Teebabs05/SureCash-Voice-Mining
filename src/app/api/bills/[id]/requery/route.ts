import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { getVtuProvider } from "@/lib/payments/vtu-provider";
import { resolvePurchase } from "@/lib/server/bills";

/**
 * User-facing status check for their own purchase stuck in PROCESSING —
 * VTU.ng's own docs say their "completed" webhook only fires for
 * admin-manually-triggered completions on their side, so a purchase that
 * resolved on VTU.ng's end can otherwise sit unreflected here indefinitely.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const purchase = await prisma.billPurchase.findUnique({ where: { id } });
    if (!purchase || purchase.userId !== user.id) return jsonError("Purchase not found", 404);
    if (purchase.status !== "PROCESSING" && purchase.status !== "PENDING") {
      return jsonError("This purchase isn't awaiting confirmation", 409);
    }

    const adapter = await getVtuProvider(purchase.provider);
    const result = await adapter.requeryOrder(purchase.reference);
    if (result) await resolvePurchase(purchase.id, result);

    const updated = await prisma.billPurchase.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({
      purchase: updated,
      note: result ? undefined : "No update yet from the provider",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
