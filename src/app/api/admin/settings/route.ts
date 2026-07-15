import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

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
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
    return NextResponse.json({ setting });
  } catch (error) {
    return handleApiError(error);
  }
}
