# Caching System Documentation

## Overview

The backend implements a comprehensive Redis-based caching system to improve API performance and reduce database load. The system uses **ioredis** client with support for tag-based invalidation, TTL-based expiration, and performance metrics tracking.

## Architecture

### Components

1. **Redis Configuration** (`src/config/redis.ts`)
   - Connection management with lazy connection
   - Exponential backoff retry strategy
   - Event handlers for connection lifecycle
   - Graceful shutdown support

2. **Cache Service** (`src/services/cache.service.ts`)
   - Unified cache operations (get, set, delete, flush)
   - Tag-based cache invalidation
   - Pattern-based deletion using SCAN
   - JSON serialization/deserialization

3. **Cache Middleware** (`src/middleware/cache.ts`)
   - Route-level HTTP caching
   - Automatic key generation
   - Response interception
   - Cache headers (X-Cache, X-Cache-Key)

4. **Cache Metrics** (`src/services/cache-metrics.service.ts`)
   - Hit/miss tracking
   - Response time monitoring
   - Performance statistics

5. **Cache Warmer** (`src/services/cache-warmer.service.ts`)
   - Pre-loads frequently accessed data
   - Runs on application startup
   - Graceful error handling

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=ladoo:
REDIS_ENABLED=true

# Cache TTL Configuration (in seconds)
CACHE_PRODUCT_DETAIL_TTL=3600       # 1 hour
CACHE_PRODUCT_LIST_TTL=600          # 10 minutes
CACHE_FEATURED_PRODUCTS_TTL=1800    # 30 minutes
CACHE_CATEGORY_TTL=3600             # 1 hour
```

### Docker Setup

Redis service is configured in `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: ladoo-redis
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 3s
    retries: 3
```

## Cache Strategy

### Cache Keys

All cache keys are prefixed with `ladoo:` and follow these patterns:

- **Product Detail**: `product:{id}`
- **Product List**: `products:list:{filters_hash}`
- **Featured Products**: `products:featured`
- **Category Products**: `products:category:{categoryId}`
- **Category Detail**: `category:{id}`
- **Categories List**: `categories:all`

### TTL Configuration

| Cache Type | TTL | Reason |
|------------|-----|--------|
| Product Detail | 3600s (1h) | Product data changes infrequently |
| Product List | 600s (10m) | List results change more frequently |
| Featured Products | 1800s (30m) | Featured status updates periodically |
| Category Products | 900s (15m) | Category listings change moderately |
| Category Detail | 3600s (1h) | Category data rarely changes |
| Categories List | 3600s (1h) | Full category list is stable |

### Tag-Based Invalidation

Tags allow for granular cache invalidation:

```typescript
// Product tags
['product', `product:${id}`, 'products', 'product-list', 'featured']

// Category tags
['category', `category:${id}`, 'categories']
```

#### Invalidation Scenarios

1. **Create Product**: Invalidates `['products', 'product-list', 'featured']`
2. **Update Product**: Invalidates `['product', 'product:{id}', 'products', 'product-list', 'featured']`
3. **Delete Product**: Invalidates `['product', 'product:{id}', 'products', 'product-list']`
4. **Update Stock**: Invalidates `['product', 'product:{id}']`
5. **Update Rating**: Invalidates `['product', 'product:{id}', 'products']`

6. **Create Category**: Invalidates `['categories']`
7. **Update Category**: Invalidates `['category', 'category:{id}', 'categories']`
8. **Delete Category**: Invalidates `['category', 'category:{id}', 'categories']`

## Usage

### Service-Level Caching

#### Reading from Cache

```typescript
import { cacheService } from './services/cache.service';

async getProductById(id: string) {
  const cacheKey = `product:${id}`;
  
  // Try cache first
  const cached = await cacheService.get<ProductResponse>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch from database
  const product = await prisma.product.findFirst({ where: { id } });
  
  // Store in cache
  await cacheService.set(cacheKey, product, {
    ttl: 3600,
    tags: ['product', `product:${id}`],
  });
  
  return product;
}
```

#### Invalidating Cache

```typescript
async updateProduct(id: string, data: UpdateProductDTO) {
  const updated = await prisma.product.update({
    where: { id },
    data,
  });
  
  // Invalidate relevant caches
  await cacheService.invalidateByTags([
    'product',
    `product:${id}`,
    'products',
    'product-list',
    'featured',
  ]);
  
  return updated;
}
```

### Route-Level Caching

```typescript
import { cacheMiddleware, cacheProductList, cacheProductDetail } from '../middleware/cache';

// Apply specialized middleware
router.get('/', cacheProductList(600), getAllProducts);
router.get('/:id', cacheProductDetail(3600), getProductById);

// Or use generic middleware
router.get('/featured', cacheMiddleware({ ttl: 1800 }), getFeaturedProducts);
```

### Cache Warming

Cache warming happens automatically on server startup:

```typescript
// src/index.ts
await cacheWarmerService.warmAll();
```

Warmed caches:
- Featured products
- All categories
- Top 20 popular products (by rating)

## Admin Endpoints

### Get Cache Metrics

```http
GET /api/admin/cache/metrics
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalHits": 150,
    "totalMisses": 25,
    "hitRate": 85.71,
    "avgHitResponseTime": 2.5,
    "avgMissResponseTime": 45.3
  }
}
```

### Clear All Cache

```http
POST /api/admin/cache/clear
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

### Clear Cache by Pattern

```http
DELETE /api/admin/cache/:pattern
Authorization: Bearer <admin_token>
```

**Examples:**
```http
DELETE /api/admin/cache/product:*     # Clear all product caches
DELETE /api/admin/cache/products:*    # Clear all product list caches
DELETE /api/admin/cache/category:123  # Clear specific category
```

## Health Check

The `/health` endpoint includes Redis status:

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Ladoo Business API is running",
  "services": {
    "database": "connected",
    "redis": "connected"
  },
  "timestamp": "2026-01-17T10:30:00.000Z"
}
```

## Performance Monitoring

### Cache Headers

Cached responses include headers:
- `X-Cache: HIT` or `X-Cache: MISS`
- `X-Cache-Key: {key}` - The cache key used

### Metrics Service

Track cache performance:

```typescript
import { cacheMetricsService } from './services/cache-metrics.service';

// Get current metrics
const metrics = cacheMetricsService.getMetrics();

// Reset metrics
cacheMetricsService.resetMetrics();
```

## Testing

### Test Helpers

```typescript
import {
  clearTestCache,
  waitForCache,
  getCacheKeys,
  cacheKeyExists,
} from '../helpers/cache.helper';

beforeEach(async () => {
  await clearTestCache();
});

test('should cache product', async () => {
  const product = await productService.getProductById('123');
  
  // Wait for cache operation
  await waitForCache();
  
  // Verify cache exists
  const exists = await cacheKeyExists('product:123');
  expect(exists).toBe(true);
});
```

### Mock Cache Service

```typescript
import { mockCacheService } from '../helpers/cache.helper';

jest.mock('./services/cache.service', () => ({
  cacheService: mockCacheService,
}));
```

## Best Practices

### 1. Cache Early, Invalidate Precisely

- Cache at the service layer for business logic
- Invalidate with specific tags to avoid over-invalidation

### 2. Set Appropriate TTLs

- Longer TTLs for stable data (categories, product details)
- Shorter TTLs for frequently changing data (product lists, stock)

### 3. Handle Cache Failures Gracefully

The system automatically falls back to database if Redis is unavailable:

```typescript
const cached = await cacheService.get(key);
if (cached) return cached;
// Always fetch from database as fallback
```

### 4. Monitor Cache Performance

- Check hit rates regularly via `/api/admin/cache/metrics`
- Aim for >70% hit rate on frequently accessed endpoints
- Adjust TTLs based on metrics

### 5. Clear Cache Strategically

- Use tag-based invalidation for related data
- Avoid clearing entire cache unless necessary
- Clear specific patterns for targeted invalidation

## Troubleshooting

### Redis Connection Issues

1. Check Redis is running:
   ```bash
   docker-compose ps redis
   ```

2. Test Redis connection:
   ```bash
   docker-compose exec redis redis-cli ping
   ```

3. Check logs:
   ```bash
   docker-compose logs redis
   ```

### Cache Not Working

1. Verify Redis connection in health check: `GET /health`
2. Check environment variable `REDIS_ENABLED=true`
3. Review application logs for Redis errors
4. Verify cache middleware is applied to routes

### Low Hit Rate

1. Check if TTLs are too short
2. Verify cache warming is running on startup
3. Review invalidation logic for over-invalidation
4. Check for high write traffic causing frequent invalidations

### Memory Issues

1. Monitor Redis memory usage:
   ```bash
   docker-compose exec redis redis-cli INFO memory
   ```

2. Check number of keys:
   ```bash
   docker-compose exec redis redis-cli DBSIZE
   ```

3. Reduce TTLs if memory is constrained
4. Consider Redis eviction policies (e.g., `allkeys-lru`)

## Migration Guide

### Enabling Caching for New Endpoints

1. **Add service-level caching:**
   ```typescript
   async getNewData(id: string) {
     const cached = await cacheService.get(`newdata:${id}`);
     if (cached) return cached;
     
     const data = await fetchData(id);
     
     await cacheService.set(`newdata:${id}`, data, {
       ttl: 3600,
       tags: ['newdata', `newdata:${id}`],
     });
     
     return data;
   }
   ```

2. **Add invalidation on writes:**
   ```typescript
   async updateNewData(id: string, data: any) {
     const updated = await updateData(id, data);
     await cacheService.invalidateByTags(['newdata', `newdata:${id}`]);
     return updated;
   }
   ```

3. **Apply route middleware:**
   ```typescript
   router.get('/:id', cacheMiddleware({ ttl: 3600 }), getNewData);
   ```

## References

- [ioredis Documentation](https://github.com/redis/ioredis)
- [Redis Commands](https://redis.io/commands)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
