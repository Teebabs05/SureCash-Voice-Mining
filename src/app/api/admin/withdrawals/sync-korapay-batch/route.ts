import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { syncKorapayBatch } from "@/lib/server/withdrawal-bulk-payout";

const schema = z.object({ batchReference: z.string().min(1) });

/**
 * Manual reconciliation fallback for a Korapay bulk batch — same role as
 * the Binance "check status" action, in case a per-payout webhook was
 * missed or delayed.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = schema.safeParse(await req.json());
    if (!body.success) return jsonError(body.error.issues[0]?.message ?? "Invalid request", 400);

    const result = await syncKorapayBatch(body.data.batchReference, admin.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
