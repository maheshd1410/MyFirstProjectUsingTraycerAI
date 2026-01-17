# Advanced Search Implementation

This document describes the advanced search functionality implemented using PostgreSQL full-text search with trigram similarity, autocomplete, and search analytics.

## Features

### 1. Full-Text Search
- **Technology**: PostgreSQL `to_tsvector` and `to_tsquery` with GIN indexes
- **Language**: English dictionary for stemming and stop words
- **Trigger**: Activated for search queries longer than 2 characters
- **Fallback**: Uses ILIKE pattern matching for queries ≤ 2 characters

### 2. Fuzzy Matching
- **Technology**: PostgreSQL `pg_trgm` extension for trigram similarity
- **Threshold**: 0.3 similarity score minimum
- **Use Case**: Handles typos and approximate matches

### 3. Autocomplete Suggestions
- **Mix**: 70% product names, 30% category names
- **Sorting**: Relevance score (exact match > starts with > contains)
- **Caching**: 1800s (30 minutes) TTL
- **Limit**: Configurable, max 20 suggestions

### 4. Search Analytics
- **Popular Searches**: Tracked globally using Redis sorted sets
- **User History**: Per-user search history with 7-day TTL
- **Metrics**: Search term, result count, timestamp

## Database Schema

### Indexes Created

```sql
-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Composite indexes for filter optimization
CREATE INDEX "Product_categoryId_price_isActive_idx" 
  ON "Product"("categoryId", "price", "isActive");
CREATE INDEX "Product_categoryId_averageRating_isActive_idx" 
  ON "Product"("categoryId", "averageRating", "isActive");

-- GIN indexes for full-text search
CREATE INDEX "Product_name_gin_idx" 
  ON "Product" USING GIN (to_tsvector('english', name));
CREATE INDEX "Product_description_gin_idx" 
  ON "Product" USING GIN (to_tsvector('english', COALESCE(description, '')));

-- GIN indexes for trigram similarity
CREATE INDEX "Product_name_trgm_idx" 
  ON "Product" USING GIN (name gin_trgm_ops);
CREATE INDEX "Product_description_trgm_idx" 
  ON "Product" USING GIN (COALESCE(description, '') gin_trgm_ops);
```

## API Endpoints

### Search Products
```
GET /api/products?search={query}
```

**Query Parameters:**
- `search` (string): Search query (auto-detects full-text vs ILIKE)
- `categoryId` (string, optional): Filter by category
- `minPrice` (number, optional): Minimum price
- `maxPrice` (number, optional): Maximum price
- `minRating` (number, optional): Minimum rating
- `inStock` (boolean, optional): Only in-stock products
- `sortBy` (string, optional): Sort order
- `page` (number, default: 1): Page number
- `pageSize` (number, default: 10): Results per page

**Response:**
```json
{
  "products": [...],
  "total": 42,
  "page": 1,
  "pageSize": 10
}
```

### Autocomplete Suggestions
```
GET /api/products/search/suggestions?q={query}&limit={max}
```

**Query Parameters:**
- `q` (string, required): Search query (min 2 chars)
- `limit` (number, optional, default: 10, max: 20): Max suggestions

**Response:**
```json
{
  "suggestions": [
    {
      "text": "Chocolate Chip Cookies",
      "type": "product",
      "score": 0.95,
      "productId": "abc123"
    },
    {
      "text": "Cookies & Biscuits",
      "type": "category",
      "score": 0.85,
      "categoryId": "def456"
    }
  ]
}
```

## Caching Strategy

### Cache Namespaces
- `search:results:{hash}` - Search results (300s TTL)
- `search:popular` - Popular search terms (Redis sorted set)
- `search:user:{userId}` - User search history (7-day TTL)
- `products:list:{hash}` - Regular product listings (600s TTL)

### Cache Warming
The cache warmer service (`cache-warmer.service.ts`) pre-caches popular search results:
1. Fetches top 20 popular search terms from analytics
2. Executes searches to populate cache
3. Runs on application startup
4. Can be scheduled periodically (e.g., every 6 hours)

## Relevance Scoring

### Product Relevance Algorithm
```typescript
- Exact name match: 10 points
- Name starts with query: 8 points
- Name contains query: 6 points
- Description contains query: 3 points
- PostgreSQL ts_rank score: 2x multiplier
- Sort by: rank DESC, averageRating DESC, totalReviews DESC
```

## Performance Targets

### Query Performance
- **Full-text search**: < 50ms with GIN indexes
- **Autocomplete**: < 5ms (cached), < 50ms (uncached)
- **Cache hit rate**: > 90% for popular searches

### Monitoring
- Slow query logging for searches > 500ms
- Performance metrics tracked in logger
- Search analytics provide insights into popular terms

## Architecture

### Services

#### `search.service.ts`
- `buildFullTextSearchQuery()`: Sanitizes and converts search terms
- `searchProducts()`: Executes full-text search with filters
- `fuzzySearch()`: Trigram similarity search
- `generateSearchSuggestions()`: Autocomplete suggestions
- `calculateRelevanceScore()`: Weighted relevance scoring

#### `search-analytics.service.ts`
- `trackSearch()`: Records search queries and results
- `getPopularSearches()`: Returns most frequent searches
- `getRecentSearches()`: User-specific search history

#### `product.service.ts`
- `getAllProducts()`: Main entry point, delegates to search service
- `searchProducts()`: Private method for search-specific logic

### Cache Integration
- Search results use dedicated `search:results:*` namespace
- Shorter TTL (300s) vs regular listings (600s)
- Cache warming for popular searches

## Testing

### Unit Tests (`__tests__/services/search.service.test.ts`)
- Query sanitization and tsquery conversion
- Full-text search with filters
- Fuzzy matching with trigram similarity
- Autocomplete suggestion generation
- Relevance scoring algorithm

### Integration Tests (`__tests__/integration/search.test.ts`)
- End-to-end search API testing
- Autocomplete endpoint validation
- Cache behavior verification
- Performance benchmarks
- Search analytics tracking

## Migration

Run the migration to enable full-text search:

```bash
npx prisma migrate dev --name add_fulltext_search_indexes
```

This migration:
1. Enables `pg_trgm` extension
2. Creates composite indexes for filters
3. Creates GIN indexes for full-text search
4. Creates GIN indexes for trigram similarity

## Usage Examples

### Basic Search
```typescript
// Search for products
const results = await productService.getAllProducts({
  search: 'chocolate cookies',
  page: 1,
  pageSize: 20
});
```

### Search with Filters
```typescript
// Search with category and price filters
const results = await productService.getAllProducts({
  search: 'organic tea',
  categoryId: 'beverages-123',
  minPrice: 10,
  maxPrice: 50,
  minRating: 4.0,
  inStock: true
});
```

### Autocomplete
```typescript
// Get search suggestions
const suggestions = await searchService.generateSearchSuggestions('choc', 10);
```

### Analytics
```typescript
// Track search
await searchAnalyticsService.trackSearch('chocolate cake', 42, 'user-123');

// Get popular searches
const popular = await searchAnalyticsService.getPopularSearches(20);

// Get user history
const history = await searchAnalyticsService.getRecentSearches('user-123', 10);
```

## Configuration

### Environment Variables
```env
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

### Redis Configuration
- Host: localhost (default)
- Port: 6379 (default)
- Used for: Search analytics and caching

## Troubleshooting

### Slow Queries
- Check GIN indexes are created: `\di` in psql
- Verify `pg_trgm` extension: `SELECT * FROM pg_extension WHERE extname = 'pg_trgm';`
- Monitor slow query logs (> 500ms)

### Poor Search Results
- Check query sanitization in logs
- Verify tsquery format is correct
- Test trigram similarity threshold (0.3)

### Cache Issues
- Verify Redis connection
- Check cache key generation (filterHash)
- Monitor cache hit rates in logs

## Future Enhancements

1. **Search Result Highlighting**: Highlight matched terms in results
2. **Semantic Search**: Add vector embeddings for semantic similarity
3. **Personalization**: Weight results by user preferences and history
4. **Multi-language**: Support multiple languages for stemming
5. **Faceted Search**: Add facets for categories, brands, etc.
6. **Query Suggestions**: "Did you mean..." for misspellings
7. **Search History**: Auto-suggest from user's previous searches
