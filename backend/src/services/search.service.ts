import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import logger from '../config/logger';

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category';
  score: number;
  productId?: string;
  categoryId?: string;
}

class SearchService {
  /**
   * Build full-text search query for PostgreSQL
   */
  private buildFullTextSearchQuery(searchTerm: string): string {
    // Sanitize and prepare search term
    const sanitized = searchTerm
      .trim()
      .replace(/[^\w\s]/g, ' ') // Replace special chars with space
      .split(/\s+/)
      .filter(word => word.length > 0)
      .join(' '); // Use space for plainto_tsquery
    
    return sanitized || searchTerm;
  }

  /**
   * Calculate relevance score for a product
   */
  calculateRelevanceScore(product: any, searchTerm: string): number {
    const term = searchTerm.toLowerCase();
    const name = product.name?.toLowerCase() || '';
    const description = product.description?.toLowerCase() || '';
    
    let score = 0;
    
    // Exact name match: weight 10
    if (name === term) {
      score += 10;
    }
    
    // Name starts with search term: weight 8
    if (name.startsWith(term)) {
      score += 8;
    }
    
    // Name contains search term: weight 6
    if (name.includes(term)) {
      score += 6;
    }
    
    // Description contains search term: weight 3
    if (description.includes(term)) {
      score += 3;
    }
    
    // Add PostgreSQL rank if available
    if (product.rank) {
      score += product.rank * 2;
    }
    
    return score;
  }

  /**
   * Main search method using PostgreSQL full-text search
   */
  async searchProducts(
    searchTerm: string,
    filters: {
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      inStock?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const startTime = Date.now();
    const query = this.buildFullTextSearchQuery(searchTerm);
    
    try {
      // Build WHERE conditions
      const conditions: string[] = [
        '"isActive" = true',
      ];
      
      const params: any[] = [query];
      let paramIndex = 2;
      
      if (filters.categoryId) {
        conditions.push(`"categoryId" = $${paramIndex}`);
        params.push(filters.categoryId);
        paramIndex++;
      }
      
      if (filters.minPrice !== undefined) {
        conditions.push(`price >= $${paramIndex}`);
        params.push(filters.minPrice);
        paramIndex++;
      }
      
      if (filters.maxPrice !== undefined) {
        conditions.push(`price <= $${paramIndex}`);
        params.push(filters.maxPrice);
        paramIndex++;
      }
      
      if (filters.minRating !== undefined) {
        conditions.push(`"averageRating" >= $${paramIndex}`);
        params.push(filters.minRating);
        paramIndex++;
      }
      
      if (filters.inStock) {
        conditions.push(`"stockQuantity" > 0`);
      }
      
      const whereClause = conditions.join(' AND ');
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
      
      // Return empty if query becomes empty after sanitization
      if (!query || query.trim().length === 0) {
        logger.warn('Search query empty after sanitization', { searchTerm });
        return { results: [], total: 0 };
      }

      // Full-text search query with ranking, category join, and total count
      const sqlQuery = `
        SELECT 
          p.id,
          p."categoryId",
          p.name,
          p.description,
          p.price,
          p."discountPrice",
          p.images,
          p.weight,
          p.unit,
          p."stockQuantity",
          p."lowStockThreshold",
          p."isActive",
          p."isFeatured",
          p."averageRating",
          p."totalReviews",
          p."createdAt",
          p."updatedAt",
          c.id as "category_id",
          c.name as "category_name",
          c.description as "category_description",
          c."imageUrl" as "category_imageUrl",
          c."isActive" as "category_isActive",
          c."createdAt" as "category_createdAt",
          c."updatedAt" as "category_updatedAt",
          ts_rank(
            to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')),
            plainto_tsquery('english', $1)
          ) as rank,
          COUNT(*) OVER() as total_count
        FROM "Product" p
        LEFT JOIN "Category" c ON p."categoryId" = c.id
        WHERE ${whereClause}
          AND (
            to_tsvector('english', p.name) @@ plainto_tsquery('english', $1)
            OR to_tsvector('english', COALESCE(p.description, '')) @@ plainto_tsquery('english', $1)
            OR p.name ILIKE $${paramIndex}
          )
        ORDER BY rank DESC, p."averageRating" DESC, p."totalReviews" DESC
        LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
      `;
      
      params.push(`%${searchTerm}%`);
      params.push(limit);
      params.push(offset);
      
      let results = await prisma.$queryRawUnsafe<any[]>(
        sqlQuery,
        ...params
      );

      // Comment 3: Fallback to fuzzy matching if no full-text results
      const total = results.length > 0 ? Number(results[0].total_count) : 0;
      
      if (results.length === 0) {
        logger.info('No full-text results, trying fuzzy search', { searchTerm });
        const fuzzyResults = await this.fuzzySearch(searchTerm, filters);
        return { results: fuzzyResults.results, total: fuzzyResults.total };
      }

      // Map category data to expected shape
      results = results.map(row => ({
        ...row,
        category: {
          id: row.category_id,
          name: row.category_name,
          description: row.category_description,
          imageUrl: row.category_imageUrl,
          isActive: row.category_isActive,
          createdAt: row.category_createdAt,
          updatedAt: row.category_updatedAt,
        },
        // Remove flattened category fields
        category_id: undefined,
        category_name: undefined,
        category_description: undefined,
        category_imageUrl: undefined,
        category_isActive: undefined,
        category_createdAt: undefined,
        category_updatedAt: undefined,
        total_count: undefined,
      }));
      
      const searchTime = Date.now() - startTime;
      
      logger.info('Search executed', {
        searchTerm,
        resultCount: results.length,
        total,
        searchTime,
        filters,
      });
      
      if (searchTime > 500) {
        logger.warn('Slow search query detected', {
          searchTerm,
          searchTime,
          filters,
        });
      }
      
      return { results, total };
    } catch (error) {
      logger.error('Search query failed', {
        searchTerm,
        filters,
        error,
      });
      throw error;
    }
  }

  /**
   * Fuzzy search using trigram similarity
   */
  async fuzzySearch(
    searchTerm: string,
    filters: {
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      inStock?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ results: any[]; total: number }> {
    const startTime = Date.now();
    
    try {
      // Build WHERE conditions
      const conditions: string[] = [
        'p."isActive" = true',
      ];
      
      const params: any[] = [];
      let paramIndex = 1;
      
      if (filters.categoryId) {
        conditions.push(`p."categoryId" = $${paramIndex}`);
        params.push(filters.categoryId);
        paramIndex++;
      }
      
      if (filters.minPrice !== undefined) {
        conditions.push(`p.price >= $${paramIndex}`);
        params.push(filters.minPrice);
        paramIndex++;
      }
      
      if (filters.maxPrice !== undefined) {
        conditions.push(`p.price <= $${paramIndex}`);
        params.push(filters.maxPrice);
        paramIndex++;
      }
      
      if (filters.minRating !== undefined) {
        conditions.push(`p."averageRating" >= $${paramIndex}`);
        params.push(filters.minRating);
        paramIndex++;
      }
      
      if (filters.inStock) {
        conditions.push(`p."stockQuantity" > 0`);
      }
      
      const whereClause = conditions.join(' AND ');
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
    
      const sqlQuery = `
        SELECT 
          p.id,
          p."categoryId",
          p.name,
          p.description,
          p.price,
          p."discountPrice",
          p.images,
          p.weight,
          p.unit,
          p."stockQuantity",
          p."lowStockThreshold",
          p."isActive",
          p."isFeatured",
          p."averageRating",
          p."totalReviews",
          p."createdAt",
          p."updatedAt",
          c.id as "category_id",
          c.name as "category_name",
          c.description as "category_description",
          c."imageUrl" as "category_imageUrl",
          c."isActive" as "category_isActive",
          c."createdAt" as "category_createdAt",
          c."updatedAt" as "category_updatedAt",
          similarity(p.name, $${paramIndex}) as similarity_score,
          COUNT(*) OVER() as total_count
        FROM "Product" p
        LEFT JOIN "Category" c ON p."categoryId" = c.id
        WHERE ${whereClause}
          AND similarity(p.name, $${paramIndex}) > 0.3
        ORDER BY similarity_score DESC, p."averageRating" DESC
        LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
      `;
      
      params.push(searchTerm);
      params.push(limit);
      params.push(offset);
      
      let results = await prisma.$queryRawUnsafe<any[]>(
        sqlQuery,
        ...params
      );
      
      const total = results.length > 0 ? Number(results[0].total_count) : 0;
      
      // Map category data to expected shape
      results = results.map(row => ({
        ...row,
        category: {
          id: row.category_id,
          name: row.category_name,
          description: row.category_description,
          imageUrl: row.category_imageUrl,
          isActive: row.category_isActive,
          createdAt: row.category_createdAt,
          updatedAt: row.category_updatedAt,
        },
        category_id: undefined,
        category_name: undefined,
        category_description: undefined,
        category_imageUrl: undefined,
        category_isActive: undefined,
        category_createdAt: undefined,
        category_updatedAt: undefined,
        total_count: undefined,
      }));
      
      logger.info('Fuzzy search executed', {
        searchTerm,
        resultCount: results.length,
        total,
        filters,
      });
      
      return { results, total };
    } catch (error) {
      logger.error('Fuzzy search failed', {
        searchTerm,
        filters,
        error,
      });
      throw error;
    }
  }

  /**
   * Generate autocomplete suggestions
   */
  async generateSearchSuggestions(
    prefix: string,
    limit: number = 10
  ): Promise<SearchSuggestion[]> {
    try {
      const suggestions: SearchSuggestion[] = [];
      
      // Get product name suggestions
      const productSuggestions = await prisma.product.findMany({
        where: {
          isActive: true,
          name: {
            contains: prefix,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          averageRating: true,
          totalReviews: true,
        },
        orderBy: [
          { averageRating: 'desc' },
          { totalReviews: 'desc' },
        ],
        take: Math.floor(limit * 0.7), // 70% of suggestions from products
      });
      
      productSuggestions.forEach((product) => {
        suggestions.push({
          text: product.name,
          type: 'product',
          score: Number(product.averageRating) + product.totalReviews * 0.1,
          productId: product.id,
        });
      });
      
      // Get category suggestions
      const categorySuggestions = await prisma.category.findMany({
        where: {
          isActive: true,
          name: {
            contains: prefix,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
        },
        take: Math.ceil(limit * 0.3), // 30% of suggestions from categories
      });
      
      categorySuggestions.forEach((category) => {
        suggestions.push({
          text: category.name,
          type: 'category',
          score: 5, // Fixed score for categories
          categoryId: category.id,
        });
      });
      
      // Sort by score and limit results
      return suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to generate search suggestions', {
        prefix,
        error,
      });
      throw error;
    }
  }
}

export const searchService = new SearchService();
