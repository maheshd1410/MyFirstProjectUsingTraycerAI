import logger, { createChildLogger, logPerformance } from '../config/logger';

/**
 * Test script for logging functionality
 * Run with: npm run test:logs
 */

async function testLogging() {
  logger.info('=== Testing Winston Logger ===');

  // Test all log levels
  logger.info('1. Testing all log levels:');
  logger.error('This is an ERROR message', { errorCode: 'TEST_001', userId: 'user-123' });
  logger.warn('This is a WARN message', { action: 'deprecated_api_used' });
  logger.info('This is an INFO message', { event: 'user_logged_in', userId: 'user-123' });
  logger.http('This is an HTTP message', { method: 'GET', url: '/api/products', statusCode: 200 });
  logger.debug('This is a DEBUG message', { debugInfo: { foo: 'bar', nested: { value: 42 } } });

  logger.info('2. Testing error with stack trace:');
  try {
    throw new Error('This is a test error with stack trace');
  } catch (error) {
    logger.error('Caught an error', { error, context: 'test-script' });
  }

  logger.info('3. Testing child logger:');
  const serviceLogger = createChildLogger({ service: 'TestService', version: '1.0.0' });
  serviceLogger.info('Message from child logger', { operation: 'test' });

  logger.info('4. Testing performance logging:');
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, 150)); // Simulate operation
  const duration = Date.now() - startTime;
  logPerformance('test-operation', duration, { result: 'success' });

  logger.info('5. Testing structured metadata:');
  logger.info('Complex operation completed', {
    operation: 'data-processing',
    recordsProcessed: 1500,
    duration: '2.5s',
    status: 'success',
    metadata: {
      source: 'test-script',
      environment: process.env.NODE_ENV || 'development',
    },
  });

  logger.info('6. Testing log levels by environment:');
  logger.info('Environment details', {
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'default',
  });

  logger.info('=== Logging Test Complete ===');
  logger.info('Check the following locations for log files:');
  logger.info('Log file locations', {
    combined: 'logs/combined-YYYY-MM-DD.log (all logs)',
    error: 'logs/error-YYYY-MM-DD.log (error logs only)',
    exceptions: 'logs/exceptions.log (uncaught exceptions)',
    rejections: 'logs/rejections.log (unhandled rejections)',
  });

  // Test uncaught exception handler (commented out to prevent process exit)
  // console.log('\n7. Testing uncaught exception handler (uncomment to test):');
  // throw new Error('Uncaught exception test');

  // Test unhandled rejection handler (commented out to prevent process exit)
  // console.log('\n8. Testing unhandled rejection handler (uncomment to test):');
  // Promise.reject(new Error('Unhandled rejection test'));
}

// Run tests
testLogging()
  .then(() => {
    logger.info('Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Test failed:', { error });
    process.exit(1);
  });
