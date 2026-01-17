import { body, query, param, validationResult } from 'express-validator';
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

  validateDateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('startDate must be a valid ISO 8601 date (YYYY-MM-DD)')
      .custom((value, { req }) => {
        const start = new Date(value);
        const end = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
        if (start > end) {
          throw new Error('startDate must be before endDate');
        }
        return true;
      }),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('endDate must be a valid ISO 8601 date (YYYY-MM-DD)')
      .custom((value) => {
        const end = new Date(value);
        const now = new Date();
        if (end > now) {
          throw new Error('endDate cannot be in the future');
        }
        return true;
      })
      .custom((value, { req }) => {
        if (req.query.startDate) {
          const start = new Date(req.query.startDate as string);
          const end = new Date(value);
          const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 365) {
            throw new Error('Date range cannot exceed 365 days');
          }
        }
        return true;
      }),
    (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array().map(e => ({ field: e.type === 'field' ? (e as any).path : 'unknown', message: e.msg }))
        });
      }

      // Set default dates if not provided
      if (!req.query.startDate) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        req.query.startDate = thirtyDaysAgo.toISOString().split('T')[0];
      }
      if (!req.query.endDate) {
        req.query.endDate = new Date().toISOString().split('T')[0];
      }

      next();
    },
  ],

  validateGroupBy: [
    query('groupBy')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('groupBy must be one of: day, week, month'),
    (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array().map(e => ({ field: e.type === 'field' ? (e as any).path : 'unknown', message: e.msg }))
        });
      }

      // Set default groupBy if not provided
      if (!req.query.groupBy) {
        req.query.groupBy = 'day';
      }

      next();
    },
  ],

  validatePagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
    (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array().map(e => ({ field: e.type === 'field' ? (e as any).path : 'unknown', message: e.msg }))
        });
      }

      // Set defaults
      if (!req.query.page) {
        req.query.page = '1';
      }
      if (!req.query.limit) {
        req.query.limit = '10';
      }

      next();
    },
  ],

  validateProductId: [
    param('productId')
      .notEmpty()
      .withMessage('productId is required')
      .isString()
      .withMessage('productId must be a valid string'),
    handleValidationErrors,
  ],

  validateThreshold: [
    query('threshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('threshold must be a non-negative integer'),
    handleValidationErrors,
  ],
};

