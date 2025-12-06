# AI Workflow Platform - Copilot Instructions

## Architecture Overview

This is a **TurboRepo monorepo** with backend (Express + Prisma) and frontend (React + TanStack Router) packages. The platform enables creating AI agent workflows as directed acyclic graphs that execute asynchronously via Redis queues.

### Core Components

- **Backend** (`packages/backend`): REST API with workflow execution engine
- **Frontend** (`packages/frontend`): React Flow-based visual workflow builder
- **Database**: PostgreSQL with Prisma ORM (custom output to `src/generated/prisma`)
- **Queue System**: Redis with bee-queue for async workflow execution
- **Testing**: Vitest with separate unit/integration projects

## Critical Patterns

### Path Imports

Backend uses `@/` alias for `./src/*` (configured in `tsconfig.json`). Always use:

```typescript
import { prisma } from "@/lib/prisma";
import uuidv7 from "@/lib/uuid-v7";
```

### UUID Generation

Use custom `uuidv7()` from `@/lib/uuid-v7` for time-sortable IDs:

```typescript
const runId = uuidv7(); // Returns crypto.UUID type
```

### Error Handling

Use factory functions from `@/lib/http-error` for consistent HTTP errors:

```typescript
throw BadRequest("workflow_id is required");
throw NotFound("Workflow not found");
throw Forbidden("api key required");
```

Express error handler in `app.ts` catches `HttpError` instances and returns proper status codes.

### Prisma Configuration

- Schema in `packages/backend/prisma/schema.prisma`
- Generated client outputs to `src/generated/prisma` (not default `node_modules`)
- Uses PostgreSQL adapter: `@prisma/adapter-pg` with connection pooling
- After schema changes: `npx prisma generate` from backend directory

### Workflow Execution Flow

1. **API Request** → `POST /v1/runner/run` with `workflow_id` and `job_id`
2. **Queue Job** → Created in Redis via `workflowQueue.createJob()` (from `@/lib/queue`)
3. **Worker Processing** → Background worker started in `server.ts` via `startWorker()`
4. **Engine Execution** → `engine.ts` builds chain from DB graph and executes steps sequentially
5. **Step Pattern** → Each node type (AgentStep, TextInputStep) extends abstract `Step` class
6. **Progress Tracking** → Real-time updates via `job.reportProgress()`, SSE to frontend

### Workflow Data Model

```
workflow (id, name, description)
  ├── workflow_node (id, config JSONB)
  │   └── step_log (id, name, input, output, status, started_at, finished_at, error)
  ├── workflow_edge (source_node_id, target_node_id)
  └── run_log (id, job_id, status, started_at, finished_at, error)
```

**Key Schema Details**:

- `workflow_node.config`: JSONB storing node type, position, and type-specific data (agent, text_input)
- `step_log`: Tracks individual node executions with input/output snapshots (added Dec 2025)
- `run_log.job_id`: Links to Redis queue job for progress tracking

Graph must be linear (single start node, no branching yet). Engine builds execution chain by walking edges.

### Real-Time Progress Pattern (EventSource/SSE)

**Backend** (`/v1/runner/run-progress`):

```typescript
const progressHandler = (jobId, progress) => {
  res.write(`data: ${JSON.stringify({ jobId, progress })}\n\n`);
};
workflowQueue.on("job progress", progressHandler);

res.on("close", () => {
  workflowQueue.removeListener("job progress", progressHandler); // Critical: prevent memory leak
});
```

**Frontend** (useRef pattern to prevent EventSource reconnections):

```typescript
const onProgressRef = useRef(onProgressCallback);
const jobMapRef = useRef<Map<string, string>>(new Map());

useEffect(() => {
  onProgressRef.current = onProgressCallback; // Update ref, not deps
}, [onProgressCallback]);

useEffect(() => {
  const eventSource = new EventSource(url);
  eventSource.onmessage = (event) => {
    const { jobId, progress } = JSON.parse(event.data);
    const workflowProgress = progress.data; // Unwrap from {type, data} wrapper
    const workflowId = jobMapRef.current.get(jobId);
    onProgressRef.current?.(workflowId, workflowProgress);
  };
  return () => eventSource.close();
}, []); // Empty deps - runs once, stable connection
```

**Why useRef?** Callbacks in dependencies → effect re-runs → EventSource reopens → connection spam. Refs hold latest values without triggering re-runs.

### Node Config Pass-Through Pattern

**Database → ReactFlow** (single source of truth):

```typescript
// workflow_node.config (JSONB) flows directly to ReactFlow node.data
const reactFlowNode = {
  id: dbNode.id,
  type: getReactFlowNodeType(dbConfig.type), // "agentNode", "textInputNode"
  position: dbConfig.position,
  data: dbConfig, // Direct pass-through, no field extraction
};
```

**Updates preserve entire config**:

```typescript
// WorkflowCanvas.tsx - handleUpdateNode
const updatedConfig = { ...node.data, ...updates }; // Spread existing config
api.updateWorkflowNode(nodeId, { config: updatedConfig });
```

**Why?** Avoids sync bugs, no need to track which fields changed. Config is self-contained.

## Development Workflows

### Running the Application

```bash
# From repository root
npm run dev          # Run both frontend and backend
npm run dev:be       # Backend only (port 3000)
npm run dev:fe       # Frontend only (port 4000)
```

Backend dev script auto-starts Docker services (PostgreSQL + Redis) via `docker-compose.dev.yml`.

### Testing Strategy

Backend uses **separate Vitest projects**:

- **Unit tests**: `**/*.unit.test.ts` - fast, no external dependencies
- **Integration tests**: `**/*.int.test.ts` - uses real Dockerized PostgreSQL

```bash
npm run test              # Root: runs all packages
npm run test:unit         # Backend: unit tests only
npm run test:integration  # Backend: starts Docker, applies schema, runs integration tests
```

Integration tests use `scripts/run-int-tests.js` which:

1. Starts `docker-compose.test.yml` with PostgreSQL on port 5433
2. Waits for Postgres readiness
3. Applies schema with `prisma db push`
4. Runs integration tests with custom `DATABASE_URL`
5. Tears down containers

### API Authentication

All `/v1/*` endpoints require `api_key` query parameter (checked in `api/route.ts` middleware). Set `VITE_API_KEY` for frontend.

### Environment Variables

Backend requires (see `.env.example`):

```
DATABASE_URL=postgresql://user:password@localhost:5433/postgres
REDIS_HOST=localhost
REDIS_PORT=6379
GEMINI_API_KEY=your_key_here  # Currently only Gemini 2.5 Flash supported
FRONTEND_URL=http://localhost:4000
```

## Frontend Specifics

### Routing

Uses **TanStack Router** with file-based routing in `src/routes/`:

- Routes auto-generated to `routeTree.gen.ts`
- Layout in `__root.tsx`
- Search params validated with `validateSearch` (e.g., `workflowId` in workflow-builder)

### Key Libraries

- **@xyflow/react**: Visual workflow canvas (ReactFlow)
- **@mui/material**: UI components
- **Tailwind CSS v4**: Styling via Vite plugin
- **TanStack DevTools**: Router + general devtools (bottom-right panel)

### Workflow Builder Pattern

See `packages/frontend/src/routes/workflow-builder/`:

**Custom Hooks** (separation of concerns):

- `useWorkflowData`: Fetch workflow + agents (read-only)
- `useWorkflowNodes`: Node CRUD + ReactFlow state sync
- `useWorkflowEdges`: Edge CRUD + cascade delete handling
- `useReactFlowHandlers`: Drag-and-drop, canvas interactions
- `useWorkflowProgress`: Real-time SSE progress updates (single workflow)
- `useWorkflowsProgress`: Multi-workflow progress tracking (dashboard)

**Node Components** (`components/nodes/`):

- `AgentNode`, `TextInputNode` - extend `WorkflowNode` wrapper
- All fields optional with fallbacks (handle null config gracefully)
- Use `node.data` directly (config pass-through pattern)

**Real-Time Execution**:

- EventSource connects to `/v1/runner/run-progress`
- Progress updates node status in ReactFlow canvas
- Status indicators: idle → running → completed/failed

## Code Conventions

### Async/Await

Always use async/await (never callbacks). Proper error handling with try/catch.

### Type Safety

- Backend: TypeScript with strict mode
- Frontend: TypeScript with React 19
- API types in `frontend/src/types/api.ts` match backend models

### Linting

```bash
npm run lint       # Check all packages
npm run lint:fix   # Auto-fix issues
```

Uses ESLint v9 with flat config (`eslint.config.js`).

### Database Migrations

This project uses `prisma db push` for schema changes (no migrations folder). For production, switch to `prisma migrate dev`.

## Common Gotchas

1. **Prisma Generate**: After pulling schema changes, run `npx prisma generate` from `packages/backend`
2. **Docker Ports**: Dev DB on 5433 (not default 5432), Test DB on 5433, Redis on 6379
3. **Worker Startup**: Background worker must start AFTER Prisma connects (see `server.ts`)
4. **Node Config**: `workflow_node.config` is JSONB - always preserve entire config on updates
5. **Linear Workflows Only**: Multiple start nodes or cycles will throw errors in engine
6. **Test Isolation**: Integration tests use separate DB - don't run against dev database
7. **Dockerfile Build Order**: Prisma client MUST be generated before TypeScript compilation - ensure `npx prisma generate` runs before `npm run build`
8. **EventSource Reconnections**: NEVER put callbacks in `useEffect` deps - use `useRef` pattern
9. **Memory Leaks**: Always clean up EventSource listeners with named handlers + `removeListener()`
10. **DATABASE_URL**: Don't quote the value in `.env` file - use: `DATABASE_URL=postgresql://...` (no quotes)

## Deployment

### Production Setup

The application is containerized with Docker for production deployment:

```bash
# Copy and configure environment
cp .env.production.example .env.production
# Edit .env.production with your production values

# Deploy with Docker Compose
bash deploy.sh

# Or manually
docker-compose build
docker-compose up -d
```

### Docker Architecture

- **Backend**: Multi-stage build with Prisma generation, outputs to `dist/`
- **Frontend**: Vite build served by nginx with SPA routing support
- **Database**: PostgreSQL 15 with persistent volumes
- **Queue**: Redis 7 with AOF persistence

### Health Checks

- Backend: `GET /health` (no auth required)
- Frontend: nginx root endpoint
- All services have Docker healthchecks configured

### Database Migrations

Production uses `prisma migrate deploy` (not `db push`):

```bash
# Inside backend container
node scripts/migrate-deploy.js
```

### CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci-cd.yml`):

1. **Lint** - ESLint across all packages
2. **Test** - Unit and integration tests with coverage
3. **Build** - TypeScript compilation and Vite build
4. **Docker** - Build and push images to Docker Hub (on main branch)

Required secrets:

- `DOCKER_USERNAME` / `DOCKER_PASSWORD` - Docker Hub credentials
- `VITE_API_BASE_URL` / `VITE_API_KEY` - Frontend environment variables

### Environment Variables (Production)

See `.env.production.example` for full list. Critical ones:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` / `REDIS_PASSWORD` - Queue configuration
- `GEMINI_API_KEY` - AI model API key
- `VITE_API_KEY` - Frontend authentication

### Port Configuration

- Frontend: 80 (configurable via `FRONTEND_PORT`)
- Backend: 3000 (configurable via `BACKEND_PORT`)
- PostgreSQL: 5432 (internal) / 5432 (external, configurable)
- Redis: 6379 (internal) / 6379 (external, configurable)

## Key Files Reference

**Backend:**

- `packages/backend/src/workflow-runner/engine.ts` - Workflow execution logic (builds chain, executes steps)
- `packages/backend/src/workflow-runner/steps/step.ts` - Base step abstraction (extend for new node types)
- `packages/backend/src/workflow-runner/runner.ts` - Queue worker (processes jobs, starts in server.ts)
- `packages/backend/src/lib/queue.ts` - Queue client (creates jobs)
- `packages/backend/src/lib/prisma.ts` - Prisma client instance (connection pooling)
- `packages/backend/src/lib/uuid-v7.ts` - Time-sortable UUID generator
- `packages/backend/src/lib/http-error.ts` - HTTP error factories (BadRequest, NotFound, etc.)
- `packages/backend/src/api/route.ts` - API router with auth middleware
- `packages/backend/src/api/v1/runner.ts` - Workflow execution endpoints (run, progress, status)

**Frontend:**

- `packages/frontend/src/routes/workflow-builder/index.tsx` - Main editor component
- `packages/frontend/src/hooks/useWorkflowProgress.ts` - Single workflow SSE progress tracking
- `packages/frontend/src/hooks/useWorkflowsProgress.ts` - Multi-workflow progress (dashboard)
- `packages/frontend/src/hooks/useWorkflowNodes.ts` - Node CRUD operations
- `packages/frontend/src/hooks/useWorkflowEdges.ts` - Edge CRUD with cascade delete
- `packages/frontend/src/utils/workflowTransformers.ts` - DB ↔ ReactFlow transformations
- `packages/frontend/src/components/workflow-builder/WorkflowCanvas.tsx` - ReactFlow canvas wrapper
- `packages/frontend/src/components/nodes/` - Node components (AgentNode, TextInputNode)

**Infrastructure:**

- `docker-compose.yml` - Production orchestration
- `docker-compose.dev.yml` - Development services (Postgres, Redis)
- `docker-compose.test.yml` - Integration test services
- `deploy.sh` / `deploy.ps1` - Automated deployment scripts
- `.github/workflows/ci-cd.yml` - GitHub Actions pipeline
