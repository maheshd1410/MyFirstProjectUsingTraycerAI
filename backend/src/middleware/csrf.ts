import { doubleCsrf } from 'csrf-csrf';
import { Request, Response, NextFunction } from 'express';

/**
 * CSRF protection middleware using csrf-csrf
 * 
 * Protects against Cross-Site Request Forgery attacks by validating
 * CSRF tokens for state-changing operations (POST, PUT, PATCH, DELETE)
 */

const {
  invalidCsrfTokenError,
  validateRequest,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getSessionIdentifier: (req: Request) => (req as any).session?.id || req.ip || 'anonymous',
  getCsrfTokenFromRequest: (req: Request) => req.headers['x-csrf-token'] as string,
});

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  doubleCsrfProtection(req, res, (err) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid CSRF token',
        code: 'CSRF_TOKEN_INVALID',
      });
    }
    next();
  });
};

// Check if error is CSRF-related
export const isCsrfError = (error: any) => {
  return error === invalidCsrfTokenError;
};
