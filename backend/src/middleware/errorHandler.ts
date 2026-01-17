import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/errors';
import logger, { logError } from '../config/logger';

// Helper to sanitize request body (remove sensitive fields)
const sanitizeBody = (body: any): any => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'secret'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Generate error ID for tracking
  const errorId = uuidv4();
  
  // Base error metadata
  const errorMetadata: Record<string, any> = {
    errorId,
    requestId: req.id,
    userId: req.user?.userId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: sanitizeBody(req.body),
  };

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    logger.warn('Operational error', {
      ...errorMetadata,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
    });
    
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      errorId,
    });
  }

  // Handle Prisma errors
  if (err.code) {
    logger.error('Database error', {
      ...errorMetadata,
      prismaCode: err.code,
      message: err.message,
      meta: err.meta,
    });
    
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        return res.status(409).json({
          error: 'A record with this unique field already exists',
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          errorId,
        });

      case 'P2025':
        // Record not found
        return res.status(404).json({
          error: 'Record not found',
          code: 'NOT_FOUND',
          errorId,
        });

      case 'P2003':
        // Foreign key constraint violation
        return res.status(400).json({
          error: 'Invalid reference to related record',
          code: 'FOREIGN_KEY_VIOLATION',
          errorId,
        });

      case 'P2014':
        // Required relation violation
        return res.status(400).json({
          error: 'Operation failed due to missing required related records',
          code: 'REQUIRED_RELATION_VIOLATION',
          errorId,
        });

      default:
        return res.status(500).json({
          error: 'Database operation failed',
          code: 'DATABASE_ERROR',
          errorId,
        });
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.warn('JWT validation failed', {
      ...errorMetadata,
      error: err.message,
    });
    
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
      errorId,
    });
  }

  if (err.name === 'TokenExpiredError') {
    logger.warn('JWT token expired', {
      ...errorMetadata,
      expiredAt: err.expiredAt,
    });
    
    return res.status(401).json({
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
      errorId,
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    logger.info('Validation error', {
      ...errorMetadata,
      details: err.message,
    });
    
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.message,
      errorId,
    });
  }

  // Handle unexpected errors (programmer errors)
  logger.error('Unexpected error', {
    ...errorMetadata,
    message: err.message,
    stack: err.stack,
    error: err,
  });

  // Generic error response
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message || 'Something went wrong',
    code: 'INTERNAL_ERROR',
    errorId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Async error wrapper - wraps async route handlers to catch errors
export const asyncHandler = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
