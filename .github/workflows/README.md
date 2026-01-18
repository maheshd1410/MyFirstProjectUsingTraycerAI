# CI/CD Workflows

## Overview
This repository uses GitHub Actions for continuous integration and deployment.

## Workflows

### Backend CI (`backend-ci.yml`)
Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**
- Lint and format checking
- TypeScript type checking
- Unit tests with PostgreSQL and Redis
- Integration tests
- Test coverage reporting to Codecov
- Prisma migration validation
- Security audit with npm audit

**Required Secrets:**
- `CODECOV_TOKEN`

### Mobile CI (`mobile-ci.yml`)
Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**
- Lint and format checking
- TypeScript type checking
- Android build validation
- iOS build validation
- Security audit

### Staging Deployment (`deploy-staging.yml`)
Runs on push to `develop` branch or manual trigger.

**Jobs:**
- Deploy backend to staging server
- Publish mobile app update via Expo

**Required Secrets:**
- All backend environment variables
- `EXPO_TOKEN`
- `STAGING_SERVER_HOST`
- `STAGING_SERVER_USER`
- `STAGING_SSH_KEY`

## Running Workflows Locally

### Backend Tests
```bash
cd backend
npm install
npm run test
npm run test:coverage
```

### Mobile Type Check
```bash
cd mobile-app
npm install
npm run type-check
npm run lint
```

## Troubleshooting

### Failed Tests
- Check test logs in GitHub Actions
- Run tests locally to reproduce
- Ensure database migrations are up to date

### Failed Builds
- Verify all dependencies are installed
- Check for TypeScript errors
- Ensure environment variables are set

### Deployment Issues
- Verify secrets are configured correctly
- Check server connectivity
- Review deployment logs
