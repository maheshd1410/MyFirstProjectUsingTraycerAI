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
    // Connect to database
    await connectDatabase();

    // Connect to Redis
    await connectRedis();

    // Initialize email queue
    await initializeEmailQueue();
    logger.info('Email queue initialized');

    // Warm cache with commonly accessed data
    await cacheWarmerService.warmAll();

    const server = app.listen(PORT, () => {
      logger.info('Server started', { port: PORT, environment: process.env.NODE_ENV || 'development' });
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
