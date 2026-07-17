import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

const schema = z.object({
  isBanned: z.boolean().optional(),
  banReason: z.string().optional(),
  tier: z.enum(["FREE", "SILVER", "GOLD", "VIP"]).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isBanned: true,
        banReason: true,
        emailVerified: true,
        phoneVerified: true,
        level: true,
        xp: true,
        streakCount: true,
        tier: true,
        createdAt: true,
        plan: { select: { name: true } },
        referredBy: { select: { fullName: true, email: true } },
        wallets: { select: { type: true, balance: true } },
        _count: { select: { referrals: true, voiceRecordings: true, taskCompletions: true } },
      },
    });
    if (!user) return jsonError("User not found", 404);

    const [transactions, deposits, withdrawals] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, type: true, reason: true, amount: true, balanceAfter: true, description: true, createdAt: true },
      }),
      prisma.deposit.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, amount: true, method: true, status: true, createdAt: true },
      }),
      prisma.withdrawal.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, amount: true, method: true, status: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({ user, transactions, deposits, withdrawals });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());
    const { ipAddress, userAgent } = getRequestMeta(req);

    const user = await prisma.user.update({ where: { id }, data: body });

    if (body.isBanned !== undefined) {
      await notifyUser({
        userId: user.id,
        title: body.isBanned ? "Account suspended" : "Account reinstated",
        body: body.isBanned ? body.banReason ?? "Your account has been suspended." : "Your account is active again.",
        type: "ADMIN",
      });
      await writeAuditLog({
        userId: admin.id,
        action: body.isBanned ? "admin.user_banned" : "admin.user_unbanned",
        ipAddress,
        userAgent,
        metadata: { targetUserId: id },
      });
    }

    if (body.tier) {
      await notifyUser({
        userId: user.id,
        title: "Membership tier updated",
        body: `You are now on the ${body.tier} tier.`,
        type: "ADMIN",
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
