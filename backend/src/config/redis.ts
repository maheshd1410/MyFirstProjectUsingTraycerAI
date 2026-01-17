import Redis from 'ioredis';
import logger from './logger';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  maxRetriesPerRequest: number;
  enableReadyCheck: boolean;
  lazyConnect: boolean;
  retryStrategy?: (times: number) => number | void;
}

// Redis configuration from environment variables
const config: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'ladoo:',
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy: (times: number) => {
    // Exponential backoff with max delay of 3 seconds
    const delay = Math.min(times * 50, 3000);
    logger.warn('Redis reconnection attempt', { attempt: times, delay: `${delay}ms` });
    return delay;
  },
};

// Create Redis client instance
let redisClient: Redis | null = null;

// Check if Redis is enabled
const isRedisEnabled = () => {
  return process.env.REDIS_ENABLED !== 'false';
};

// Create and configure Redis client
const createRedisClient = (): Redis => {
  const client = new Redis(config);

  // Connection event handlers
  client.on('connect', () => {
    logger.info('Redis connection established', {
      host: config.host,
      port: config.port,
      db: config.db,
    });
  });

  client.on('ready', () => {
    logger.info('Redis client ready');
  });

  client.on('error', (error) => {
    logger.error('Redis connection error', {
      error: error.message,
      stack: error.stack,
    });
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  client.on('reconnecting', (delay: number) => {
    logger.info('Redis reconnecting', { delay: `${delay}ms` });
  });

  client.on('end', () => {
    logger.info('Redis connection ended');
  });

  return client;
};

/**
 * Connect to Redis
 */
export const connectRedis = async (): Promise<void> => {
  if (!isRedisEnabled()) {
    logger.info('Redis caching is disabled');
    return;
  }

  try {
    if (!redisClient) {
      redisClient = createRedisClient();
    }

    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    // Don't throw - allow app to continue without cache
    redisClient = null;
  }
};

/**
 * Disconnect from Redis
 */
export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis disconnected successfully');
      redisClient = null;
    } catch (error) {
      logger.error('Failed to disconnect from Redis', { error });
      // Force close if quit fails
      if (redisClient) {
        redisClient.disconnect();
      }
      redisClient = null;
    }
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = (): Redis | null => {
  return redisClient;
};

/**
 * Check if Redis is connected
 */
export const isRedisConnected = (): boolean => {
  return redisClient?.status === 'ready';
};

export default {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisConnected,
};
