# Docker Usage

## Build the Image
```bash
cd backend
docker build -t ladoo-backend:latest .
```

## Run the Container Locally
```bash
docker run -d \
  --name ladoo-backend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DATABASE_URL="postgresql://user:pass@host.docker.internal:5432/ladoo" \
  -e REDIS_HOST=host.docker.internal \
  -e REDIS_PORT=6379 \
  -e JWT_SECRET="your-secret" \
  -e JWT_REFRESH_SECRET="your-refresh-secret" \
  -e STRIPE_SECRET_KEY="sk_test_..." \
  -e CLOUDINARY_CLOUD_NAME="your-cloud" \
  -e CLOUDINARY_API_KEY="your-key" \
  -e CLOUDINARY_API_SECRET="your-secret" \
  ladoo-backend:latest
```

Use `host.docker.internal` on Docker Desktop (Mac/Windows) to reach host services. On Linux, use `--network host` or Docker Compose networking.

## Verify Health
```bash
curl http://localhost:3000/health
```
Expected response:
```json
{
  "status": "ok",
  "message": "Ladoo Business API is running",
  "services": {
    "database": "connected",
    "redis": "connected"
  },
  "timestamp": "2024-01-24T10:30:00.000Z"
}
```

## View Logs
```bash
docker logs -f ladoo-backend
```

## Stop and Remove
```bash
docker stop ladoo-backend
docker rm ladoo-backend
```
