# Database Setup Guide

Choose one of the following options to set up your PostgreSQL database:

## Option 1: Docker Compose (Recommended - Easiest)

**Prerequisites:** Docker Desktop installed and running

**Steps:**

1. Start PostgreSQL using Docker Compose:

```powershell
cd "c:\Users\Mahesh Dhuri\projects\MyFirstProjectUsingTraycerAI"
docker-compose up -d
```

2. Wait for the container to start (check health):

```powershell
docker-compose ps
```

3. The database will be available at:
   - **Host:** localhost
   - **Port:** 5432
   - **Username:** postgres
   - **Password:** password
   - **Database:** ladoo_business

4. Proceed to "Run Prisma Migration" section below

**Stop the database:**

```powershell
docker-compose down
```

**View logs:**

```powershell
docker-compose logs postgres
```

---

## Option 2: PostgreSQL Local Installation

**Prerequisites:** Windows

**Steps:**

1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)

2. Run the installer and during setup:
   - Choose a password for the `postgres` user (remember this!)
   - Use default port 5432
   - Install pgAdmin 4 (optional, useful for database management)

3. After installation, create the database:

```powershell
# Open PowerShell as Administrator
psql -U postgres -c "CREATE DATABASE ladoo_business;"
```

4. Update `backend/.env` with your PostgreSQL password:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ladoo_business
```

5. Proceed to "Run Prisma Migration" section below

---

## Option 3: Cloud Database (Supabase, Railway, or Neon)

### Supabase (PostgreSQL-as-a-Service)

1. Go to [supabase.com](https://supabase.com) and sign up (free tier available)

2. Create a new project:
   - Region: Choose closest to you
   - Database password: Set a strong password

3. Get your connection string:
   - In Supabase dashboard, go to **Settings > Database**
   - Copy the connection string (PostgreSQL URI)

4. Update `backend/.env`:

```
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
```

5. Proceed to "Run Prisma Migration" section below

### Railway (Docker-based)

1. Go to [railway.app](https://railway.app) and sign up

2. Create a new project with PostgreSQL

3. Get connection variables from the PostgreSQL plugin:
   - Copy **Database URL** or construct from individual variables

4. Update `backend/.env`:

```
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

5. Proceed to "Run Prisma Migration" section below

### Neon (Serverless PostgreSQL)

1. Go to [neon.tech](https://neon.tech) and sign up

2. Create a new project (free tier includes one project)

3. Get your connection string:
   - Copy the connection string from the **Connection String** section

4. Update `backend/.env`:

```
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]
```

5. Proceed to "Run Prisma Migration" section below

---

## Run Prisma Migration

Once your database is running and `DATABASE_URL` is set in `backend/.env`:

1. Generate Prisma Client:

```powershell
cd "c:\Users\Mahesh Dhuri\projects\MyFirstProjectUsingTraycerAI\backend"
npx prisma generate
```

2. Run the initial migration (creates all tables):

```powershell
npx prisma migrate dev --name init
```

   This will:
   - Create migration files in `prisma/migrations/`
   - Apply the schema to your database
   - Generate Prisma Client types

3. Verify the connection:

```powershell
npm run test:db
```

   If successful, you'll see:
   ```
   ✓ Raw query successful
   ✓ User created: [user-id]
   ✓ User retrieved: [email]
   ✓ Test user deleted
   ✓ All database tests passed!
   ```

---

## Seed Database (Optional)

Add initial data (admin user, categories, products):

```powershell
npx prisma db seed
```

View data in Prisma Studio:

```powershell
npm run prisma:studio
```

Opens visual database manager at `http://localhost:5555`

---

## Troubleshooting

### "Can't reach database server"

- **Docker option:** Run `docker-compose ps` to check if container is healthy
- **Local install:** Run `services.msc` and verify "postgresql-x64-15" service is running
- **Cloud option:** Check your connection string and firewall rules

### "Database does not exist"

- **Docker/Local:** Database should be auto-created, verify with `psql -U postgres -l`
- **Cloud:** Create the database via provider's dashboard

### "Password authentication failed"

- Check `DATABASE_URL` in `backend/.env` has correct password
- For Docker: password is `password` (in docker-compose.yml)
- For local: use the password you set during PostgreSQL installation

### "Port 5432 already in use"

```powershell
# Find process using port 5432
Get-NetTCPConnection -LocalPort 5432 | Select-Object OwningProcess
```

Either stop the conflicting service or change port in docker-compose.yml and `.env`

---

## Quick Reference

| Option | Setup Time | Cost | Recommendation |
|--------|-----------|------|-----------------|
| Docker Compose | 2 minutes | Free | ✅ **Best for local development** |
| Local Installation | 10 minutes | Free | Good for production-like environment |
| Supabase | 5 minutes | Free (5 projects) | Best for cloud deployment |
| Railway | 5 minutes | Free (limited) | Good for quick cloud setup |
| Neon | 5 minutes | Free (1 project) | Best for serverless deployment |

---

## Next Steps

After database is running and migration is complete:

1. Start the backend server:

```powershell
cd "c:\Users\Mahesh Dhuri\projects\MyFirstProjectUsingTraycerAI\backend"
npm run dev
```

2. Test the health endpoint:

```powershell
curl http://localhost:3000/health
```

3. Build the mobile app:

```powershell
cd "c:\Users\Mahesh Dhuri\projects\MyFirstProjectUsingTraycerAI\mobile-app"
npm start
```
