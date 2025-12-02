<!-- Copilot instructions for the `ai-workflows-platform` monorepo -->

Goal
----
Help contributors and AI coding agents quickly understand the repository layout, key flows, and repeatable developer workflows so suggestions, edits, and tests are accurate and safe.

Essential context (big picture)
--------------------------------
- Monorepo managed by `turbo` with packages under `packages/`.
- Two main apps:
  - Backend: `packages/backend` — an Express + TypeScript API backed by Prisma and PostgreSQL.
  - Frontend: `packages/frontend` — a Vite + React app using TanStack Router and Tailwind.
- Data layer: Prisma schema at `packages/backend/prisma/schema.prisma`. Prisma client is generated into `packages/backend/src/generated/prisma` and the runtime adapter is configured in `packages/backend/src/lib/prisma.ts` (uses `@prisma/adapter-pg`).

Quick developer commands
------------------------
- Monorepo dev (start both):
  - `npm install` (root)
  - `npm run dev:be` — run backend via `turbo` (backend uses `tsx watch src/server.ts` in dev)
  - `npm run dev:fe` — run frontend (Vite, default port 4000)
- Backend build & run:
  - `cd packages/backend && npm run dev` (development)
  - `cd packages/backend && npm run build && npm start` (production artifact)
- Tests:
  - Unit: `cd packages/backend && npm run test:unit` (Vitest unit project)
  - Integration: `cd packages/backend && npm run test:integration` — `scripts/run-int-tests.js` will:
    - start `docker-compose -f docker-compose.test.yml up -d`
    - wait for Postgres at `postgresql://postgres:postgres@localhost:5433/postgres`
    - run `npx prisma db push --schema=./prisma/schema.prisma` with `DATABASE_URL` set
    - run Vitest integration project

Important project conventions & patterns
--------------------------------------
- OpenAPI-first route docs: handlers in `packages/backend/src/api/v1/*.ts` contain `@openapi` JSDoc blocks used by `swagger-jsdoc` (router config in `packages/backend/src/api/route.ts`). When changing endpoints, update those JSDoc blocks.
- API key enforcement: `packages/backend/src/api/route.ts` enforces a query `api_key` for all API routes — devs often add `?api_key=...` when calling endpoints during testing.
- Generated code location: Prisma generator outputs to `packages/backend/src/generated/prisma`. Keep generator config in `packages/backend/prisma/schema.prisma` in sync with usages.
- UUID helper: `packages/backend/src/lib/uuid-v7.ts` (used when creating models in handlers). Prefer its helper where unique IDs are needed.
- TypeScript modules: packages use `type: "module"` in `package.json` — use `import` syntax and maintain ESM-friendly patterns.

Integration & external dependencies
----------------------------------
- Postgres for integration tests — `packages/backend/docker-compose.test.yml` and `scripts/run-int-tests.js` assume a Docker engine on localhost.
- Prisma: run `npx prisma generate` after schema changes and `npx prisma db push --schema=./prisma/schema.prisma` for tests/local DB sync.
- Swagger UI is exposed under `/api-docs` (dev server `http://localhost:3000/api-docs`).

Files to inspect for context when making edits
---------------------------------------------
- `packages/backend/src/server.ts` — app entry, loads env and connects Prisma.
- `packages/backend/src/app.ts` — Express app composition and error handling.
- `packages/backend/src/api/route.ts` — router registration, swagger setup, and API-key middleware.
- `packages/backend/src/api/v1/*.ts` — concrete endpoints and their OpenAPI docs (agents, workflows, nodes, edges).
- `packages/backend/prisma/schema.prisma` — database models and enums (notice `model_type` values: `gemini`, `chatgpt`, `claude`).
- `packages/backend/scripts/run-int-tests.js` — canonical integration-test flow (docker-compose -> db push -> vitest).
- `packages/frontend/src/routes` — frontend route files (TanStack file-based routing).

What to prefer in PRs from AI agents
-----------------------------------
- Make small, well-scoped changes with tests (unit tests in `packages/*` where present).
- When changing API shapes, update the `@openapi` docblocks in the matching `src/api/v1` file and re-generate any docs if needed.
- If adding DB fields, update `prisma/schema.prisma`, run `npx prisma generate`, and include a note about running `prisma db push` (or a migration) for dev/integration tests.
- For new endpoints, mirror existing patterns: route file exports an `express.Router()`, uses `prisma` via `packages/backend/src/lib/prisma.ts`, and returns JSON errors via `next(err)` so the central error middleware can handle them.

Examples (copyable)
-------------------
- Start backend dev server:
  - `cd packages/backend && npm run dev`
- Run backend integration tests locally:
  - `cd packages/backend && npm run test:integration`
- Generate prisma client after schema edits:
  - `cd packages/backend && npx prisma generate --schema=./prisma/schema.prisma`

If something is missing
-----------------------
Ask for the specific target (backend/frontend), and include the path and a short description of the change you intend to make. I will read the relevant files and produce a precise patch with tests where applicable.

— End of guidance
