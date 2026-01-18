import { cacheService } from '../../src/services/cache.service';
import { getRedisClient } from '../../src/config/redis';
import { cacheMetricsService } from '../../src/services/cache-metrics.service';

/**
 * Clear all test cache data
 */
export async function clearTestCache(): Promise<void> {
  await cacheService.flush();
  cacheMetricsService.resetMetrics();
}

/**
 * Mock cache service for testing
 */
export const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  delPattern: jest.fn(),
  invalidateByTags: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
  flush: jest.fn(),
};

/**
 * Wait for cache operation to complete
 */
export async function waitForCache(ms: number = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get all cache keys matching a pattern
 */
export async function getCacheKeys(pattern: string = '*'): Promise<string[]> {
  const client = getRedisClient();
  if (!client) {
    return [];
  }

  const keys: string[] = [];
  const stream = client.scanStream({
    match: `ladoo:${pattern}`,
    count: 100,
  });

  return new Promise((resolve, reject) => {
    stream.on('data', (resultKeys: string[]) => {
      keys.push(...resultKeys);
    });

    stream.on('end', () => {
      // Remove prefix from keys
      const cleanKeys = keys.map((key) => key.replace('ladoo:', ''));
      resolve(cleanKeys);
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Check if a specific key exists in cache
 */
export async function cacheKeyExists(key: string): Promise<boolean> {
  return await cacheService.exists(key);
}

/**
 * Get the TTL (time to live) of a cache key
 */
export async function getCacheTTL(key: string): Promise<number> {
  return await cacheService.ttl(key);
}

/**
 * Set a test cache value
 */
export async function setTestCache(
  key: string,
  value: any,
  options?: { ttl?: number; tags?: string[] }
): Promise<void> {
  await cacheService.set(key, value, options);
}

/**
 * Get a test cache value
 */
export async function getTestCache<T>(key: string): Promise<T | null> {
  return await cacheService.get<T>(key);
}
