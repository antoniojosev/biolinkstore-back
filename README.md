# Catalogo Backend

Multi-tenant SaaS platform that allows Instagram stores to create web catalogs where customers can view products, build a cart, and send orders via WhatsApp.

## Tech Stack

- **Runtime:** Node.js 20 LTS
- **Framework:** NestJS 10.x
- **Language:** TypeScript 5.x (strict mode)
- **ORM:** Prisma 5.x
- **Database:** PostgreSQL 16
- **Cache:** Redis 7.x
- **Validation:** class-validator + class-transformer
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest

## Architecture

This project follows **Clean Architecture / Hexagonal Architecture** principles with clear separation of concerns:

```
src/
├── common/              # Shared utilities, decorators, guards, filters
├── config/              # Configuration files
├── infrastructure/      # External dependencies (Database, Cache, Storage)
└── modules/            # Business modules
    └── [module]/
        ├── domain/          # Entities, repository interfaces, domain services
        ├── application/     # Use cases, DTOs, mappers
        ├── infrastructure/  # Repository implementations, external services
        └── presentation/    # Controllers
```

## Getting Started

### Prerequisites

- Node.js 20 LTS
- pnpm (recommended) or npm
- Docker & Docker Compose (for databases)

### Installation

1. **Clone the repository**

```bash
cd backend
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.development
```

Edit `.env.development` with your configuration.

4. **Start Docker services**

```bash
cd docker
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO on ports 9000 (API) and 9001 (Console)

5. **Run database migrations**

```bash
pnpm prisma migrate dev
```

6. **Generate Prisma Client**

```bash
pnpm prisma generate
```

7. **Seed the database (optional)**

```bash
pnpm prisma:seed
```

This creates a demo user and store:
- Email: `demo@example.com`
- Password: `password123`
- Store slug: `demo-store`

### Development

```bash
# Start development server
pnpm start:dev

# Build for production
pnpm build

# Run production build
pnpm start:prod
```

The API will be available at:
- **API:** http://localhost:3001/api
- **Swagger Docs:** http://localhost:3001/api/docs

### Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## Database

### Migrations

```bash
# Create a new migration
pnpm prisma migrate dev --name your_migration_name

# Apply migrations
pnpm prisma migrate deploy

# Reset database (development only)
pnpm prisma migrate reset
```

### Prisma Studio

```bash
pnpm prisma studio
```

Opens Prisma Studio at http://localhost:5555

## Project Structure

### Modules (Phase 1 - Core)

- **Auth** - User authentication (JWT, OAuth)
- **Users** - User management
- **Stores** - Store management with multi-tenancy

### Modules (Phase 2 - Products)

- **Products** - Product management with variants
- **Categories** - Product categories

### Modules (Phase 3 - Storefront)

- **Public** - Public storefront endpoints
- **Orders** - Order intents and WhatsApp integration

### Modules (Phase 4 - Advanced)

- **Analytics** - Store analytics and visitor tracking
- **Subscriptions** - Stripe subscription management
- **Uploads** - File upload handling

## API Documentation

Swagger documentation is available at `/api/docs` in development mode.

Key endpoints:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/users/me` - Get current user
- `POST /api/stores` - Create store
- `GET /api/stores` - List user's stores

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `STORAGE_PROVIDER` - `local` or `s3`

## Clean Architecture Patterns

### Repository Pattern

Repositories are defined as interfaces in the domain layer and implemented in the infrastructure layer:

```typescript
// Domain layer - Interface
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}

// Infrastructure layer - Implementation
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  // Implementation using Prisma
}

// Module - Dependency Injection
{
  provide: INJECTION_TOKENS.USER_REPOSITORY,
  useClass: PrismaUserRepository,
}
```

### Use Cases

Business logic is encapsulated in use cases:

```typescript
@Injectable()
export class CreateStoreUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
  ) {}

  async execute(userId: string, dto: CreateStoreDto) {
    // Business logic here
  }
}
```

## Docker

### Development

```bash
cd docker
docker-compose up -d
```

### Production

```bash
docker build -f docker/Dockerfile -t catalogo-api .
docker run -p 3001:3001 catalogo-api
```

## Contributing

1. Follow the existing architecture patterns
2. Write tests for new features
3. Update documentation
4. Follow TypeScript strict mode guidelines

## License

UNLICENSED - Private project
