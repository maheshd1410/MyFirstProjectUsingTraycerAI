import logger from '../config/logger';

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  avgHitResponseTime: number;
  avgMissResponseTime: number;
  keyCount: number;
}

class CacheMetricsService {
  private hits: number = 0;
  private misses: number = 0;
  private hitResponseTimes: number[] = [];
  private missResponseTimes: number[] = [];

  /**
   * Record cache hit
   */
  recordHit(key: string, responseTime: number): void {
    this.hits++;
    this.hitResponseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.hitResponseTimes.length > 1000) {
      this.hitResponseTimes.shift();
    }

    logger.debug('Cache hit recorded', { key, responseTime: `${responseTime}ms` });
  }

  /**
   * Record cache miss
   */
  recordMiss(key: string, responseTime: number): void {
    this.misses++;
    this.missResponseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.missResponseTimes.length > 1000) {
      this.missResponseTimes.shift();
    }

    logger.debug('Cache miss recorded', { key, responseTime: `${responseTime}ms` });
  }

  /**
   * Get aggregated metrics
   */
  async getMetrics(): Promise<CacheMetrics> {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    const avgHitTime = this.hitResponseTimes.length > 0
      ? this.hitResponseTimes.reduce((a, b) => a + b, 0) / this.hitResponseTimes.length
      : 0;

    const avgMissTime = this.missResponseTimes.length > 0
      ? this.missResponseTimes.reduce((a, b) => a + b, 0) / this.missResponseTimes.length
      : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests,
      avgHitResponseTime: Math.round(avgHitTime * 100) / 100,
      avgMissResponseTime: Math.round(avgMissTime * 100) / 100,
      keyCount: 0, // Can be populated from Redis if needed
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.hits = 0;
    this.misses = 0;
    this.hitResponseTimes = [];
    this.missResponseTimes = [];
    
    logger.info('Cache metrics reset');
  }
}

// Export singleton instance
export const cacheMetricsService = new CacheMetricsService();
