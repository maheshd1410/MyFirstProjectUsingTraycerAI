import dotenv from 'dotenv';
import path from 'path';
import { clearTestCache } from './helpers/cache.helper';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock the database module only for unit tests (not integration tests)
// Integration tests are in __tests__/integration/ and should use real database
const testPath = expect.getState().testPath || '';
const isIntegrationTest = testPath.includes('integration');

if (!isIntegrationTest) {
  jest.mock('../src/config/database', () => {
    const { prismaMock } = require('./mocks/prisma.mock');
    return {
      prisma: prismaMock,
      connectDatabase: jest.fn().mockResolvedValue(undefined),
      disconnectDatabase: jest.fn().mockResolvedValue(undefined),
    };
  });
}

// Global test configuration
beforeAll(() => {
  // Any global setup before all tests
});

afterAll(() => {
  // Any global cleanup after all tests
});

// Clear cache before each test
beforeEach(async () => {
  if (isIntegrationTest) {
    await clearTestCache();
  }
});
