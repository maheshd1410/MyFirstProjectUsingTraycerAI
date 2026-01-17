# Backend Testing Infrastructure

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Specific Test File
```bash
# Integration test
npm run test:integration -- product.test.ts

# Unit test
npm run test:unit -- auth.service.test.ts
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

## Test Database Setup

Integration tests use a real PostgreSQL test database:

1. Configure `.env.test`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
```

2. Run migrations:
```bash
npx prisma migrate deploy
```

## Test Data Cleanup Strategy

- **Test Data Isolation**: Use `test-` prefix in emails
- **beforeEach Cleanup**: Call `clearDatabase()` to start fresh
- **afterAll Cleanup**: Disconnect from database
- **Foreign Key Handling**: Delete in correct order (children before parents)

## Troubleshooting

**Database Connection Issues**
- Ensure PostgreSQL is running
- Verify DATABASE_URL in `.env.test`

**Test Data Conflicts**
- Ensure `clearDatabase()` is called in `beforeEach`

**Authentication Failures**
- Verify token generation is correct

**Mock vs Real Database**
- Integration tests (in `integration/`) use real database
- Unit tests (in `services/`) use mocks
