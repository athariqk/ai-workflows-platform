# Quick Reference - Deployment Commands

## Initial Setup
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
```bash
# View container inspect details
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
- **PostgreSQL**: 5432 (production) / 5433 (development)
- **Redis**: 6379
- **API Docs**: http://localhost:3000/v1/api-docs

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
