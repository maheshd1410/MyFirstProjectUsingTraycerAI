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

// Create Address Validation
export const validateCreateAddress: ValidationChain[] = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  body('addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('postalCode').trim().notEmpty().withMessage('Postal code is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
];

// Update Address Validation
export const validateUpdateAddress: ValidationChain[] = [
  body('fullName').optional().trim(),
  body('phoneNumber').optional().trim(),
  body('addressLine1').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('postalCode').optional().trim(),
  body('country').optional().trim(),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
];
