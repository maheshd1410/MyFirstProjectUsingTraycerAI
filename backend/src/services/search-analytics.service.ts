import { getRedisClient } from '../config/redis';
import logger from '../config/logger';

class SearchAnalyticsService {
  private readonly POPULAR_SEARCHES_KEY = 'search:popular';
  private readonly USER_SEARCH_PREFIX = 'search:user:';
  private readonly SEARCH_HISTORY_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  /**
   * Track a search query
   */
  async trackSearch(
    searchTerm: string,
    resultCount: number,
    userId?: string
  ): Promise<void> {
    try {
      const redis = getRedisClient();
      
      // Increment popular searches counter
      await redis.zincrby(this.POPULAR_SEARCHES_KEY, 1, searchTerm.toLowerCase());
      
      // Track user-specific search history
      if (userId) {
        const userKey = `${this.USER_SEARCH_PREFIX}${userId}`;
        const timestamp = Date.now();
        const searchData = JSON.stringify({
          term: searchTerm,
          resultCount,
          timestamp,
        });
        
        await redis.zadd(userKey, timestamp, searchData);
        await redis.expire(userKey, this.SEARCH_HISTORY_TTL);
      }
      
      logger.info('Search tracked', {
        searchTerm,
        resultCount,
        userId,
      });
    } catch (error) {
      logger.error('Failed to track search', {
        searchTerm,
        userId,
        error,
      });
      // Don't throw - tracking failure shouldn't break search
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearches(limit: number = 10): Promise<Array<{ term: string; count: number }>> {
    try {
      const redis = getRedisClient();
      
      // Get top searches with scores (descending order)
      const results = await redis.zrevrange(
        this.POPULAR_SEARCHES_KEY,
        0,
        limit - 1,
        'WITHSCORES'
      );
      
      const popularSearches: Array<{ term: string; count: number }> = [];
      
      // Parse results (format: [term1, score1, term2, score2, ...])
      for (let i = 0; i < results.length; i += 2) {
        popularSearches.push({
          term: results[i],
          count: parseInt(results[i + 1], 10),
        });
      }
      
      return popularSearches;
    } catch (error) {
      logger.error('Failed to get popular searches', { error });
      return [];
    }
  }

  /**
   * Get recent searches for a specific user
   */
  async getRecentSearches(
    userId: string,
    limit: number = 10
  ): Promise<Array<{ term: string; resultCount: number; timestamp: number }>> {
    try {
      const redis = getRedisClient();
      const userKey = `${this.USER_SEARCH_PREFIX}${userId}`;
      
      // Get recent searches (descending by timestamp)
      const results = await redis.zrevrange(userKey, 0, limit - 1);
      
      return results.map((data) => {
        const parsed = JSON.parse(data);
        return {
          term: parsed.term,
          resultCount: parsed.resultCount,
          timestamp: parsed.timestamp,
        };
      });
    } catch (error) {
      logger.error('Failed to get recent searches', {
        userId,
        error,
      });
      return [];
    }
  }

  /**
   * Clear user search history
   */
  async clearUserSearchHistory(userId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      const userKey = `${this.USER_SEARCH_PREFIX}${userId}`;
      await redis.del(userKey);
      
      logger.info('User search history cleared', { userId });
    } catch (error) {
      logger.error('Failed to clear user search history', {
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get search analytics metrics
   */
  async getSearchMetrics(): Promise<{
    totalSearches: number;
    uniqueSearchTerms: number;
    topSearches: Array<{ term: string; count: number }>;
  }> {
    try {
      const redis = getRedisClient();
      
      const totalSearches = await redis.get('search:total_count');
      const uniqueSearchTerms = await redis.zcard(this.POPULAR_SEARCHES_KEY);
      const topSearches = await this.getPopularSearches(10);
      
      return {
        totalSearches: parseInt(totalSearches || '0', 10),
        uniqueSearchTerms,
        topSearches,
      };
    } catch (error) {
      logger.error('Failed to get search metrics', { error });
      throw error;
    }
  }
}

export const searchAnalyticsService = new SearchAnalyticsService();
