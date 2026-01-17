import { body, param, query, validationResult, ValidationChain } from 'express-validator';
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

// Create Product Validation
export const validateCreateProduct: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ min: 3, max: 255 }).withMessage('Product name must be between 3 and 255 characters'),
  body('description').trim().notEmpty().withMessage('Product description is required'),
  body('price').isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }).withMessage('Price must be greater than 0'),
  body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
  body('categoryId').notEmpty().withMessage('Category ID is required'),
  body('stockQuantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('unit').isIn(['KG', 'GRAM', 'PIECE', 'BOX']).withMessage('Invalid unit. Must be KG, GRAM, PIECE, or BOX'),
];

// Update Product Validation
export const validateUpdateProduct: ValidationChain[] = [
  body('name').optional().trim().isLength({ min: 3, max: 255 }).withMessage('Product name must be between 3 and 255 characters'),
  body('description').optional().trim(),
  body('price').optional().isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }).withMessage('Price must be greater than 0'),
  body('images').optional().isArray({ min: 1 }).withMessage('Images must be an array with at least one item'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('unit').optional().isIn(['KG', 'GRAM', 'PIECE', 'BOX']).withMessage('Invalid unit. Must be KG, GRAM, PIECE, or BOX'),
];

// Validate Product ID
export const validateProductId: ValidationChain[] = [
  param('id').notEmpty().withMessage('Product ID is required'),
];
