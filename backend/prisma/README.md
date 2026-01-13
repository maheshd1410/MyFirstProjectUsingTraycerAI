# Prisma ORM Setup Guide

This guide documents the Prisma ORM setup for the Ladoo Business backend.

## Overview

Prisma is an open-source ORM that simplifies database access with type-safe generated client code. We use PostgreSQL as the primary database.

## Database Schema

The schema includes the following key entities:

- **User** — Customer and admin accounts with authentication
- **Address** — User delivery addresses with default address support
- **Category** — Product categories for organization
- **Product** — Inventory items with pricing and stock management
- **Cart** — Shopping cart with cart items
- **Order** — Customer orders with order items and payment tracking
- **Payment** — Payment records linked to orders via Stripe
- **Review** — Product reviews with moderation workflow
- **Notification** — Push notifications and in-app messages

### Key Relationships

- One User has many Addresses, Orders, Reviews, and Notifications
- One Order has many OrderItems and one Payment
- One Product has many OrderItems, Reviews, and CartItems
- One Cart has many CartItems (one-to-one with User)

## Common Commands

### Initialize Prisma

```bash
npx prisma init
```

### Generate Prisma Client

```bash
npx prisma generate
```

Generates TypeScript client and types in `node_modules/@prisma/client`.

### Run Migrations

Create and apply a new migration:

```bash
npx prisma migrate dev --name <migration-name>
```

Example: `npx prisma migrate dev --name init` creates initial schema migration.

### Reset Database

⚠️ **Warning**: This deletes all data!

```bash
npx prisma migrate reset
```

This command:
1. Drops the database
2. Recreates it
3. Applies all migrations
4. Runs seed script (if configured)

### Seed Database

Add initial data:

```bash
npx prisma db seed
```

This runs the script defined in `prisma/seed.ts` and `package.json` (`prisma.seed` field).

### Open Prisma Studio

Visual database manager at `http://localhost:5555`:

```bash
npm run prisma:studio
```

Or use shorthand:

```bash
npx prisma studio
```

## Environment Setup

1. Create `.env` file from `.env.example`:

```powershell
cp .env.example .env
```

2. Set `DATABASE_URL` with PostgreSQL connection string:

```
postgresql://username:password@localhost:5432/ladoo_business
```

### PostgreSQL Setup (macOS/Linux)

```bash
# Install PostgreSQL via Homebrew
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create a new database
createdb ladoo_business
```

### PostgreSQL Setup (Windows)

1. Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer and follow setup wizard
3. Note the superuser password
4. Use pgAdmin or psql to create database:

```powershell
createdb -U postgres ladoo_business
```

### PostgreSQL Setup (Docker)

```bash
docker run --name postgres-ladoo -e POSTGRES_PASSWORD=password -e POSTGRES_DB=ladoo_business -p 5432:5432 -d postgres:15
```

## Testing Database Connection

Run the test script:

```bash
npm run test:db
```

This script:
- Connects to the database
- Executes a raw query
- Creates and deletes a test user
- Logs success/error messages

## Backup & Restore

### Backup Database

```bash
pg_dump -U username ladoo_business > backup.sql
```

### Restore Database

```bash
psql -U username ladoo_business < backup.sql
```

## Best Practices

1. **Always run migrations before deploying** — Ensures schema consistency
2. **Review migrations before committing** — Check generated SQL in `prisma/migrations/`
3. **Use transactions** — Wrap multiple operations with `prisma.$transaction`
4. **Avoid `@skipLibCheck`** — Use proper typing to catch errors early
5. **Keep `.env` secure** — Never commit environment variables
6. **Test seed data locally** — Verify seed script before deployment

## Troubleshooting

### Migration Fails

1. Check database connection: `npm run test:db`
2. Review migration file in `prisma/migrations/`
3. Use `npx prisma migrate resolve` to mark migration as applied
4. Use `npx prisma migrate reset` to restart (loses data)

### Connection Refused

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` format and credentials
3. Ensure database exists
4. Test connection: `psql -U username -d ladoo_business`

### Type Generation Issues

1. Delete `node_modules/.prisma` directory
2. Run `npm install` and `npx prisma generate`
3. Restart TypeScript server in IDE

## References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Schema Reference](https://www.prisma.io/docs/concepts/components/prisma-schema)
- [Prisma Client API](https://www.prisma.io/docs/concepts/components/prisma-client)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
