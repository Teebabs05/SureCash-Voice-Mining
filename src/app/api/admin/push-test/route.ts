import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/server/current-user";
import { prisma } from "@/lib/prisma";
import { sendPushToUser, getVapidPublicKey } from "@/lib/server/push";
import { sendFcmToUser, isFcmConfigured } from "@/lib/server/fcm";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const admin = await requireSuperAdmin();
    const [vapidConfigured, fcmConfigured, subscriptionCount, deviceTokenCount, myDeviceTokens, mySubscriptions] = await Promise.all([
      getVapidPublicKey().then((k) => k !== null),
      isFcmConfigured(),
      prisma.pushSubscription.count(),
      prisma.deviceToken.count(),
      prisma.deviceToken.count({ where: { userId: admin.id } }),
      prisma.pushSubscription.count({ where: { userId: admin.id } }),
    ]);

    return NextResponse.json({
      webPush: { configured: vapidConfigured, totalSubscriptions: subscriptionCount, yourSubscriptions: mySubscriptions },
      androidPush: { configured: fcmConfigured, totalDevices: deviceTokenCount, yourDevices: myDeviceTokens },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Sends a real test notification to the calling admin through both push
 * channels and reports exactly what happened on each - so "push isn't
 * working" can be diagnosed from real send results instead of guessing.
 */
export async function POST() {
  try {
    const admin = await requireSuperAdmin();

    await prisma.notification.create({
      data: { userId: admin.id, title: "Test notification", body: "This is a push notification test.", type: "SYSTEM" },
    });

    const [webPush, androidPush] = await Promise.all([
      sendPushToUser(admin.id, { title: "Test notification", body: "If you see this, Web Push is working." }),
      sendFcmToUser(admin.id, { title: "Test notification", body: "If you see this, Android push is working." }),
    ]);

    return NextResponse.json({ webPush, androidPush });
  } catch (error) {
    return handleApiError(error);
  }
}
