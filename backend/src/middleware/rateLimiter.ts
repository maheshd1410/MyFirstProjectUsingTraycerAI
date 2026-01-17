import rateLimit from 'express-rate-limit';

// General rate limiter: 100 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter: 5 requests per 15 minutes for login/register
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login/register attempts, please try again later',
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
});

// API rate limiter: 200 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many API requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
