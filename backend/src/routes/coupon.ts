import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { couponController } from '../controllers/coupon.controller';
import { couponValidator } from '../middleware/validators/coupon.validator';

const router = Router();

/**
 * @swagger
 * /api/coupons/validate:
 *   post:
 *     summary: Validate a coupon code for customer
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - orderAmount
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SAVE20"
 *               orderAmount:
 *                 type: number
 *                 example: 1000
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Coupon validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isValid:
 *                   type: boolean
 *                 discountAmount:
 *                   type: number
 *                 finalAmount:
 *                   type: number
 *                 isFreeShipping:
 *                   type: boolean
 *                 couponId:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/validate',
  authenticate,
  couponValidator.validateApplyCoupon,
  couponController.validateCouponForUser
);

export default router;
