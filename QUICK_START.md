# Quick Start Guide

This guide will help you get the backend up and running in minutes.

## Prerequisites

Make sure you have installed:
- Node.js 20 LTS
- pnpm (or npm)
- Docker and Docker Compose

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd backend
pnpm install
```

### 2. Start Docker Services

```bash
cd docker
docker-compose up -d
cd ..
```

This starts PostgreSQL, Redis, and MinIO.

### 3. Set Up Database

```bash
# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed database with demo data (optional)
pnpm prisma:seed
```

### 4. Start Development Server

```bash
pnpm start:dev
```

## Access the Application

- **API:** http://localhost:3001/api
- **Swagger Docs:** http://localhost:3001/api/docs
- **Prisma Studio:** Run `pnpm prisma studio` (opens at http://localhost:5555)

## Demo Credentials

If you ran the seed command, you can use:

- **Email:** demo@example.com
- **Password:** password123
- **Demo Store:** http://localhost:3000/demo-store (once frontend is set up)

## Test the API

### 1. Register a New User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` from the response.

### 3. Get User Profile

```bash
curl http://localhost:3001/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Create a Store

```bash
curl -X POST http://localhost:3001/api/stores \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Store",
    "description": "My awesome store",
    "whatsappNumbers": ["+1234567890"],
    "instagramHandle": "@mystore"
  }'
```

## Environment Variables

The project uses `.env.development` by default. Key variables:

- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - JWT signing secret
- `STORAGE_PROVIDER` - `local` (default) or `s3`

## Useful Commands

```bash
# Development
pnpm start:dev          # Start with watch mode
pnpm start:debug        # Start with debugger

# Database
pnpm prisma studio      # Open Prisma Studio
pnpm prisma migrate dev # Create and apply migration
pnpm prisma:seed        # Seed database

# Testing
pnpm test              # Run unit tests
pnpm test:e2e          # Run e2e tests
pnpm test:cov          # Run with coverage

# Code Quality
pnpm lint              # Lint code
pnpm format            # Format code

# Build
pnpm build             # Build for production
pnpm start:prod        # Run production build
```

## Docker Services

```bash
# Start all services
cd docker && docker-compose up -d

# Stop all services
cd docker && docker-compose down

# View logs
cd docker && docker-compose logs -f

# Restart specific service
cd docker && docker-compose restart postgres
```

## Troubleshooting

### Port Already in Use

If port 3001 is already in use, change `PORT` in `.env.development`

### Database Connection Error

Make sure Docker services are running:
```bash
cd docker && docker-compose ps
```

### Prisma Client Not Found

Regenerate Prisma Client:
```bash
pnpm prisma generate
```

## Next Steps

1. Explore the API with Swagger at http://localhost:3001/api/docs
2. Check out the full README.md for architecture details
3. Start implementing Phase 2 modules (Products, Categories)

## Need Help?

- Check `README.md` for detailed documentation
- Review the code structure in `src/`
- Look at the Prisma schema in `prisma/schema.prisma`
