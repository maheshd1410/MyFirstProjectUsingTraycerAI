import { getRedisClient } from '../config/redis';
import logger, { logPerformance } from '../config/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for invalidation
}

class CacheService {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (!redis) {
      return null;
    }

    const startTime = Date.now();

    try {
      const value = await redis.get(this.buildKey(key));
      const duration = Date.now() - startTime;

      if (value) {
        this.logCacheOperation('HIT', key, { duration: `${duration}ms` });
        return JSON.parse(value) as T;
      } else {
        this.logCacheOperation('MISS', key, { duration: `${duration}ms` });
        return null;
      }
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
      return;
    }

    const startTime = Date.now();

    try {
      const fullKey = this.buildKey(key);
      const serialized = JSON.stringify(value);

      if (options.ttl) {
        await redis.setex(fullKey, options.ttl, serialized);
      } else {
        await redis.set(fullKey, serialized);
      }

      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        const tagPromises = options.tags.map(tag =>
          redis.sadd(this.buildKey(`tag:${tag}`), fullKey)
        );
        await Promise.all(tagPromises);

        // Set TTL on tag sets if TTL is specified
        if (options.ttl) {
          const ttlPromises = options.tags.map(tag =>
            redis.expire(this.buildKey(`tag:${tag}`), options.ttl + 60)
          );
          await Promise.all(ttlPromises);
        }
      }

      const duration = Date.now() - startTime;
      this.logCacheOperation('SET', key, {
        duration: `${duration}ms`,
        ttl: options.ttl,
        tags: options.tags,
      });
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  }

  /**
   * Delete single key
   */
  async del(key: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
      return;
    }

    try {
      await redis.del(this.buildKey(key));
      this.logCacheOperation('DEL', key);
    } catch (error) {
      logger.error('Cache delete error', { key, error });
    }
  }

  /**
   * Delete keys matching pattern using SCAN
   */
  async delPattern(pattern: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
      return;
    }

    try {
      const fullPattern = this.buildKey(pattern);
      const stream = redis.scanStream({
        match: fullPattern,
        count: 100,
      });

      const keys: string[] = [];
      
      stream.on('data', (resultKeys: string[]) => {
        keys.push(...resultKeys);
      });

      await new Promise<void>((resolve, reject) => {
        stream.on('end', () => resolve());
        stream.on('error', (err) => reject(err));
      });

      if (keys.length > 0) {
        await redis.del(...keys);
        this.logCacheOperation('DEL_PATTERN', pattern, { keysDeleted: keys.length });
      }
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error });
    }
  }

  /**
   * Invalidate all keys with specific tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
      return;
    }

    try {
      const startTime = Date.now();
      
      for (const tag of tags) {
        const tagKey = this.buildKey(`tag:${tag}`);
        const keys = await redis.smembers(tagKey);
        
        if (keys.length > 0) {
          await redis.del(...keys);
          await redis.del(tagKey);
        }
      }

      const duration = Date.now() - startTime;
      this.logCacheOperation('INVALIDATE_TAGS', tags.join(','), { duration: `${duration}ms` });
    } catch (error) {
      logger.error('Cache invalidate by tags error', { tags, error });
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) {
      return false;
    }

    try {
      const result = await redis.exists(this.buildKey(key));
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error });
      return false;
    }
  }

  /**
   * Get remaining TTL for key
   */
  async ttl(key: string): Promise<number> {
    const redis = getRedisClient();
    if (!redis) {
      return -1;
    }

    try {
      return await redis.ttl(this.buildKey(key));
    } catch (error) {
      logger.error('Cache TTL error', { key, error });
      return -1;
    }
  }

  /**
   * Clear all cache (use cautiously)
   */
  async flush(): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
      return;
    }

    try {
      await redis.flushdb();
      logger.warn('Cache flushed - all keys deleted');
    } catch (error) {
      logger.error('Cache flush error', { error });
    }
  }

  /**
   * Build full cache key with prefix
   */
  private buildKey(key: string): string {
    // Prefix is already added by Redis client config
    return key;
  }

  /**
   * Log cache operation
   */
  private logCacheOperation(operation: string, key: string, metadata?: any): void {
    logger.debug(`Cache ${operation}`, {
      operation,
      key,
      ...metadata,
    });
  }
}

// Export singleton instance
export const cacheService = new CacheService();
