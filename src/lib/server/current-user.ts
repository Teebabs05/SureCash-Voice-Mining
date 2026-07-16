import "server-only";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/server/auth";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.isBanned) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Not authenticated");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

// Payment gateway credentials are the most sensitive data in the app, so
// they're gated tighter than the rest of the admin panel: SUPERADMIN only.
export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== "SUPERADMIN") {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
