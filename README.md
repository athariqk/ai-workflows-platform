# AI Workflows Platform

A visual workflow builder for creating and executing AI agent workflows as directed acyclic graphs with asynchronous execution via Redis queues.

**NOTE**: Currently only supports sequential agents.

## Architecture

**Monorepo/Workspaces Structure** (TurboRepo):

- **Backend**: Express.js + Prisma + PostgreSQL + Redis
- **Frontend**: React + TanStack Router + React Flow + Material-UI

Explanations/documentations of the design decisions I took for this project (include ERD) can be viewed in [this section](docs/DESIGN_DECISIONS.md).

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

1. **API** → `POST /v1/runner/run` with `workflow_id` and `job_id`
2. **Queue** → Job created in Redis via `workflowQueue.createJob()`
3. **Worker** → Background worker processes job via `startWorker()`
4. **Engine** → Builds execution chain from DB graph (validates single start node, no cycles)
5. **Steps** → Sequential execution of node types (each extends abstract `Step` class)
6. **Progress** → Real-time SSE updates to frontend via `/v1/runner/run-progress`

### Real-Time Progress Tracking

**Server-Sent Events (SSE) Pattern:**

- Backend: `workflowQueue.on("job progress")` → streams updates via EventSource
- Frontend: `useWorkflowProgress` hook for single workflow (builder page)
- Frontend: `useWorkflowsProgress` hook for multiple workflows (dashboard)

**Critical Pattern - useRef for Stable EventSource:**

```typescript
const onProgressRef = useRef(onProgressCallback);
useEffect(() => {
  onProgressRef.current = onProgressCallback; // Update ref, not dependency
}, [onProgressCallback]);

useEffect(() => {
  const eventSource = new EventSource(url);
  eventSource.onmessage = (event) => {
    onProgressRef.current?.(workflowId, status); // Use ref value
  };
  return () => eventSource.close(); // Cleanup
}, []); // Empty deps - runs once, no reconnections
```

### Node Configuration Pattern

**Pass-Through Architecture:**

```typescript
// Database workflow_node.config (JSONB) flows directly to ReactFlow node.data
const reactFlowNode = {
  id: dbNode.id,
  type: "agentNode",
  position: dbConfig.position,
  data: dbConfig, // Single source of truth
};

// Updates just spread existing config
const updatedConfig = { ...node.data, ...updates };
```

### Path Imports (Backend)

```typescript
import { prisma } from "@/lib/prisma";
import uuidv7 from "@/lib/uuid-v7"; // Time-sortable UUIDs
```

### Error Handling

```typescript
import { BadRequest, NotFound, Forbidden } from "@/lib/http-error";

throw BadRequest("workflow_id is required");
throw NotFound("Workflow not found");
throw Forbidden("api key required");
```

All HTTP errors caught by Express middleware and returned as consistent JSON responses.

## Tech Stack

**Backend:**

- Express.js 5
- Prisma ORM 7.0.1 (custom output: `src/generated/prisma`)
- PostgreSQL 15
- Redis 7 + bee-queue
- TypeScript 5.9.3

**Frontend:**

- React 19.2.0
- TanStack Router 1.x (file-based routing)
- React Flow 12.9.3 (visual workflow builder)
- Material-UI 6.x
- Tailwind CSS v4
- Vite 7.1.7
- TypeScript 5.9.3

**Real-Time:**

- Server-Sent Events (EventSource) for workflow progress tracking
- Redis pub/sub for queue progress updates

**DevOps:**

- Docker + Docker Compose
- Vitest (separate unit + integration test projects)
- ESLint v9 (flat config)
- GitHub Actions CI/CD

## License

ISC

## Author

Ahmad Ghalib

## 🔗 Links

- [Prisma Documentation](https://www.prisma.io/docs)
- [TanStack Router](https://tanstack.com/router)
- [React Flow](https://reactflow.dev)
- [Docker Compose](https://docs.docker.com/compose/)
