import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    await requireAdmin();

    const [flaggedGroups, vpnDevices, deviceCounts] = await Promise.all([
      prisma.fraudReport.groupBy({
        by: ["userId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.device.findMany({
        where: { isVpnSuspected: true },
        orderBy: { lastSeenAt: "desc" },
        take: 20,
        include: { user: { select: { fullName: true, email: true } } },
      }),
      prisma.device.groupBy({
        by: ["userId"],
        _count: { userId: true },
        having: { userId: { _count: { gt: 2 } } },
        orderBy: { _count: { userId: "desc" } },
        take: 10,
      }),
    ]);

    const flaggedUserIds = flaggedGroups.map((g) => g.userId);
    const multiDeviceUserIds = deviceCounts.map((g) => g.userId);

    const [flaggedUsers, multiDeviceUsers] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: flaggedUserIds } }, select: { id: true, fullName: true, email: true, isBanned: true } }),
      prisma.user.findMany({ where: { id: { in: multiDeviceUserIds } }, select: { id: true, fullName: true, email: true } }),
    ]);
    const flaggedUserMap = new Map(flaggedUsers.map((u) => [u.id, u]));
    const multiDeviceUserMap = new Map(multiDeviceUsers.map((u) => [u.id, u]));
    const deviceCountMap = new Map(deviceCounts.map((d) => [d.userId, d._count.userId]));

    return NextResponse.json({
      flaggedUsers: flaggedGroups
        .filter((g) => flaggedUserMap.has(g.userId))
        .map((g) => ({ ...flaggedUserMap.get(g.userId), reportCount: g._count.id })),
      vpnDevices: vpnDevices.map((d) => ({
        id: d.id,
        userAgent: d.userAgent,
        ipAddress: d.ipAddress,
        lastSeenAt: d.lastSeenAt,
        user: d.user,
      })),
      multiDeviceUsers: multiDeviceUserIds
        .filter((id) => multiDeviceUserMap.has(id))
        .map((id) => ({ ...multiDeviceUserMap.get(id), deviceCount: deviceCountMap.get(id) ?? 0 })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
