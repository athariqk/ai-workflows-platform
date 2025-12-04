# AI Workflows Platform

A visual workflow builder for creating and executing AI agent workflows as directed acyclic graphs with asynchronous execution via Redis queues.

**NOTE**: Currently only supports sequential agents.

## Architecture

**Monorepo/Workspaces Structure** (TurboRepo):
- **Backend**: Express.js + Prisma + PostgreSQL + Redis
- **Frontend**: React + TanStack Router + React Flow + Material-UI

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development servers (backend + frontend + Docker services)
npm run dev

# Or run individually
npm run dev:be  # Backend only (port 3000)
npm run dev:fe  # Frontend only (port 4000)
```

The backend automatically starts PostgreSQL and Redis via Docker Compose.

**Access:**
- Frontend: http://localhost:4000
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/v1/api-docs

### Environment Setup

Backend (`packages/backend/.env`):
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/postgres
REDIS_HOST=localhost
REDIS_PORT=6379
GEMINI_API_KEY=your-key-here
FRONTEND_URL=http://localhost:4000
```

Frontend (`packages/frontend/.env`):
```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_API_KEY=your-api-key-here
```

## Testing

```bash
# Run all tests
npm run test

# Backend tests
npm run test:unit --workspace=awp-backend         # Unit tests only
npm run test:integration --workspace=awp-backend  # Integration tests (starts Docker)

# Frontend tests
npm run test --workspace=awp-frontend
```

## Production Deployment

### Docker Compose (Recommended)

1. **Configure environment:**
```bash
cp .env.production.example .env.production
# Edit .env.production with your production values
```

2. **Deploy:**
```bash
bash deploy.sh
```

Or manually:
```bash
docker-compose build
docker-compose up -d
```

3. **Verify deployment:**
```bash
docker-compose ps
docker-compose logs -f
```

**Access:**
- Frontend: http://localhost:80
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

### Docker Services

The production stack includes:
- **postgres** - PostgreSQL 15 with persistent volumes
- **redis** - Redis 7 with AOF persistence
- **backend** - Node.js API server with workflow engine
- **frontend** - Nginx serving static React app

### Database Migrations

The application uses Prisma for database management:

```bash
# Development (with prompts)
cd packages/backend
npx prisma migrate dev --name your_migration_name

# Production (automated)
docker-compose exec backend node scripts/migrate-deploy.js
```

### Monitoring

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Check service health
curl http://localhost:3000/health
curl http://localhost:80/health
```

## Development Workflows

### Adding a Prisma Schema Change

1. Edit `packages/backend/prisma/schema.prisma`
2. Generate client: `npx prisma generate`
3. Push to dev DB: `npx prisma db push` (or create migration for production)
4. Restart backend

### Creating New Workflow Node Types

1. Create step class in `packages/backend/src/workflow-runner/steps/`
2. Extend abstract `Step` class with `execute()` method
3. Add enum value to `workflow_node_type` in Prisma schema
4. Update engine.ts switch statement
5. Create React component in `packages/frontend/src/components/nodes/`

### API Development

- All endpoints require `api_key` query parameter
- Use error factories from `@/lib/http-error` (BadRequest, NotFound, etc.)
- Document with JSDoc for Swagger auto-generation
- Use `@/` path alias for imports

## Key Architecture Patterns

### Workflow Execution Flow

1. **API** → `POST /v1/runner/run` with `workflow_id`
2. **Queue** → Job created in Redis via `workflowQueue.createJob()`
3. **Worker** → Background worker processes job via `startWorker()`
4. **Engine** → Builds execution chain from DB graph
5. **Steps** → Sequential execution of node types
6. **Progress** → Real-time SSE updates to frontend

### Path Imports (Backend)

```typescript
import { prisma } from "@/lib/prisma"
import uuidv7 from "@/lib/uuid-v7"
```

### Error Handling

```typescript
import { BadRequest, NotFound } from "@/lib/http-error"

throw BadRequest("workflow_id is required")
throw NotFound("Workflow not found")
```

## Tech Stack

**Backend:**
- Express.js 5
- Prisma ORM (custom output: `src/generated/prisma`)
- PostgreSQL 15
- Redis + bee-queue
- TypeScript

**Frontend:**
- React 19
- TanStack Router (file-based routing)
- React Flow (visual workflow builder)
- Material-UI
- Tailwind CSS v4
- TypeScript

**DevOps:**
- Docker + Docker Compose
- GitHub Actions CI/CD
- Vitest (unit + integration tests)
- ESLint v9

## 🤝 Contributing

1. Create feature branch from `develop`
2. Make changes with tests
3. Run linter: `npm run lint:fix`
4. Ensure tests pass: `npm run test`
5. Submit PR to `develop`

CI/CD pipeline runs on all PRs:
- Linting
- Unit tests
- Integration tests
- Build verification

## 📝 License

ISC

## 👤 Author

Ahmad Ghalib

## 🔗 Links

- [Prisma Documentation](https://www.prisma.io/docs)
- [TanStack Router](https://tanstack.com/router)
- [React Flow](https://reactflow.dev)
- [Docker Compose](https://docs.docker.com/compose/)
