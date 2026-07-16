import "server-only";
import { prisma } from "@/lib/prisma";

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

/**
 * Reads an admin-configurable value from the Setting table, falling back to
 * `fallback` when unset. Short-lived in-memory cache since these are read
 * on every withdrawal/mining request but change rarely.
 */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;

  const row = await prisma.setting.findUnique({ where: { key } });
  const value = row ? (row.value as T) : fallback;
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function setSetting(key: string, value: unknown) {
  await prisma.setting.upsert({
    where: { key },
    update: { value: value as never },
    create: { key, value: value as never },
  });
  cache.delete(key);
}
