import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { broadcastNotification } from "@/lib/server/notifications";

const schema = z.object({ title: z.string().min(2), body: z.string().min(2) });

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { title, body } = schema.parse(await req.json());
    const notification = await broadcastNotification({ title, body, type: "ADMIN" });
    return NextResponse.json({ notification });
  } catch (error) {
    return handleApiError(error);
  }
}
