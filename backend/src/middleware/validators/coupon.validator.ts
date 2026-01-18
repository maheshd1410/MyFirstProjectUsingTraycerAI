import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const couponValidator = {
  /**
   * Validate coupon creation request
   */
  validateCreateCoupon: [
    body('code')
      .notEmpty()
      .withMessage('Code is required')
      .isString()
      .withMessage('Code must be a string')
      .isLength({ min: 3, max: 50 })
      .withMessage('Code must be between 3 and 50 characters')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Code must contain only uppercase letters and numbers'),
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isString()
      .withMessage('Name must be a string')
      .isLength({ min: 3, max: 255 })
      .withMessage('Name must be between 3 and 255 characters'),
    body('description')
      .optional()
      .isString()
      .withMessage('Description must be a string'),
    body('discountType')
      .notEmpty()
      .withMessage('Discount type is required')
      .isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'])
      .withMessage('Discount type must be PERCENTAGE, FIXED_AMOUNT, or FREE_SHIPPING'),
    body('discountValue')
      .notEmpty()
      .withMessage('Discount value is required')
      .isFloat({ min: 0 })
      .withMessage('Discount value must be a positive number'),
    body('minOrderAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum order amount must be a positive number'),
    body('maxDiscountAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum discount amount must be a positive number'),
    body('usageLimit')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Usage limit must be a positive integer'),
    body('perUserLimit')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Per-user limit must be a positive integer'),
    body('validFrom')
      .notEmpty()
      .withMessage('Valid from date is required')
      .isISO8601()
      .withMessage('Valid from must be a valid ISO 8601 date'),
    body('validUntil')
      .notEmpty()
      .withMessage('Valid until date is required')
      .isISO8601()
      .withMessage('Valid until must be a valid ISO 8601 date')
      .custom((value, { req }) => {
        const validFrom = new Date(req.body.validFrom);
        const validUntil = new Date(value);
        if (validUntil <= validFrom) {
          throw new Error('Valid until date must be after valid from date');
        }
        return true;
      }),
    body('applicableCategories')
      .optional()
      .isArray()
      .withMessage('Applicable categories must be an array'),
    body('applicableProducts')
      .optional()
      .isArray()
      .withMessage('Applicable products must be an array'),
    body('restrictedUserIds')
      .optional()
      .isArray()
      .withMessage('Restricted user IDs must be an array'),
    handleValidationErrors,
  ],

  /**
   * Validate coupon update request
   */
  validateUpdateCoupon: [
    param('id')
      .notEmpty()
      .withMessage('ID is required')
      .isUUID()
      .withMessage('ID must be a valid UUID'),
    body('code')
      .optional()
      .isString()
      .withMessage('Code must be a string')
      .isLength({ min: 3, max: 50 })
      .withMessage('Code must be between 3 and 50 characters')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Code must contain only uppercase letters and numbers'),
    body('name')
      .optional()
      .isString()
      .withMessage('Name must be a string')
      .isLength({ min: 3, max: 255 })
      .withMessage('Name must be between 3 and 255 characters'),
    body('discountType')
      .optional()
      .isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'])
      .withMessage('Discount type must be PERCENTAGE, FIXED_AMOUNT, or FREE_SHIPPING'),
    body('discountValue')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount value must be a positive number'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    handleValidationErrors,
  ],

  /**
   * Validate coupon ID parameter
   */
  validateCouponId: [
    param('id')
      .notEmpty()
      .withMessage('ID is required')
      .isUUID()
      .withMessage('ID must be a valid UUID'),
    handleValidationErrors,
  ],

  /**
   * Validate coupon list filters
   */
  validateGetCoupons: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Page size must be between 1 and 100')
      .toInt(),
    query('status')
      .optional()
      .isIn(['ACTIVE', 'INACTIVE', 'EXPIRED'])
      .withMessage('Status must be ACTIVE, INACTIVE, or EXPIRED'),
    query('discountType')
      .optional()
      .isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'])
      .withMessage('Discount type must be PERCENTAGE, FIXED_AMOUNT, or FREE_SHIPPING'),
    query('search')
      .optional()
      .isString()
      .withMessage('Search must be a string'),
    handleValidationErrors,
  ],

  /**
   * Validate coupon validation request
   */
  validateApplyCoupon: [
    body('code')
      .notEmpty()
      .withMessage('Code is required')
      .isString()
      .withMessage('Code must be a string'),
    body('orderAmount')
      .notEmpty()
      .withMessage('Order amount is required')
      .isFloat({ min: 0 })
      .withMessage('Order amount must be a positive number'),
    body('categoryIds')
      .optional()
      .isArray()
      .withMessage('Category IDs must be an array'),
    body('productIds')
      .optional()
      .isArray()
      .withMessage('Product IDs must be an array'),
    handleValidationErrors,
  ],
};
