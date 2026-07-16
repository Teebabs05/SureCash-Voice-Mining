import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { setCredential, clearCredential } from "@/lib/server/credentials";
import { decrypt } from "@/lib/server/crypto";
import { INTEGRATION_KEYS } from "@/lib/integration-fields";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

function mask(value: string): string {
  if (value.length <= 4) return "••••";
  return `••••${value.slice(-4)}`;
}

export async function GET() {
  try {
    await requireSuperAdmin();

    const rows = await prisma.integrationCredential.findMany({ where: { key: { in: INTEGRATION_KEYS } } });
    const dbValues = new Map(rows.map((r) => [r.key, r]));

    const credentials = INTEGRATION_KEYS.map((key) => {
      const row = dbValues.get(key);
      if (row) {
        return { key, configured: true, source: "database" as const, preview: mask(decrypt(row.encryptedValue)), updatedAt: row.updatedAt };
      }
      const envValue = process.env[key];
      if (envValue) {
        return { key, configured: true, source: "env" as const, preview: mask(envValue), updatedAt: null };
      }
      return { key, configured: false, source: "unset" as const, preview: null, updatedAt: null };
    });

    return NextResponse.json({ credentials });
  } catch (error) {
    return handleApiError(error);
  }
}

const putSchema = z.object({ key: z.enum(INTEGRATION_KEYS as [string, ...string[]]), value: z.string().min(1) });

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const { key, value } = putSchema.parse(await req.json());
    const { ipAddress, userAgent } = getRequestMeta(req);

    await setCredential(key, value, admin.id);
    // Never log the secret itself — just who touched which key and when,
    // so a compromised/rogue SUPERADMIN account leaves a trace.
    await writeAuditLog({ userId: admin.id, action: "integration.credential_set", ipAddress, userAgent, metadata: { key } });

    return NextResponse.json({ key, configured: true });
  } catch (error) {
    return handleApiError(error);
  }
}

const deleteSchema = z.object({ key: z.enum(INTEGRATION_KEYS as [string, ...string[]]) });

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const { key } = deleteSchema.parse(await req.json());
    const { ipAddress, userAgent } = getRequestMeta(req);

    await clearCredential(key);
    await writeAuditLog({ userId: admin.id, action: "integration.credential_cleared", ipAddress, userAgent, metadata: { key } });

    return NextResponse.json({ key, cleared: true });
  } catch (error) {
    return handleApiError(error);
  }
}
