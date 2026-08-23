import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { notifyUser } from "@/lib/server/notifications";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

const schema = z.object({
  isBanned: z.boolean().optional(),
  banReason: z.string().optional(),
  tier: z.enum(["FREE", "SILVER", "GOLD", "VIP"]).optional(),
  withdrawalsLocked: z.boolean().optional(),
  withdrawalLockNote: z.string().optional(),
  emailVerified: z.boolean().optional(),
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["USER", "ADMIN", "SUPERADMIN"]).optional(),
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
        withdrawalsLocked: true,
        withdrawalLockNote: true,
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

    // Changing someone's role is the one action that can hand out admin
    // access, so it's gated tighter than the rest of this endpoint - a
    // regular ADMIN can do everything else here but can't promote/demote.
    if (body.role) {
      await requireSuperAdmin();
    }

    let user;
    try {
      user = await prisma.user.update({ where: { id }, data: body });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = (error.meta?.target as string[] | undefined)?.join(", ") ?? "field";
        return jsonError(`That ${target} is already in use by another account`, 409);
      }
      throw error;
    }

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

    if (body.withdrawalsLocked !== undefined) {
      await notifyUser({
        userId: user.id,
        title: body.withdrawalsLocked ? "Withdrawals locked" : "Withdrawals unlocked",
        body: body.withdrawalsLocked
          ? body.withdrawalLockNote || "Withdrawals have been temporarily locked on your account."
          : "Withdrawals are unlocked on your account again.",
        type: "ADMIN",
      });
      await writeAuditLog({
        userId: admin.id,
        action: body.withdrawalsLocked ? "admin.withdrawals_locked" : "admin.withdrawals_unlocked",
        ipAddress,
        userAgent,
        metadata: { targetUserId: id },
      });
    }

    if (body.emailVerified === true) {
      await notifyUser({
        userId: user.id,
        title: "Account verified",
        body: "An admin has manually verified your email address.",
        type: "ADMIN",
      });
    }

    if (body.role) {
      await writeAuditLog({
        userId: admin.id,
        action: "admin.role_changed",
        ipAddress,
        userAgent,
        metadata: { targetUserId: id, newRole: body.role },
      });
      await notifyUser({
        userId: user.id,
        title: "Account role changed",
        body: `Your account role is now ${body.role}.`,
        type: "ADMIN",
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireSuperAdmin();
    const { id } = await params;
    const { ipAddress, userAgent } = getRequestMeta(req);

    if (id === admin.id) return jsonError("You can't delete your own account", 400);

    const existing = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (!existing) return jsonError("User not found", 404);

    await prisma.user.delete({ where: { id } });
    await writeAuditLog({
      userId: admin.id,
      action: "admin.user_deleted",
      ipAddress,
      userAgent,
      metadata: { targetUserId: id, targetEmail: existing.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
