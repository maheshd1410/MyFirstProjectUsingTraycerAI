import { body, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation result handler
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array().map((err: any) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Create Review Validation
export const validateCreateReview: ValidationChain[] = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ max: 255 }).withMessage('Title must not exceed 255 characters'),
  body('comment').optional().trim(),
  body('images').optional().isArray().withMessage('Images must be an array'),
];

// Update Review Validation
export const validateUpdateReview: ValidationChain[] = [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ max: 255 }).withMessage('Title must not exceed 255 characters'),
  body('comment').optional().trim(),
  body('images').optional().isArray().withMessage('Images must be an array'),
];

// Moderate Review Validation
export const validateModerateReview: ValidationChain[] = [
  body('moderationStatus').isIn(['APPROVED', 'REJECTED']).withMessage('Moderation status must be APPROVED or REJECTED'),
  body('moderationNote').optional().trim(),
];
