import api from './api';
import { CouponValidationResult } from '../types';

export interface ValidateCouponRequest {
  couponCode: string;
  cartTotal: number;
  categoryIds?: string[];
  productIds?: string[];
}

export const couponService = {
  /**
   * Validate a coupon code for the current user
   */
  validateCoupon: async (data: ValidateCouponRequest): Promise<CouponValidationResult> => {
    const response = await api.post('/coupons/validate', data);
    return response.data;
  },
};
