import logger from '../config/logger';

class CacheWarmerService {
  /**
   * Warm featured products cache
   */
  async warmFeaturedProducts(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Import dynamically to avoid circular dependencies
      const { productService } = await import('./product.service');
      
      // This will cache the featured products
      await productService.getFeaturedProducts();
      
      const duration = Date.now() - startTime;
      logger.info('Featured products cache warmed', { duration: `${duration}ms` });
    } catch (error) {
      logger.error('Failed to warm featured products cache', { error });
    }
  }

  /**
   * Warm categories cache
   */
  async warmCategories(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Import dynamically to avoid circular dependencies
      const { categoryService } = await import('./category.service');
      
      // This will cache all categories
      await categoryService.getAllCategories();
      
      const duration = Date.now() - startTime;
      logger.info('Categories cache warmed', { duration: `${duration}ms` });
    } catch (error) {
      logger.error('Failed to warm categories cache', { error });
    }
  }

  /**
   * Warm popular products cache
   */
  async warmPopularProducts(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Import dynamically to avoid circular dependencies
      const { productService } = await import('./product.service');
      
      // Get top 20 products by rating
      await productService.getAllProducts({
        sortBy: 'rating',
        page: 1,
        pageSize: 20,
      });
      
      const duration = Date.now() - startTime;
      logger.info('Popular products cache warmed', { duration: `${duration}ms` });
    } catch (error) {
      logger.error('Failed to warm popular products cache', { error });
    }
  }

  /**
   * Warm all caches
   */
  async warmAll(): Promise<void> {
    const startTime = Date.now();
    
    logger.info('Starting cache warming...');

    // Execute all warming operations in parallel
    const results = await Promise.allSettled([
      this.warmFeaturedProducts(),
      this.warmCategories(),
      this.warmPopularProducts(),
    ]);

    // Count successes and failures
    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;

    const duration = Date.now() - startTime;
    
    logger.info('Cache warming complete', {
      duration: `${duration}ms`,
      successes,
      failures,
    });
  }
}

// Export singleton instance
export const cacheWarmerService = new CacheWarmerService();
