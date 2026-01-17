import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import logger from '../config/logger';

// Extend Express Request type to include id and startTime
declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

/**
 * Request logger middleware
 * Generates unique request ID and logs incoming requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Skip logging for health check endpoints
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  // Generate unique request ID
  req.id = randomUUID();
  req.startTime = Date.now();

  // Log incoming request
  logger.http('Incoming request', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId,
  });

  next();
};

/**
 * Response logger middleware
 * Logs response status, duration, and metadata
 */
export const responseLogger = (req: Request, res: Response, next: NextFunction) => {
  // Skip logging for health check endpoints
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  // Log response when it finishes (captures all response types)
  res.on('finish', () => {
    // Calculate response time
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    
    // Determine log level based on status code
    const statusCode = res.statusCode;
    let logLevel: 'http' | 'warn' | 'error' = 'http';
    
    if (statusCode >= 500) {
      logLevel = 'error';
    } else if (statusCode >= 400) {
      logLevel = 'warn';
    }

    // Log response
    logger[logLevel]('Outgoing response', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      duration: `${duration}ms`,
      userId: req.user?.userId,
      contentLength: res.get('content-length'),
    });
  });

  next();
};

/**
 * Helper function to create authorization headers for tests
 */
export const createAuthHeaders = (token: string) => {
  return {
    Authorization: `Bearer ${token}`,
  };
};
