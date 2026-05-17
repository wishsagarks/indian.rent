import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';

if (!redisUrl || !redisToken) {
  console.warn('Upstash Redis credentials missing. Caching will be disabled.');
}

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

/**
 * Utility to cache map data (e.g. superclusters)
 * @param key The cache key (usually coordinate-bound based)
 * @param fetcher The function to fetch data if cache misses
 * @param ttl Time to live in seconds (default 1 hour)
 */
export async function getCachedData<T>(key: string, fetcher: () => Promise<T>, ttl = 3600): Promise<T> {
  if (!redisUrl || !redisToken) return fetcher();

  try {
    const cached = await redis.get<T>(key);
    if (cached) {
      console.log(`Cache Hit: ${key}`);
      return cached;
    }
    
    const freshData = await fetcher();
    await redis.set(key, freshData, { ex: ttl });
    console.log(`Cache Miss - Stored: ${key}`);
    return freshData;
  } catch (error) {
    console.error('Redis Error:', error);
    return fetcher();
  }
}
