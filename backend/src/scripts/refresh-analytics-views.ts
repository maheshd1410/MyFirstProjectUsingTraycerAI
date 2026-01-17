/**
 * Script to refresh materialized views for analytics
 * Can be run manually or scheduled via cron
 */

import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const prisma = new PrismaClient();

export const refreshAnalyticsViews = async (): Promise<void> => {
  const startTime = Date.now();
  
  try {
    logger.info('Starting analytics views refresh...');

    // Call the refresh function created in the migration
    await prisma.$executeRaw`SELECT refresh_analytics_views()`;

    const duration = Date.now() - startTime;
    logger.info(`Analytics views refreshed successfully in ${duration}ms`);
  } catch (error) {
    logger.error('Failed to refresh analytics views:', error);
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  refreshAnalyticsViews()
    .then(() => {
      logger.info('Analytics views refresh completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Analytics views refresh failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
