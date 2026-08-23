import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { initiateKorapayBulkPayout, MIN_BULK_PAYOUT_COUNT, MAX_BULK_PAYOUT_COUNT } from "@/lib/server/withdrawal-bulk-payout";

const schema = z.object({
  withdrawalIds: z.array(z.string().min(1)).min(MIN_BULK_PAYOUT_COUNT).max(MAX_BULK_PAYOUT_COUNT),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = schema.safeParse(await req.json());
    if (!body.success) return jsonError(body.error.issues[0]?.message ?? "Invalid request", 400);

    const result = await initiateKorapayBulkPayout(body.data.withdrawalIds, admin.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
