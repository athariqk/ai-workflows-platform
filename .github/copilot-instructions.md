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
import { prisma } from "@/lib/prisma"
import uuidv7 from "@/lib/uuid-v7"
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
  ├── workflow_node (id, type, config JSONB)
  │   └── step_log (tracking execution per node)
  ├── workflow_edge (source_node_id, target_node_id)
  └── run_log (status, started_at, finished_at)
```

Graph must be linear (single start node, no branching yet). Engine builds execution chain by walking edges.

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
- Custom hooks (`useWorkflowData`, `useWorkflowNodes`, `useWorkflowEdges`, `useWorkflowProgress`)
- Node types in `components/nodes/` (AgentNode, TextInputNode)
- Real-time execution tracking via SSE from backend

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
2. **Docker Ports**: Dev DB on 5433 (not default 5432), Redis on 6379
3. **Worker Startup**: Background worker must start AFTER Prisma connects (see `server.ts`)
4. **Node Config**: `workflow_node.config` is JSONB - parse as specific type when using
5. **Linear Workflows Only**: Multiple start nodes or cycles will throw errors in engine
6. **Test Isolation**: Integration tests use separate DB - don't run against dev database

## Key Files Reference

- `packages/backend/src/workflow-runner/engine.ts` - Workflow execution logic
- `packages/backend/src/workflow-runner/steps/step.ts` - Base step abstraction
- `packages/backend/src/lib/queue.ts` - Queue client (posts jobs)
- `packages/backend/src/workflow-runner/runner.ts` - Queue worker (processes jobs)
- `packages/backend/src/api/route.ts` - API router with auth middleware
- `packages/frontend/src/routes/workflow-builder/index.tsx` - Main editor component
