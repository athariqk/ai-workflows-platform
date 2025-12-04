# AI Workflows Platform - Copilot Instructions

## Architecture Overview

This is a **Turborepo monorepo** for a mini AI agent workflow platform with:
- **Backend** (`packages/backend`): Express REST API with Prisma ORM + PostgreSQL
- **Frontend** (`packages/frontend`): React + TanStack Router + ReactFlow visual workflow editor
- **Shared configs** (`packages/typescript-config`, `packages/vitest-config`)

The platform allows users to create workflows composed of AI agent nodes (Gemini, ChatGPT, Claude) connected via edges, visualize them in a drag-and-drop builder, and execute them via a runner system.

## Development Workflow

### Running the App
```bash
npm run dev           # Run both frontend & backend
npm run dev:fe        # Frontend only (port 4000)
npm run dev:be        # Backend only (port 3000)
```

### Testing Strategy
- **Backend has TWO test types**: unit tests (`*.unit.test.ts`) and integration tests (`*.int.test.ts`)
- Integration tests use a **dockerized Postgres** (port 5433) managed by `scripts/run-int-tests.js`
  - The script: starts docker-compose, waits for DB, applies schema via `prisma db push`, runs tests, tears down
  - Never run `prisma migrate` manually for tests - the script handles everything
- Run tests: `npm run test` (from root or package directory)
- View coverage report: `npm run view-report`

### Database & Prisma
- Schema: `packages/backend/prisma/schema.prisma`
- Generated client: `packages/backend/src/generated/prisma/` (custom output path)
- Prisma adapter uses `@prisma/adapter-pg` with direct PostgreSQL connection
- Access via singleton: `import { prisma } from "@/lib/prisma"`

## Critical Patterns

### UUIDs: Use UUIDv7 for All IDs
All database IDs use **UUIDv7** (time-sortable):
```typescript
import uuidv7 from "@/lib/uuid-v7"
const id = uuidv7() // Returns crypto.UUID type
```
Never use `uuid` package or Prisma's `@default(uuid())` - always call `uuidv7()` explicitly in route handlers.

### Import Aliases
Both packages use `@/*` for absolute imports:
- Backend: `@/lib/prisma`, `@/api/v1/agents`
- Frontend: `@/lib/api`, `@/components/AgentNode`

### API Structure
- All routes require `?api_key=<key>` query parameter (middleware in `api/route.ts`)
- OpenAPI/Swagger docs generated from JSDoc comments in `src/api/v1/*.ts`
- View docs at: `http://localhost:3000/api-docs`
- Routes follow RESTful pattern: GET, POST, PUT, DELETE with UUID params

### Frontend API Client
Centralized in `packages/frontend/src/lib/api.ts`:
```typescript
import { api } from '@/lib/api'
const agents = await api.getAgents()
```
Uses environment variables: `VITE_API_BASE_URL`, `VITE_API_KEY`

### Workflow Builder
- Uses **ReactFlow** (`@xyflow/react`) for visual node editor
- Custom node type: `agentNode` (see `components/AgentNode.tsx`)
- Agent nodes dragged from sidebar, dropped onto canvas with drag-and-drop
- State managed in `workflow-builder/index.tsx` with `screenToFlowPosition` for coordinate conversion

### TanStack Router (File-Based Routing)
- Routes in `src/routes/` auto-generate types via `routeTree.gen.ts`
- Layout in `__root.tsx`, pages use `createFileRoute()`
- Search params: use `validateSearch` with TypeScript types (see workflow-builder route)

## Code Quality

- **ESLint**: Uses `@eslint/js` + `typescript-eslint` strict configs
- **TypeScript**: Strict mode enabled, no `any` types
- **Testing**: Vitest with projects (unit/integration split in backend)
- Error handling: Express error middleware catches all route errors

## Workflow Execution System

### Job Queue Architecture
- Uses **bee-queue** with Redis for asynchronous workflow execution
- Queue configuration: `lib/queue.ts` (for job creation) and `workflow-runner/worker.ts` (for processing)
- Worker auto-starts with server in `server.ts`

### Execution Flow
1. POST to `/v1/runner/run` creates a `run_log` and queues job
2. Worker picks up job and builds workflow graph from `workflow_node` and `workflow_edge` tables
3. Graph traversal executes nodes topologically, creating `step_log` entries
4. Each step uses `AgentStep` class (currently mock, needs AI API integration)
5. GET `/v1/runner/status/:run_id` returns execution status and logs

### Key Files
- `workflow-runner/runner.ts`: Graph building, traversal logic, and worker initialization
- `workflow-runner/steps/step.ts`: Abstract base class for execution steps
- `workflow-runner/steps/agent-step.ts`: AI agent step implementation (async)
- `api/v1/runner.ts`: REST endpoints for starting runs and checking status

## Common Gotchas

1. **Prisma client import**: Always from `@/lib/prisma`, not direct from generated folder
2. **Test DB**: Integration tests fail if Docker isn't running (port 5433 conflict means cleanup failed)
3. **API key**: Frontend requests fail without `VITE_API_KEY` - check `.env` files
4. **Redis requirement**: Worker needs Redis running (default localhost:6379) - check `.env` for config
5. **Module type**: Both packages use `"type": "module"` - ES modules only, no CommonJS
6. **Async steps**: All Step implementations must return `Promise<string>`, not plain strings

## Key Files Reference

- API routes: `packages/backend/src/api/v1/*.ts`
- Database models: `packages/backend/prisma/schema.prisma`
- Prisma generated: `packages/backend/src/generated/prisma/`
- Frontend types: `packages/frontend/src/types/api.ts`
- Test setup: `packages/backend/scripts/run-int-tests.js`
- Workflow builder: `packages/frontend/src/routes/workflow-builder/index.tsx`
