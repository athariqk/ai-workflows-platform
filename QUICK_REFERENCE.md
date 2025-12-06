# Quick Reference - Developer Cheatsheet

## Development Commands

### Start Development Environment

```bash
# From repository root
npm install           # Install all dependencies
npm run dev           # Run both frontend + backend + Docker services
npm run dev:be        # Backend only (port 3000)
npm run dev:fe        # Frontend only (port 4000)
```

**Access Points:**

- Frontend: http://localhost:4000
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/v1/api-docs
- Dev DB: localhost:5433 (PostgreSQL)
- Redis: localhost:6379

### Testing

```bash
npm run test              # Run all tests
npm run test:unit         # Backend unit tests only
npm run test:integration  # Backend integration tests (starts Docker)
npm run lint              # ESLint check
npm run lint:fix          # Auto-fix linting issues
```

### Database Operations

```bash
cd packages/backend

# After schema changes
npx prisma generate       # Regenerate Prisma client
npx prisma db push        # Push schema to dev DB (no migration)

# Development migrations (for production)
npx prisma migrate dev --name your_migration_name

# View database in GUI
npx prisma studio
```

**Important:** Run `npx prisma generate` after pulling schema changes!

### Common Workflows

**Add New Workflow Node Type:**

1. Edit `packages/backend/prisma/schema.prisma` (add enum value if needed)
2. `npx prisma generate` (regenerate client)
3. Create step class: `packages/backend/src/workflow-runner/steps/new-step.ts`
4. Extend `Step` abstract class, implement `execute(input)`
5. Update `packages/backend/src/workflow-runner/engine.ts` switch statement
6. Create frontend component: `packages/frontend/src/components/nodes/NewNode.tsx`
7. Register in `nodeTypeRegistry` (`workflowTransformers.ts`)

**Debug EventSource Issues:**

```typescript
// Check browser console for:
console.log("EventSource connection opened");
console.log("EventSource failed:", error);

// Backend: Watch queue events
workflowQueue.on("job progress", (jobId, progress) => {
  console.log("Progress:", jobId, progress);
});
```

**useWorkflowProgress Pattern:**

```typescript
// Track one or more workflows with initial fetch + real-time updates
const { registerJob } = useWorkflowProgress(
  [workflowId1, workflowId2],
  (workflowId, progress: WorkflowProgress) => {
    // progress.runStatus - contains run_id, job_id, status
    // progress.currentStep - optional, only when step executing
    console.log(progress.runStatus.status); // 'idle', 'running', 'completed', etc.
  }
);

// After starting workflow, register job for real-time tracking
const jobId = crypto.randomUUID();
await api.runWorkflow(workflowId, jobId);
registerJob(jobId, workflowId);
```

## Production Deployment

### Initial Setup

```bash
# 1. Configure environment
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# 2. Deploy
bash deploy.sh         # Linux/Mac
.\deploy.ps1           # Windows PowerShell
```

## Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# View service status
docker-compose ps

# Remove everything (including volumes - WARNING: DATA LOSS!)
docker-compose down -v
```

## Logs & Monitoring

```bash
# View all logs (follow mode)
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis

# View last 100 lines
docker-compose logs --tail=100 backend

# Save logs to file
docker-compose logs > deployment-logs.txt
```

## Database Operations

```bash
# Run migrations
docker-compose exec backend node scripts/migrate-deploy.js

# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres awp_db

# Create database backup
docker-compose exec postgres pg_dump -U postgres awp_db > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres awp_db < backup.sql

# View database size
docker-compose exec postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('awp_db'));"
```

## Redis Operations

```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Check Redis info
docker-compose exec redis redis-cli INFO

# View queue length
docker-compose exec redis redis-cli LLEN workflow-execution

# Flush all Redis data (WARNING: Clears all queues!)
docker-compose exec redis redis-cli FLUSHALL
```

## Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# Frontend health
curl http://localhost:80/health

# Quick health check all services
docker-compose ps | grep -E "healthy|Up"
```

## Updates & Rebuilds

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose build

# Rebuild and restart
docker-compose up -d --build

# Force rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

## Container Management

```bash
# Enter backend container shell
docker-compose exec backend sh

# Enter frontend container shell
docker-compose exec frontend sh

# Run command in backend container
docker-compose exec backend node -e "console.log('Hello')"

# View container resource usage
docker stats
```

## Cleanup

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes (WARNING: DATA LOSS!)
docker volume prune

# Remove everything unused
docker system prune -a
```

## Troubleshooting

### Development Issues

**"Prisma Client not found":**

```bash
cd packages/backend
npx prisma generate
npm run dev:be
```

**"EventSource keeps reconnecting":**

- Check for callbacks in `useEffect` dependencies
- Use `useRef` pattern for callbacks (see docs/DESIGN_DECISIONS.md)

**"MaxListenersExceededWarning":**

- EventSource listeners not cleaned up
- Ensure named handler + `removeListener()` on disconnect

**"Workflow statuses not showing on dashboard":**

- Check useWorkflowProgress initial fetch logic
- Verify callback receives progress.runStatus with status field
- For workflows without step_logs: progress.currentStep will be undefined
- Hook should send run status even when no steps executed yet

**"Database connection failed":**

- Check `DATABASE_URL` has no quotes in `.env`
- Correct format: `postgresql://user:pass@localhost:5433/postgres`
- Verify Docker containers running: `docker ps`

**"Workflow execution stuck":**

```bash
# Check Redis queue
docker-compose exec redis redis-cli LLEN workflow-execution

# View backend logs
docker-compose logs -f backend

# Check run_log status
docker-compose exec postgres psql -U postgres -c "SELECT * FROM run_log ORDER BY started_at DESC LIMIT 5;"
```

### Production Issues

**Container inspect:**

```bash
docker-compose ps
docker inspect <container_id>

# Check network connectivity
docker-compose exec backend ping postgres
docker-compose exec backend ping redis

# Check environment variables
docker-compose exec backend env | grep DATABASE_URL

# Restart with fresh logs
docker-compose down && docker-compose up -d && docker-compose logs -f
```

**Build failures:**

```bash
# Ensure Prisma generates before TypeScript compilation
docker-compose build --no-cache backend

# Check Dockerfile has:
# RUN npx prisma generate  # BEFORE npm run build
# RUN npm run build
```

## Development vs Production

```bash
# Development (with hot reload)
npm run dev

# Production (Docker)
docker-compose up -d

# Switch databases
# Dev:  localhost:5433
# Prod: localhost:5432 (inside Docker network)
```

## Port Reference

- **Frontend**: 80 (production) / 4000 (development)
- **Backend**: 3000
- **PostgreSQL**: 5432 (production) / 5433 (development) / 5433 (test)
- **Redis**: 6379
- **API Docs**: http://localhost:3000/v1/api-docs

## Key Architecture Patterns

### Real-Time Progress (EventSource)

**Backend** (`/v1/runner/run-progress`):

```typescript
const progressHandler = (jobId, progress) => {
  res.write(`data: ${JSON.stringify({ jobId, progress })}\n\n`);
};
workflowQueue.on("job progress", progressHandler);

res.on("close", () => {
  workflowQueue.removeListener("job progress", progressHandler); // Prevent leak
});
```

**Frontend** (useRef pattern):

```typescript
const onProgressRef = useRef(onProgressCallback);
const jobMapRef = useRef(new Map());

useEffect(() => {
  onProgressRef.current = onProgressCallback; // Update ref, not deps
}, [onProgressCallback]);

useEffect(() => {
  const eventSource = new EventSource(url);
  eventSource.onmessage = (event) => {
    const { jobId, progress } = JSON.parse(event.data);
    const workflowId = jobMapRef.current.get(jobId);
    onProgressRef.current?.(workflowId, progress.data); // Unwrap .data
  };
  return () => eventSource.close();
}, []); // Empty deps - runs once
```

**Why this pattern?**

- Callbacks in deps → effect re-runs → EventSource reopens (bad)
- Refs hold latest values → effect runs once → stable connection (good)

### Node Config Pass-Through

**Database → ReactFlow:**

```typescript
// workflow_node.config (JSONB) → ReactFlow node.data (direct pass-through)
const reactFlowNode = {
  id: dbNode.id,
  type: getReactFlowNodeType(dbConfig.type),
  position: dbConfig.position,
  data: dbConfig, // Single source of truth
};
```

**Updates:**

```typescript
// Preserve entire config when updating
const updatedConfig = { ...node.data, ...updates };
api.updateWorkflowNode(nodeId, { config: updatedConfig });
```

### Error Handling

**Backend:**

```typescript
import { BadRequest, NotFound } from "@/lib/http-error";
throw BadRequest("workflow_id required"); // Returns 400 JSON
```

**Frontend:**

```typescript
try {
  await api.runWorkflow(workflowId, jobId);
} catch (err) {
  console.error("Run failed:", (err as Error).message);
}
```

## Emergency Procedures

```bash
# Quick restart all services
docker-compose restart

# Nuclear option - fresh start
docker-compose down -v
rm -rf /var/lib/docker/volumes/awp_*  # Only if absolutely necessary!
docker-compose up -d

# Rollback to previous version
git checkout <previous-commit>
docker-compose build
docker-compose up -d
```

## Performance Monitoring

```bash
# Real-time container stats
docker stats

# Disk usage
docker system df

# Volume sizes
docker system df -v

# Network inspection
docker network inspect awp_awp-network
```

## CI/CD Integration

```bash
# Check CI/CD status
gh run list  # GitHub CLI

# View workflow runs
gh run view <run-id>

# Re-run failed jobs
gh run rerun <run-id>
```

## Security

```bash
# Scan images for vulnerabilities
docker scan awp-backend-prod
docker scan awp-frontend-prod

# Update base images
docker-compose pull
docker-compose up -d --build

# Check for exposed secrets
docker-compose config | grep -i "password\|key\|secret"
```
