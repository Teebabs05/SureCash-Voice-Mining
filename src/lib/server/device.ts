import "server-only";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

/**
 * Heuristic VPN/proxy signal. Real detection needs an IP-intelligence
 * provider (IPQualityScore, MaxMind GeoIP2 Anonymous IP DB, etc); this only
 * flags the structural signs available from request headers alone —
 * multiple hops in X-Forwarded-For or an explicit proxy header — as a stand
 * -in until a paid provider is wired in.
 */
export function estimateVpnSuspicion(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  const via = req.headers.get("via");
  const hops = xff ? xff.split(",").length : 0;
  return Boolean(via) || hops > 2;
}

export async function upsertDevice(params: {
  userId: string;
  fingerprint: string;
  userAgent?: string;
  ipAddress?: string;
  vpnSuspected: boolean;
}) {
  return prisma.device.upsert({
    where: { userId_fingerprint: { userId: params.userId, fingerprint: params.fingerprint } },
    update: {
      lastSeenAt: new Date(),
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
      isVpnSuspected: params.vpnSuspected,
    },
    create: {
      userId: params.userId,
      fingerprint: params.fingerprint,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
      isVpnSuspected: params.vpnSuspected,
    },
  });
}
