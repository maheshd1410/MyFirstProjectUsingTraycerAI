# backend (Express + TypeScript)

This folder contains the backend API server for Ladoo Business.

## Setup

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies:

```powershell
cd backend
npm install
```

3. Start development server:

```powershell
npm run dev
```

## Testing

### Quick Start

Run all tests:
```powershell
npm test
```

Run unit tests only:
```powershell
npm run test:unit
```

Run integration tests only:
```powershell
npm run test:integration
```

Run tests in watch mode (for development):
```powershell
npm run test:watch
```

Generate coverage report:
```powershell
npm run test:coverage
```

### Test Database Setup

For integration tests, create a separate test database:

1. Copy `.env.test` configuration:
```powershell
# Create test database
createdb myapp_test

# Run migrations on test database
$env:DATABASE_URL="postgresql://user:password@localhost:5432/myapp_test"
npx prisma migrate deploy
```

2. Configure `.env.test` with your test database credentials.

### Coverage Requirements

- Services: 80%+ coverage on business logic
- Overall: 70%+ coverage target

For detailed testing documentation, see [`__tests__/README.md`](__tests__/README.md).

## Structure

See `src/` for `config/`, `middleware/`, `routes/`, `services/`, and `controllers/`.
