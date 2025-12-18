# Deploying with Docker

## Prerequisites
- Docker
- Docker Compose

## Quick Start
Run the following from the root directory:

```bash
docker-compose up -d --build
```

This will start:
- **Frontend** on http://localhost:5173 (or 80 in prod setup)
- **Backend** on http://localhost:3001
- **Redis** (optional, if enabled) on port 6379

## Production Deployment

For production, verify:
1.  Passwords/Secrets in `.env` are secure.
2.  `NODE_ENV=production`.
3.  Bind mounts are replaced with volumes for persistence.

### Persistence
AdultEdu uses PostgreSQL. Ensure your `docker-compose.yml` includes a Postgres service (like `db`) and set `DATABASE_URL` for the backend.
