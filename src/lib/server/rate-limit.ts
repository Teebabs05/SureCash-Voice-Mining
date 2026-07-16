import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// In-memory fallback — used when Upstash isn't configured, and as a fail-open
// path if Redis errors at runtime (a rate-limiter outage shouldn't take down
// login/register/etc). Only correct within a single process, which is exactly
// why Redis is preferred once running more than one instance.
function inMemoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { success: true, remaining: limit - bucket.count };
}

// Periodic cleanup so the map doesn't grow unbounded on a long-running process.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

let redisClient: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  // Bound each request so a Redis outage fails fast into the in-memory
  // fallback below instead of hanging the request for the platform default.
  redisClient = url && token ? new Redis({ url, token, signal: () => AbortSignal.timeout(2000) }) : null;
  return redisClient;
}

// One Ratelimit instance per distinct (limit, window) pair — cheap to keep
// around, and each call site only ever uses one or two combinations.
const limiters = new Map<string, Ratelimit>();
function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  const cacheKey = `${limit}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.fixedWindow(limit, `${windowMs} ms`),
      prefix: "surecash-ratelimit",
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

/**
 * Redis-backed (Upstash) when UPSTASH_REDIS_REST_URL/TOKEN are configured —
 * required for correctness once running more than one server instance, since
 * the in-memory fallback only tracks counts within a single process. Falls
 * back to in-memory when unconfigured, and fails open to in-memory if Redis
 * itself errors at runtime (a rate-limiter outage shouldn't block logins).
 */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const limiter = getLimiter(limit, windowMs);
  if (!limiter) return inMemoryRateLimit(key, limit, windowMs);

  try {
    const result = await limiter.limit(key);
    return {
      success: result.success,
      remaining: result.remaining,
      retryAfterMs: result.success ? undefined : Math.max(0, result.reset - Date.now()),
    };
  } catch {
    return inMemoryRateLimit(key, limit, windowMs);
  }
}
