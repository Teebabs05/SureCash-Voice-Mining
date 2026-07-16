import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { getRequestMeta } from "@/lib/server/audit";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { endpoint, keys } = schema.parse(await req.json());
    const { userAgent } = getRequestMeta(req);

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth, userAgent },
      create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent },
    });

    return NextResponse.json({ subscribed: true });
  } catch (error) {
    return handleApiError(error);
  }
}

const deleteSchema = z.object({ endpoint: z.string().url() });

export async function DELETE(req: NextRequest) {
  try {
    await requireUser();
    const { endpoint } = deleteSchema.parse(await req.json());
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return NextResponse.json({ subscribed: false });
  } catch (error) {
    return handleApiError(error);
  }
}
