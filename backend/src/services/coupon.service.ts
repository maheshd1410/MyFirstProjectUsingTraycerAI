import { prisma } from '../config/database';
import {
  CreateCouponDTO,
  UpdateCouponDTO,
  CouponFilterDTO,
  CouponValidationResult,
  CouponResponse,
} from '../types';
import { Decimal } from '@prisma/client/runtime/library';
import { cacheService } from './cache.service';
import logger from '../config/logger';

export class CouponService {
  /**
   * Validate coupon eligibility with all business rules
   */
  async validateCoupon(
    code: string,
    userId: string,
    orderAmount: Decimal,
    categoryIds: string[],
    productIds: string[]
  ): Promise<CouponValidationResult> {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: orderAmount.toNumber(),
          message: 'Coupon code not found',
        };
      }

      // Check if coupon is active
      if (!coupon.isActive || coupon.status !== 'ACTIVE') {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: orderAmount.toNumber(),
          message: 'This coupon is no longer active',
        };
      }

      // Check date validity
      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: orderAmount.toNumber(),
          message: 'This coupon has expired or is not yet valid',
        };
      }

      // Check global usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: orderAmount.toNumber(),
          message: 'This coupon has reached its usage limit',
        };
      }

      // Check per-user usage limit
      if (coupon.perUserLimit) {
        const userUsageCount = await prisma.couponUsage.count({
          where: {
            couponId: coupon.id,
            userId,
          },
        });

        if (userUsageCount >= coupon.perUserLimit) {
          return {
            isValid: false,
            discountAmount: 0,
            finalAmount: orderAmount.toNumber(),
            message: `You have already used this coupon ${coupon.perUserLimit} time(s)`,
          };
        }
      }

      // Check minimum order amount
      if (coupon.minOrderAmount && orderAmount.lessThan(coupon.minOrderAmount)) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: orderAmount.toNumber(),
          message: `Minimum order amount of ₹${coupon.minOrderAmount} required`,
        };
      }

      // Check category restrictions
      if (coupon.applicableCategories.length > 0) {
        const hasApplicableCategory = categoryIds.some(catId =>
          coupon.applicableCategories.includes(catId)
        );

        if (!hasApplicableCategory) {
          return {
            isValid: false,
            discountAmount: 0,
            finalAmount: orderAmount.toNumber(),
            message: 'This coupon is not applicable to items in your cart',
          };
        }
      }

      // Check product restrictions
      if (coupon.applicableProducts.length > 0) {
        const hasApplicableProduct = productIds.some(prodId =>
          coupon.applicableProducts.includes(prodId)
        );

        if (!hasApplicableProduct) {
          return {
            isValid: false,
            discountAmount: 0,
            finalAmount: orderAmount.toNumber(),
            message: 'This coupon is not applicable to items in your cart',
          };
        }
      }

      // Check user restrictions
      if (coupon.restrictedUserIds.length > 0 && coupon.restrictedUserIds.includes(userId)) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: orderAmount.toNumber(),
          message: 'You are not eligible to use this coupon',
        };
      }

      // Calculate discount
      let discountAmount = new Decimal('0');
      let isFreeShipping = false;

      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = orderAmount.mul(coupon.discountValue).div(100);

        // Apply max discount cap if set
        if (coupon.maxDiscountAmount) {
          discountAmount = discountAmount.greaterThan(coupon.maxDiscountAmount)
            ? coupon.maxDiscountAmount
            : discountAmount;
        }
      } else if (coupon.discountType === 'FIXED_AMOUNT') {
        discountAmount = new Decimal(coupon.discountValue);

        // Don't discount more than order amount
        discountAmount = discountAmount.greaterThan(orderAmount)
          ? orderAmount
          : discountAmount;
      } else if (coupon.discountType === 'FREE_SHIPPING') {
        // For free shipping, set flag and no additional discount
        isFreeShipping = true;
        discountAmount = new Decimal('0');
      }

      const finalAmount = orderAmount.sub(discountAmount);

      return {
        isValid: true,
        discountAmount: discountAmount.toNumber(),
        finalAmount: finalAmount.toNumber(),
        couponId: coupon.id,
        isFreeShipping,
      };
    } catch (error) {
      logger.error('Coupon validation error', { code, error });
      return {
        isValid: false,
        discountAmount: 0,
        finalAmount: orderAmount.toNumber(),
        message: 'Failed to validate coupon',
      };
    }
  }

  /**
   * Apply coupon and return discount amount
   */
  async applyCoupon(
    code: string,
    userId: string,
    orderAmount: Decimal,
    categoryIds: string[],
    productIds: string[]
  ): Promise<CouponValidationResult> {
    return this.validateCoupon(code, userId, orderAmount, categoryIds, productIds);
  }

  /**
   * Create new coupon (admin)
   */
  async createCoupon(data: CreateCouponDTO): Promise<CouponResponse> {
    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existing) {
      throw new Error('Coupon code already exists');
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        discountType: data.discountType,
        discountValue: new Decimal(data.discountValue),
        minOrderAmount: data.minOrderAmount ? new Decimal(data.minOrderAmount) : undefined,
        maxDiscountAmount: data.maxDiscountAmount ? new Decimal(data.maxDiscountAmount) : undefined,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        applicableCategories: data.applicableCategories || [],
        applicableProducts: data.applicableProducts || [],
        restrictedUserIds: data.restrictedUserIds || [],
      },
    });

    await cacheService.invalidateByTags(['coupons']);

    return this.formatCouponResponse(coupon);
  }

  /**
   * Update coupon (admin)
   */
  async updateCoupon(id: string, data: UpdateCouponDTO): Promise<CouponResponse> {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Check if new code is unique
    if (data.code && data.code.toUpperCase() !== coupon.code) {
      const existing = await prisma.coupon.findUnique({
        where: { code: data.code.toUpperCase() },
      });

      if (existing) {
        throw new Error('Coupon code already exists');
      }
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        code: data.code ? data.code.toUpperCase() : undefined,
        name: data.name,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue ? new Decimal(data.discountValue) : undefined,
        minOrderAmount: data.minOrderAmount ? new Decimal(data.minOrderAmount) : undefined,
        maxDiscountAmount: data.maxDiscountAmount ? new Decimal(data.maxDiscountAmount) : undefined,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        isActive: data.isActive,
        applicableCategories: data.applicableCategories,
        applicableProducts: data.applicableProducts,
        restrictedUserIds: data.restrictedUserIds,
      },
    });

    await cacheService.invalidateByTags(['coupons', `coupon:${id}`]);

    return this.formatCouponResponse(updated);
  }

  /**
   * Delete coupon (soft delete - set inactive)
   */
  async deleteCoupon(id: string): Promise<void> {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    await prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });

    await cacheService.invalidateByTags(['coupons', `coupon:${id}`]);
  }

  /**
   * Get coupon by ID
   */
  async getCouponById(id: string): Promise<CouponResponse> {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    return this.formatCouponResponse(coupon);
  }

  /**
   * Get all coupons with filters
   */
  async getAllCoupons(filters: CouponFilterDTO): Promise<{
    coupons: CouponResponse[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.discountType) {
      where.discountType = filters.discountType;
    }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search.toUpperCase(), mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coupon.count({ where }),
    ]);

    return {
      coupons: coupons.map(c => this.formatCouponResponse(c)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get coupon usage statistics
   */
  async getCouponUsageStats(couponId: string): Promise<{
    totalUsage: number;
    uniqueUsers: number;
    totalDiscountGiven: number;
    lastUsed?: Date;
  }> {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    const usageLogs = await prisma.couponUsage.findMany({
      where: { couponId },
    });

    const uniqueUsers = new Set(usageLogs.map(log => log.userId)).size;
    const totalDiscountGiven = usageLogs.reduce((sum, log) => sum.add(log.discountAmount), new Decimal('0'));

    const lastUsage = await prisma.couponUsage.findFirst({
      where: { couponId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      totalUsage: usageLogs.length,
      uniqueUsers,
      totalDiscountGiven: totalDiscountGiven.toNumber(),
      lastUsed: lastUsage?.createdAt,
    };
  }

  /**
   * Check user-specific coupon usage
   */
  async checkUserCouponUsage(couponId: string, userId: string): Promise<number> {
    const usageCount = await prisma.couponUsage.count({
      where: {
        couponId,
        userId,
      },
    });

    return usageCount;
  }

  /**
   * Record coupon usage after order creation
   */
  async incrementUsageCount(
    couponId: string,
    userId: string,
    orderId: string,
    discountAmount: Decimal
  ): Promise<void> {
    await Promise.all([
      prisma.coupon.update({
        where: { id: couponId },
        data: { usageCount: { increment: 1 } },
      }),
      prisma.couponUsage.create({
        data: {
          couponId,
          userId,
          orderId,
          discountAmount,
        },
      }),
    ]);

    await cacheService.invalidateByTags(['coupons', `coupon:${couponId}`]);
  }

  /**
   * Update expired coupons (can be run as a cron job)
   */
  async updateExpiredCoupons(): Promise<number> {
    const now = new Date();

    const result = await prisma.coupon.updateMany({
      where: {
        validUntil: { lt: now },
        status: { not: 'EXPIRED' },
      },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      await cacheService.invalidateByTags(['coupons']);
    }

    return result.count;
  }

  /**
   * Format coupon response
   */
  private formatCouponResponse(coupon: any): CouponResponse {
    return {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toNumber(),
      minOrderAmount: coupon.minOrderAmount?.toNumber(),
      maxDiscountAmount: coupon.maxDiscountAmount?.toNumber(),
      usageLimit: coupon.usageLimit,
      usageCount: coupon.usageCount,
      perUserLimit: coupon.perUserLimit,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      isActive: coupon.isActive,
      status: coupon.status,
      applicableCategories: coupon.applicableCategories,
      applicableProducts: coupon.applicableProducts,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
    };
  }
}

export const couponService = new CouponService();
