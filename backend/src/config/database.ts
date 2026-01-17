import { PrismaClient } from '@prisma/client';
import logger from './logger';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

// Forward Prisma logs to Winston
(prisma as any).$on('query', (e: any) => {
  logger.debug('Database query', {
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
  });
});

(prisma as any).$on('error', (e: any) => {
  logger.error('Database error', { error: e });
});

(prisma as any).$on('warn', (e: any) => {
  logger.warn('Database warning', { warning: e });
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed', { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Database disconnection failed', { error });
    throw error;
  }
}
