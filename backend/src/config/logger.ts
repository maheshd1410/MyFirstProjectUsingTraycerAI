import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const configuredLevel = process.env.LOG_LEVEL;
  
  if (configuredLevel) {
    return configuredLevel;
  }
  
  if (env === 'test') {
    return 'error';
  }
  
  return env === 'production' ? 'info' : 'debug';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'stack'] }),
  winston.format.splat(),
  process.env.NODE_ENV === 'production'
    ? winston.format.json()
    : winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info) => {
            const { timestamp, level, message, metadata, stack } = info;
            let log = `[${timestamp}] ${level}: ${message}`;
            
            // Add metadata if present
            if (metadata && Object.keys(metadata).length > 0) {
              log += ` ${JSON.stringify(metadata, null, 2)}`;
            }
            
            // Add stack trace if present
            if (stack) {
              log += `\n${stack}`;
            }
            
            return log;
          }
        )
      )
);

// Check if file logging is enabled
const fileLoggingEnabled = process.env.LOG_FILE_ENABLED !== 'false';
const consoleLoggingEnabled = process.env.LOG_CONSOLE_ENABLED !== 'false';

// Define transports
const transports: winston.transport[] = [];

// Console transport
if (consoleLoggingEnabled) {
  transports.push(
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'warn' : level(),
    })
  );
}

// File transports (only in non-test environments)
if (fileLoggingEnabled && process.env.NODE_ENV !== 'test') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Daily rotate file for all logs
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
      level: level(),
    })
  );

  // Daily rotate file for error logs
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
      level: 'error',
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exceptionHandlers: fileLoggingEnabled && process.env.NODE_ENV !== 'test'
    ? [
        new winston.transports.File({
          filename: path.join('logs', 'exceptions.log'),
        }),
      ]
    : [],
  rejectionHandlers: fileLoggingEnabled && process.env.NODE_ENV !== 'test'
    ? [
        new winston.transports.File({
          filename: path.join('logs', 'rejections.log'),
        }),
      ]
    : [],
  exitOnError: false,
});

// Utility function to create a child logger with default metadata
export const createChildLogger = (defaultMetadata: Record<string, any>) => {
  return logger.child(defaultMetadata);
};

// Utility function to log with request context
export const logRequest = (
  req: any,
  message: string,
  metadata?: Record<string, any>
) => {
  logger.http(message, {
    requestId: req.id,
    userId: req.user?.id,
    method: req.method,
    url: req.originalUrl,
    ...metadata,
  });
};

// Utility function to log errors with full context
export const logError = (
  error: Error,
  req?: any,
  metadata?: Record<string, any>
) => {
  const errorContext: Record<string, any> = {
    message: error.message,
    stack: error.stack,
    ...metadata,
  };

  if (req) {
    errorContext.requestId = req.id;
    errorContext.userId = req.user?.id;
    errorContext.method = req.method;
    errorContext.url = req.originalUrl;
    errorContext.ip = req.ip;
    errorContext.userAgent = req.get('user-agent');
  }

  logger.error('Application error', errorContext);
};

// Utility function to log performance metrics
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) => {
  logger.info(`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...metadata,
  });
};

export default logger;
