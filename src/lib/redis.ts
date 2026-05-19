import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';
import { createHash } from 'crypto';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const redisEnabled = process.env.REDIS_ENABLED !== 'false' && !!redisUrl && !!redisToken;

let redis: Redis | null = null;

if (redisEnabled) {
  redis = new Redis({ url: redisUrl, token: redisToken });
}

export { redis, redisEnabled };

/**
 * Get server-derived IP hash from request headers.
 * Derives hash from x-forwarded-for or x-real-ip headers.
 * This replaces client-side localStorage identity tokens.
 */
export async function getServerIpHash(): Promise<string> {
  const headerStore = await headers();
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0].trim()
           ?? headerStore.get('x-real-ip')
           ?? 'unknown';
  return 'srv_' + createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

/**
 * Rate limiter using Redis INCR with TTL window.
 * Returns { allowed: true } if within limit, { allowed: false } if exceeded.
 * When Redis is disabled, always allows the action.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redisEnabled || !redis) {
    return { allowed: true, remaining: maxAttempts };
  }

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    const allowed = current <= maxAttempts;
    return { allowed, remaining: Math.max(0, maxAttempts - current) };
  } catch {
    return { allowed: true, remaining: maxAttempts };
  }
}

/**
 * Strict rate limiter - fails closed on Redis unavailability.
 * Used for security-critical operations (deployNode, dropSeekerPin, etc).
 */
export async function checkRateLimitStrict(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redisEnabled || !redis) {
    return { allowed: false, remaining: 0 };
  }

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    const allowed = current <= maxAttempts;
    return { allowed, remaining: Math.max(0, maxAttempts - current) };
  } catch {
    return { allowed: false, remaining: 0 };
  }
}
