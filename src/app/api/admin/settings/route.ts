import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { setSetting } from "@/lib/server/settings";

const schema = z.object({ key: z.string().min(1), value: z.unknown() });

export async function GET() {
  try {
    await requireAdmin();
    const settings = await prisma.setting.findMany();
    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const { key, value } = schema.parse(await req.json());
    // Routed through setSetting() (not a raw prisma upsert) so the
    // short-lived in-memory settings cache is invalidated immediately —
    // otherwise an admin's change could take up to 30s to take effect.
    await setSetting(key, value);
    return NextResponse.json({ setting: { key, value } });
  } catch (error) {
    return handleApiError(error);
  }
}
