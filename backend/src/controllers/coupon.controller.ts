import { Request, Response } from 'express';
import { couponService } from '../services/coupon.service';
import { Decimal } from '@prisma/client/runtime/library';
import logger from '../config/logger';

export const couponController = {
  /**
   * Create new coupon (Admin only)
   */
  createCoupon: async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const coupon = await couponService.createCoupon(data);
      res.status(201).json(coupon);
    } catch (error: any) {
      logger.error('Create coupon error', { error });
      res.status(400).json({ error: error.message || 'Failed to create coupon' });
    }
  },

  /**
   * Get all coupons with pagination and filters (Admin only)
   */
  getAllCoupons: async (req: Request, res: Response) => {
    try {
      const { page = 1, pageSize = 10, status, discountType, search } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const pageSizeNum = parseInt(pageSize as string) || 10;

      const coupons = await couponService.getAllCoupons({
        page: pageNum,
        pageSize: pageSizeNum,
        status: status as any,
        discountType: discountType as any,
        search: search as string,
      });

      res.json(coupons);
    } catch (error: any) {
      logger.error('Get coupons error', { error });
      res.status(500).json({ error: 'Failed to fetch coupons' });
    }
  },

  /**
   * Get coupon by ID (Admin only)
   */
  getCouponById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const coupon = await couponService.getCouponById(id);
      
      if (!coupon) {
        return res.status(404).json({ error: 'Coupon not found' });
      }

      res.json(coupon);
    } catch (error: any) {
      logger.error('Get coupon error', { error });
      res.status(500).json({ error: 'Failed to fetch coupon' });
    }
  },

  /**
   * Update coupon (Admin only)
   */
  updateCoupon: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const coupon = await couponService.updateCoupon(id, data);
      
      if (!coupon) {
        return res.status(404).json({ error: 'Coupon not found' });
      }

      res.json(coupon);
    } catch (error: any) {
      logger.error('Update coupon error', { error });
      res.status(400).json({ error: error.message || 'Failed to update coupon' });
    }
  },

  /**
   * Delete coupon (Admin only)
   */
  deleteCoupon: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await couponService.deleteCoupon(id);
      res.status(204).send();
    } catch (error: any) {
      logger.error('Delete coupon error', { error });
      res.status(400).json({ error: error.message || 'Failed to delete coupon' });
    }
  },

  /**
   * Get coupon usage statistics (Admin only)
   */
  getCouponUsageStats: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const stats = await couponService.getCouponUsageStats(id);
      
      if (!stats) {
        return res.status(404).json({ error: 'Coupon not found' });
      }

      res.json(stats);
    } catch (error: any) {
      logger.error('Get coupon stats error', { error });
      res.status(500).json({ error: 'Failed to fetch coupon statistics' });
    }
  },

  /**
   * Validate coupon for customer (Authenticated)
   */
  validateCouponForUser: async (req: Request, res: Response) => {
    try {
      const { code, orderAmount, categoryIds = [], productIds = [] } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!code || typeof orderAmount !== 'number') {
        return res.status(400).json({ error: 'Code and orderAmount are required' });
      }

      const result = await couponService.validateCoupon(
        code,
        userId,
        new Decimal(orderAmount),
        categoryIds,
        productIds
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Validate coupon error', { error });
      res.status(500).json({ error: 'Failed to validate coupon' });
    }
  },
};
