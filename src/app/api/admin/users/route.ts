import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { generateReferralCode, hashPassword } from "@/lib/server/auth";
import { ensureWalletsForUser } from "@/lib/server/wallet";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    const users = await prisma.user.findMany({
      // MySQL's default collation is already case-insensitive, unlike
      // Postgres, which needed the (Postgres-only) `mode: "insensitive"`
      // option this app used to run on.
      where: q ? { OR: [{ fullName: { contains: q } }, { email: { contains: q } }] } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isBanned: true,
        emailVerified: true,
        level: true,
        xp: true,
        tier: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(["USER", "ADMIN", "SUPERADMIN"]).default("USER"),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = createSchema.parse(await req.json());
    const { ipAddress, userAgent } = getRequestMeta(req);

    // Only a SUPERADMIN can hand out admin/superadmin access, same rule as
    // changing an existing user's role.
    if (body.role !== "USER" && admin.role !== "SUPERADMIN") {
      return jsonError("Only a SUPERADMIN can create an admin account", 403);
    }

    const passwordHash = await hashPassword(body.password);

    let referralCode = generateReferralCode();
    for (let attempts = 0; attempts < 5; attempts++) {
      const clash = await prisma.user.findUnique({ where: { referralCode } });
      if (!clash) break;
      referralCode = generateReferralCode();
    }

    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        // Admin-created accounts skip the email-verification flow entirely -
        // the admin is vouching for this account directly, so there's no
        // "prove you own this inbox" step to wait on.
        const created = await tx.user.create({
          data: {
            fullName: body.fullName,
            email: body.email,
            phone: body.phone || null,
            passwordHash,
            referralCode,
            role: body.role,
            emailVerified: true,
          },
        });
        await ensureWalletsForUser(created.id, tx);
        return created;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = (error.meta?.target as string[] | undefined)?.join(", ") ?? "field";
        return jsonError(`That ${target} is already in use by another account`, 409);
      }
      throw error;
    }

    await writeAuditLog({
      userId: admin.id,
      action: "admin.user_created",
      ipAddress,
      userAgent,
      metadata: { targetUserId: user.id, email: user.email, role: user.role },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
