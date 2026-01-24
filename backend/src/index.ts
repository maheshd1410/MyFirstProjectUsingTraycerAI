import dotenv from 'dotenv';
import { Server } from 'http';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { cacheWarmerService } from './services/cache-warmer.service';
import { initializeEmailQueue, closeEmailQueue } from './services/email-queue.service';
import logger from './config/logger';
import app from './app';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Graceful shutdown function
const gracefulShutdown = async (signal: string, server: Server) => {
  logger.info('Graceful shutdown initiated', { signal });
  try {
    // Close HTTP server first
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else {
          logger.info('HTTP server closed');
          resolve();
        }
      });
    });

    // Disconnect Redis
    await disconnectRedis();
    logger.info('Redis disconnected');

    // Close email queue
    await closeEmailQueue();
    logger.info('Email queue closed');

    // Then disconnect database
    await disconnectDatabase();
    logger.info('Database disconnected');

    process.exit(0);
  } catch (error) {
    logger.error('Shutdown error', { error });
    process.exit(1);
  }
};

// Start server
async function startServer() {
  try {
    // Connect to database (with error handling for development)
    try {
      await connectDatabase();
    } catch (dbError) {
      logger.warn('⚠️  Database connection failed - server will start in degraded mode', { error: dbError });
      // Continue startup in development mode
    }

    // Connect to Redis (optional) - with timeout
    try {
      const redisPromise = connectRedis();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout')), 3000)
      );
      await Promise.race([redisPromise, timeoutPromise]);
    } catch (redisError) {
      logger.warn('⚠️  Redis connection failed or timed out - caching will be disabled', { error: redisError });
      // Continue startup
    }

    // Initialize email queue (optional) - with timeout
    try {
      const emailPromise = initializeEmailQueue();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email queue timeout')), 2000)
      );
      await Promise.race([emailPromise, timeoutPromise]);
      logger.info('Email queue initialized');
    } catch (emailError) {
      logger.warn('⚠️  Email queue initialization failed or timed out', { error: emailError });
      // Continue startup
    }

    // Skip cache warming in development mode
    logger.info('Skipping cache warming in development mode');

    const server = app.listen(PORT, () => {
      logger.info('Server started', { port: PORT, environment: process.env.NODE_ENV || 'development' });
      logger.info('✅ Swagger API docs available at http://localhost:3000/api-docs');
      logger.info('✅ Health check available at http://localhost:3000/health');
    });

    // Handle graceful shutdown with proper server closure
    process.on('SIGINT', () => gracefulShutdown('SIGINT', server));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));
  } catch (error) {
    logger.error('Server startup failed', { error });
    process.exit(1);
  }
}

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
