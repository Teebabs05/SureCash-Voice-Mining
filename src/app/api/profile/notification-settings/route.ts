import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({
      emailNotificationsEnabled: user.emailNotificationsEnabled,
      loginAlertsEnabled: user.loginAlertsEnabled,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const schema = z
  .object({
    emailNotificationsEnabled: z.boolean().optional(),
    loginAlertsEnabled: z.boolean().optional(),
  })
  .refine((body) => body.emailNotificationsEnabled !== undefined || body.loginAlertsEnabled !== undefined, {
    message: "Nothing to update",
  });

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    if (Object.keys(body).length === 0) {
      return jsonError("Nothing to update", 422);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: body,
      select: { emailNotificationsEnabled: true, loginAlertsEnabled: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
