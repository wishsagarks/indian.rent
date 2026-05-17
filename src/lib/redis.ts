import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const redisEnabled = process.env.REDIS_ENABLED !== 'false' && !!redisUrl && !!redisToken;

let redis: Redis | null = null;

if (redisEnabled) {
  redis = new Redis({ url: redisUrl, token: redisToken });
}

export { redis, redisEnabled };

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
