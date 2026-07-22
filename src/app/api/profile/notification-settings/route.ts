import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ emailNotificationsEnabled: user.emailNotificationsEnabled });
  } catch (error) {
    return handleApiError(error);
  }
}

const schema = z.object({ emailNotificationsEnabled: z.boolean() });

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { emailNotificationsEnabled: body.emailNotificationsEnabled },
      select: { emailNotificationsEnabled: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
