# Logging Architecture

This document describes the logging infrastructure for the Ladoo Business API, built on Winston for production-grade structured logging.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Log Levels](#log-levels)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Log Files](#log-files)
- [Best Practices](#best-practices)
- [Searching and Analysis](#searching-and-analysis)

## Overview

The application uses **Winston** as the logging framework with the following features:

- **Structured Logging**: JSON format in production, pretty-print in development
- **Multiple Transports**: Console, file, and daily rotation
- **Log Levels**: error, warn, info, http, debug
- **Request Tracing**: Unique request IDs for correlation
- **Error Tracking**: Error IDs and contextual metadata
- **Log Rotation**: Automatic daily rotation with 14-day retention
- **Environment-Based**: Different configurations for dev/prod/test

## Architecture

### Flow Diagram

```
HTTP Request
    ↓
Request Logger (generates request ID)
    ↓
Application Routes & Controllers
    ↓
Service Layer (logs operations)
    ↓
Response Logger (logs response with duration)
    ↓
HTTP Response

Errors at any stage → Error Handler → Structured Error Log
```

### Components

1. **Logger Configuration** (`src/config/logger.ts`)
   - Winston logger initialization
   - Transport configuration
   - Format definitions
   - Utility functions

2. **HTTP Logging Middleware** (`src/middleware/logger.ts`)
   - Request logger (generates request ID)
   - Response logger (tracks duration and status)

3. **Error Handler Enhancement** (`src/middleware/errorHandler.ts`)
   - Structured error logging
   - Error ID generation
   - Context capture

## Log Levels

The application uses five log levels in order of severity:

| Level | When to Use | Examples |
|-------|-------------|----------|
| **error** (0) | Application errors, exceptions, critical failures | Database connection failed, payment processing error, uncaught exceptions |
| **warn** (1) | Warning conditions, operational errors | Invalid authentication attempt, deprecated API usage, payment failed |
| **info** (2) | General informational messages | Server started, user registered, order created |
| **http** (3) | HTTP request/response logs | Incoming request, outgoing response, API calls |
| **debug** (4) | Detailed debugging information | Database queries, internal state, variable values |

### Environment Defaults

- **Development**: `debug` (all logs)
- **Production**: `info` (info and above)
- **Test**: `error` (minimal logging)

Override with `LOG_LEVEL` environment variable.

## Configuration

### Environment Variables

```env
# Optional log level override (error, warn, info, http, debug)
LOG_LEVEL=info

# Enable/disable file logging (default: true)
LOG_FILE_ENABLED=true

# Enable/disable console logging (default: true)
LOG_CONSOLE_ENABLED=true

# Node environment
NODE_ENV=production
```

### Transport Configuration

#### Console Transport
- **Development**: Colorized, pretty-printed with metadata
- **Production**: Warn level and above only
- **Format**: `[timestamp] level: message {metadata}`

#### File Transports
- **Error Log**: `logs/error.log` (max 5MB, 5 files)
- **Combined Log**: `logs/combined-%DATE%.log` (daily rotation)
- **Error Rotation**: `logs/error-%DATE%.log` (daily rotation)
- **Exceptions**: `logs/exceptions.log`
- **Rejections**: `logs/rejections.log`

#### Rotation Policy
- **Pattern**: Daily (`YYYY-MM-DD`)
- **Max Size**: 20MB per file
- **Max Files**: 14 days
- **Compression**: Gzipped after rotation

## Usage Examples

### Basic Logging

```typescript
import logger from '../config/logger';

// Info log
logger.info('User logged in successfully', { userId: user.id, email: user.email });

// Warning log
logger.warn('API rate limit approaching', { userId, requestCount: 95, limit: 100 });

// Error log
logger.error('Database query failed', { 
  error: error.message, 
  query: 'SELECT * FROM users',
  userId 
});

// Debug log (only in development)
logger.debug('Processing payment', { orderId, amount, paymentMethod });
```

### Logging in Services

```typescript
import logger, { createChildLogger } from '../config/logger';

export class OrderService {
  private logger = createChildLogger({ service: 'OrderService' });

  async createOrder(userId: string, data: CreateOrderDTO) {
    this.logger.info('Creating order', { userId, addressId: data.addressId });
    
    try {
      const order = await prisma.order.create({ data });
      this.logger.info('Order created successfully', { 
        orderId: order.id, 
        userId,
        totalAmount: order.totalAmount 
      });
      return order;
    } catch (error) {
      this.logger.error('Order creation failed', { 
        error, 
        userId, 
        data 
      });
      throw error;
    }
  }
}
```

### Logging in Controllers

```typescript
import { Request, Response } from 'express';
import { logRequest } from '../config/logger';

export const getProducts = async (req: Request, res: Response) => {
  logRequest(req, 'Fetching products', { 
    filters: req.query,
    userId: req.user?.id 
  });
  
  const products = await productService.getAllProducts(req.query);
  
  res.json({ products });
};
```

### Error Logging

```typescript
import { logError } from '../config/logger';

try {
  await processPayment(orderId);
} catch (error) {
  logError(error as Error, req, { 
    orderId, 
    operation: 'processPayment',
    context: 'payment-controller' 
  });
  throw error;
}
```

### Performance Logging

```typescript
import { logPerformance } from '../config/logger';

const startTime = Date.now();
const result = await expensiveOperation();
const duration = Date.now() - startTime;

logPerformance('expensiveOperation', duration, { 
  recordsProcessed: result.count,
  cacheHit: false 
});
```

### Child Logger

```typescript
import { createChildLogger } from '../config/logger';

const paymentLogger = createChildLogger({ 
  service: 'PaymentService',
  version: '2.0',
  provider: 'Stripe'
});

paymentLogger.info('Payment intent created', { 
  amount, 
  currency: 'USD' 
});
```

## Log Files

### Directory Structure

```
logs/
├── combined-2026-01-15.log          # All logs from Jan 15
├── combined-2026-01-16.log          # All logs from Jan 16
├── combined-2026-01-17.log.gz       # Compressed older log
├── error-2026-01-15.log             # Errors only from Jan 15
├── error-2026-01-16.log             # Errors only from Jan 16
├── error.log                        # Current error log (max 5MB)
├── exceptions.log                   # Uncaught exceptions
└── rejections.log                   # Unhandled promise rejections
```

### Log Format

#### Production (JSON)
```json
{
  "timestamp": "2026-01-17 10:30:45",
  "level": "info",
  "message": "Order created successfully",
  "metadata": {
    "orderId": "order-123",
    "userId": "user-456",
    "totalAmount": "199.99",
    "requestId": "req-789"
  }
}
```

#### Development (Pretty Print)
```
[2026-01-17 10:30:45] info: Order created successfully {
  "orderId": "order-123",
  "userId": "user-456",
  "totalAmount": "199.99",
  "requestId": "req-789"
}
```

## Best Practices

### DO ✅

1. **Include Context**: Always add relevant metadata
   ```typescript
   logger.info('User action', { userId, action: 'purchase', amount });
   ```

2. **Use Appropriate Levels**: Choose the right severity
   - `error`: Something broke
   - `warn`: Something unexpected happened
   - `info`: Normal operations
   - `http`: API traffic
   - `debug`: Detailed diagnostic info

3. **Log Request/Response**: Use request ID for correlation
   ```typescript
   logger.http('API call', { requestId: req.id, method: req.method, url: req.url });
   ```

4. **Structure Data**: Use objects for metadata
   ```typescript
   logger.info('Payment processed', { 
     orderId, 
     amount, 
     paymentMethod,
     duration: '2.5s'
   });
   ```

5. **Log Errors Completely**: Include stack traces and context
   ```typescript
   logger.error('Operation failed', { 
     error: error.message,
     stack: error.stack,
     userId,
     operation: 'createOrder'
   });
   ```

### DON'T ❌

1. **Don't Log Sensitive Data**
   ```typescript
   // BAD
   logger.info('User login', { password: user.password });
   
   // GOOD
   logger.info('User login', { userId: user.id, email: user.email });
   ```

2. **Don't Log in Loops** (unless necessary)
   ```typescript
   // BAD
   items.forEach(item => logger.debug('Processing item', { item }));
   
   // GOOD
   logger.debug('Processing items', { count: items.length, items: items.slice(0, 5) });
   ```

3. **Don't Use String Concatenation**
   ```typescript
   // BAD
   logger.info(`User ${userId} created order ${orderId}`);
   
   // GOOD
   logger.info('Order created', { userId, orderId });
   ```

4. **Don't Log Redundantly**
   ```typescript
   // BAD - duplicate info
   logger.info('Starting operation');
   logger.info('Operation started');
   
   // GOOD
   logger.info('Operation started', { operation: 'dataSync' });
   ```

### Sensitive Data Handling

The error handler automatically redacts these fields:
- `password`
- `token`
- `refreshToken`
- `accessToken`
- `secret`

Always review logs to ensure no PII or credentials are exposed.

## Searching and Analysis

### Searching Logs

#### By Date
```bash
cat logs/combined-2026-01-17.log | grep "Order created"
```

#### By Request ID
```bash
grep -r "req-789" logs/
```

#### By User ID
```bash
cat logs/combined-*.log | grep "userId.*user-456"
```

#### By Error Level
```bash
cat logs/error-2026-01-17.log | jq '.message, .metadata'
```

### Log Analysis Tools

**Recommended Tools:**
- **jq**: JSON query for structured logs
- **grep**: Text search
- **awk**: Pattern processing
- **ELK Stack**: Elasticsearch, Logstash, Kibana (for production)
- **Splunk**: Enterprise log management
- **Datadog**: APM with log correlation

### Example Queries

**Find all errors for a user:**
```bash
jq 'select(.metadata.userId == "user-456" and .level == "error")' logs/combined-2026-01-17.log
```

**Count requests by status code:**
```bash
cat logs/combined-2026-01-17.log | jq -r '.metadata.statusCode' | sort | uniq -c
```

**Average response time:**
```bash
cat logs/combined-2026-01-17.log | jq -r '.metadata.duration' | sed 's/ms//' | awk '{s+=$1; n++} END {print s/n "ms"}'
```

## Troubleshooting

### Logs Not Appearing

1. Check `LOG_FILE_ENABLED` environment variable
2. Verify `logs/` directory has write permissions
3. Check disk space availability
4. Verify log level allows your messages

### Log Files Too Large

1. Reduce retention period in `logger.ts`
2. Lower log level in production
3. Implement log streaming to external service
4. Increase rotation frequency

### Performance Impact

- File I/O is asynchronous (non-blocking)
- Console logging can be disabled in production
- Debug logs are automatically excluded in production
- Consider external log aggregation for high-traffic apps

## Testing

Run the logging test suite:

```bash
npm run test:logs
```

This will:
- Test all log levels
- Verify file creation
- Check error handling
- Validate metadata structure
- Test child logger functionality

## Migration from Console

All `console.log` statements have been replaced with Winston:

```typescript
// Before
console.log('Server started on port 3000');
console.error('Database connection failed:', error);

// After
logger.info('Server started', { port: 3000 });
logger.error('Database connection failed', { error });
```

## Support

For issues or questions about logging:
1. Check this documentation
2. Review Winston documentation: https://github.com/winstonjs/winston
3. Check application logs for configuration errors
4. Contact DevOps team for log aggregation setup
