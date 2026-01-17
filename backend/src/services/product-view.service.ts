/**
 * Service for tracking and analyzing product views
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';
import { cacheService } from './cache.service';

const prisma = new PrismaClient();

interface TrackViewParams {
  productId: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const productViewService = {
  /**
   * Track a product view asynchronously (fire and forget)
   */
  trackView: async (params: TrackViewParams): Promise<void> => {
    try {
      const sessionId = params.sessionId || uuidv4();

      await prisma.productView.create({
        data: {
          productId: params.productId,
          userId: params.userId,
          sessionId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });

      // Invalidate product metrics cache to reflect updated view count
      await cacheService.invalidateByTags([`product:${params.productId}`, 'analytics']);

      logger.debug(`Product view tracked: ${params.productId}`);
    } catch (error) {
      // Don't throw - views are non-critical
      logger.warn('Failed to track product view:', error);
    }
  },

  /**
   * Get view count for a product within a date range
   */
  getViewCount: async (
    productId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> => {
    try {
      const count = await prisma.productView.count({
        where: {
          productId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      return count;
    } catch (error) {
      logger.error('Failed to get view count:', error);
      return 0;
    }
  },

  /**
   * Get view counts for multiple products
   */
  getViewCounts: async (
    productIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Map<string, number>> => {
    try {
      const views = await prisma.$queryRaw<Array<{ productId: string; viewCount: bigint }>>`
        SELECT "productId", COUNT(*) as "viewCount"
        FROM "ProductView"
        WHERE "productId" = ANY(${productIds})
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
        GROUP BY "productId"
      `;

      return new Map(views.map(v => [v.productId, Number(v.viewCount)]));
    } catch (error) {
      logger.error('Failed to get view counts:', error);
      return new Map();
    }
  },

  /**
   * Get unique viewers count (by sessionId)
   */
  getUniqueViewers: async (
    productId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> => {
    try {
      const result = await prisma.productView.groupBy({
        by: ['sessionId'],
        where: {
          productId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          sessionId: true,
        },
      });

      return result.length;
    } catch (error) {
      logger.error('Failed to get unique viewers:', error);
      return 0;
    }
  },

  /**
   * Clean up old view records (data retention)
   */
  cleanupOldViews: async (daysToKeep: number = 90): Promise<number> => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.productView.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${result.count} old product views`);
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup old views:', error);
      return 0;
    }
  },
};
