import { body, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const adminValidator = {
  validateGetOrders: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('search').optional().isString(),
    handleValidationErrors,
  ],

  validateGetUsers: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('role').optional().isString(),
    query('isActive').optional().isBoolean(),
    query('search').optional().isString(),
    handleValidationErrors,
  ],

  validateUpdateUserStatus: [
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
    handleValidationErrors,
  ],
};
