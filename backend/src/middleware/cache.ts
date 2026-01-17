import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import logger from '../config/logger';
import crypto from 'crypto';

interface CacheMiddlewareOptions {
  ttl: number;
  keyGenerator?: (req: Request) => string;
  tags?: string[];
}

/**
 * Generate cache key from request
 */
const defaultKeyGenerator = (req: Request): string => {
  const parts = [
    req.method,
    req.path,
    JSON.stringify(req.query),
  ];

  // Include user ID for authenticated requests
  if (req.user?.userId) {
    parts.push(`user:${req.user.userId}`);
  }

  const key = parts.join(':');
  const hash = crypto.createHash('md5').update(key).digest('hex');
  return `route:${req.path}:${hash}`;
};

/**
 * Cache middleware factory
 */
export const cacheMiddleware = (options: CacheMiddlewareOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const keyGenerator = options.keyGenerator || defaultKeyGenerator;
    const cacheKey = keyGenerator(req);
    const startTime = Date.now();

    try {
      // Check cache
      const cached = await cacheService.get<any>(cacheKey);

      if (cached) {
        const duration = Date.now() - startTime;
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        
        logger.http('Cache hit', {
          requestId: req.id,
          method: req.method,
          url: req.originalUrl,
          cacheKey,
          duration: `${duration}ms`,
        });

        return res.json(cached);
      }

      // Cache miss - intercept res.json to cache response
      const originalJson = res.json.bind(res);
      
      res.json = function(body: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, body, { ttl: options.ttl, tags: options.tags })
            .catch(error => {
              logger.error('Failed to cache response', { cacheKey, error });
            });
        }

        const duration = Date.now() - startTime;
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);

        logger.http('Cache miss', {
          requestId: req.id,
          method: req.method,
          url: req.originalUrl,
          cacheKey,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
        });

        return originalJson(body);
      };

      next();
    } catch (error) {
      // On cache error, bypass cache and continue
      logger.error('Cache middleware error', {
        requestId: req.id,
        url: req.originalUrl,
        error,
      });
      next();
    }
  };
};

/**
 * Specialized middleware for product list caching
 */
export const cacheProductList = (ttl: number) => {
  return cacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      const queryString = JSON.stringify(req.query);
      const hash = crypto.createHash('md5').update(queryString).digest('hex');
      return `products:list:${hash}`;
    },
    tags: ['products', 'product-list'],
  });
};

/**
 * Specialized middleware for product detail caching
 */
export const cacheProductDetail = (ttl: number) => {
  return cacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      return `product:${req.params.id}`;
    },
    tags: (req) => ['product', `product:${req.params.id}`],
  });
};

/**
 * Specialized middleware for category list caching
 */
export const cacheCategoryList = (ttl: number) => {
  return cacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      return 'categories:all';
    },
    tags: ['categories'],
  });
};
