import "server-only";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/server/crypto";

interface CacheEntry {
  value: string | null;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

/**
 * Resolves a gateway credential, preferring the admin-entered value in
 * IntegrationCredential (Admin > Settings > Payment Gateways) over the
 * matching .env var — so a deployment can start from .env and later be
 * reconfigured live from the dashboard without a redeploy.
 */
export async function getCredential(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const row = await prisma.integrationCredential.findUnique({ where: { key } });
  const value = row ? decrypt(row.encryptedValue) : process.env[key] || null;
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function setCredential(key: string, value: string, updatedById: string) {
  await prisma.integrationCredential.upsert({
    where: { key },
    update: { encryptedValue: encrypt(value), updatedById },
    create: { key, encryptedValue: encrypt(value), updatedById },
  });
  cache.delete(key);
}

export async function clearCredential(key: string) {
  await prisma.integrationCredential.deleteMany({ where: { key } });
  cache.delete(key);
}
