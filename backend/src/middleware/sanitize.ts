import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import { RequestHandler } from 'express';

/**
 * Input sanitization middleware to protect against XSS and NoSQL injection
 * 
 * - express-mongo-sanitize: Removes keys that start with $ or contain . to prevent NoSQL injection
 * - xss-clean: Sanitizes user input to prevent XSS attacks by escaping HTML
 */

// MongoDB sanitization middleware
export const mongoSanitizeMiddleware: RequestHandler = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Request sanitized - ${req.path}: Removed key "${key}"`);
  },
});

// XSS sanitization middleware
export const xssMiddleware: RequestHandler = xss();
