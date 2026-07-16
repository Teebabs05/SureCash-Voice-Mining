import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

const schema = z.object({
  facebookUrl: z.string().max(200).optional().or(z.literal("")),
  instagramHandle: z.string().max(100).optional().or(z.literal("")),
  tiktokHandle: z.string().max(100).optional().or(z.literal("")),
});

export async function GET() {
  try {
    const user = await requireUser();
    const record = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { facebookUrl: true, instagramHandle: true, tiktokHandle: true },
    });
    return NextResponse.json({ socialAccounts: record });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        facebookUrl: body.facebookUrl || null,
        instagramHandle: body.instagramHandle || null,
        tiktokHandle: body.tiktokHandle || null,
      },
      select: { facebookUrl: true, instagramHandle: true, tiktokHandle: true },
    });

    return NextResponse.json({ socialAccounts: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
