import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { mongoSanitizeMiddleware, xssMiddleware } from './middleware/sanitize';
import authRoutes from './routes/auth';
import productRoutes from './routes/product';
import categoryRoutes from './routes/category';
import cartRoutes from './routes/cart';
import wishlistRoutes from './routes/wishlist';
import addressRoutes from './routes/address';
import orderRoutes from './routes/order';
import paymentRoutes from './routes/payment';
import reviewRoutes from './routes/review';
import notificationRoutes from './routes/notification';
import profileRoutes from './routes/profile';
import adminRoutes from './routes/admin';
import { generalLimiter, authLimiter, apiLimiter } from './middleware/rateLimiter';
import { requestLogger, responseLogger } from './middleware/logger';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { isRedisConnected } from './config/redis';
import { prisma } from './config/database';

const app = express();

// Middleware
// Enhanced security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
}));
app.use(cors());

// Request and response loggers (before routes)
app.use(requestLogger);
app.use(responseLogger);

// Apply general rate limiter globally
app.use(generalLimiter);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { background-color: #1a1a1a }',
  customSiteTitle: 'Ladoo Business API',
  swaggerOptions: {
    persistAuthorization: true,
    tryItOutEnabled: true,
  },
}));

// Swagger JSON spec endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Webhook endpoint with raw body parser (must be before express.json())
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// JSON body parser for all other routes with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb', parameterLimit: 1000 }));

// Input sanitization middleware (after body parsers)
app.use(mongoSanitizeMiddleware);
app.use(xssMiddleware);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/categories', apiLimiter, categoryRoutes);
app.use('/api/cart', apiLimiter, cartRoutes);
app.use('/api/wishlist', apiLimiter, wishlistRoutes);
app.use('/api/addresses', apiLimiter, addressRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', apiLimiter, reviewRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/profile', apiLimiter, profileRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbStatus = 'connected';
    const redisStatus = isRedisConnected() ? 'connected' : 'disconnected';

    res.json({
      status: 'ok',
      message: 'Ladoo Business API is running',
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      services: {
        database: 'disconnected',
        redis: isRedisConnected() ? 'connected' : 'disconnected',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// 404 handler for undefined routes
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

export default app;
