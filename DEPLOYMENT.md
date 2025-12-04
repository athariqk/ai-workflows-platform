# Deployment Checklist

## Pre-Deployment

### 1. Environment Configuration
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Set secure `POSTGRES_PASSWORD` (min 16 characters)
- [ ] Set secure `REDIS_PASSWORD` (min 16 characters)
- [ ] Configure `GEMINI_API_KEY` with valid API key
- [ ] Set `VITE_API_KEY` to match backend authentication
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Update `VITE_API_BASE_URL` to production backend URL

### 2. Security Review
- [ ] All passwords are unique and secure
- [ ] API keys are not committed to version control
- [ ] `.env.production` is in `.gitignore`
- [ ] CORS origins are properly configured in backend
- [ ] Database backups are configured

### 3. Infrastructure
- [ ] Docker and Docker Compose installed
- [ ] Sufficient disk space for volumes (recommended: 20GB+)
- [ ] Ports are available: 80, 3000, 5432, 6379
- [ ] SSL/TLS certificates ready (if using HTTPS)

## Deployment Steps

### 1. Initial Deployment
```bash
# Copy and configure environment
cp .env.production.example .env.production
nano .env.production  # or vim, code, etc.

# Run deployment script
bash deploy.sh  # Linux/Mac
# OR
.\deploy.ps1    # Windows PowerShell
```

### 2. Verify Services
```bash
# Check container status
docker-compose ps

# All services should be "healthy" or "running"
# Wait 30-60 seconds for health checks to pass

# Check logs for errors
docker-compose logs backend
docker-compose logs frontend
```

### 3. Database Migrations
```bash
# Migrations run automatically in deploy.sh
# If manual run needed:
docker-compose exec backend node scripts/migrate-deploy.js
```

### 4. Smoke Tests
- [ ] Frontend loads: `curl http://localhost:80`
- [ ] Backend health: `curl http://localhost:3000/health`
- [ ] API docs accessible: http://localhost:3000/v1/api-docs
- [ ] Can create workflow in UI
- [ ] Can create agent in UI
- [ ] Can execute workflow

## Post-Deployment

### 1. Monitoring Setup
```bash
# Monitor logs in real-time
docker-compose logs -f

# Monitor specific service
docker-compose logs -f backend
```

### 2. Backup Configuration
```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres awp_db > backup_$(date +%Y%m%d).sql

# Backup Redis data
docker-compose exec redis redis-cli BGSAVE

# Backup volumes
docker run --rm -v awp_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

### 3. Performance Tuning
- [ ] Monitor container resource usage: `docker stats`
- [ ] Adjust container memory limits if needed
- [ ] Configure PostgreSQL connection pool size
- [ ] Set up log rotation

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Database not ready: Wait 30s and restart
# - Missing GEMINI_API_KEY: Check .env.production
# - Port 3000 in use: Change BACKEND_PORT
```

### Frontend Won't Load
```bash
# Check nginx logs
docker-compose logs frontend

# Common issues:
# - Build args not passed: Rebuild with correct VITE_ variables
# - CORS errors: Check FRONTEND_URL in backend .env
```

### Database Connection Issues
```bash
# Test database connectivity
docker-compose exec backend node -e "const {PrismaClient} = require('./src/generated/prisma/client'); new PrismaClient().\$connect().then(() => console.log('OK')).catch(console.error)"

# Check PostgreSQL logs
docker-compose logs postgres
```

### Redis Connection Issues
```bash
# Test Redis connectivity
docker-compose exec backend node -e "const redis = require('redis'); const client = redis.createClient({host: 'redis', port: 6379}); client.on('connect', () => {console.log('OK'); process.exit(0)}); client.on('error', (e) => {console.error(e); process.exit(1)}); client.connect()"

# Check Redis logs
docker-compose logs redis
```

## Rollback Procedure

### Quick Rollback
```bash
# Stop current deployment
docker-compose down

# Restore from backup
docker-compose exec postgres psql -U postgres awp_db < backup_YYYYMMDD.sql

# Restart with previous version
git checkout <previous-tag>
docker-compose up -d
```

## Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Run migrations
docker-compose exec backend node scripts/migrate-deploy.js
```

### Clean Up Old Images
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes (WARNING: Data loss!)
docker volume prune
```

### View Resource Usage
```bash
# Container stats
docker stats

# Disk usage
docker system df

# Volume sizes
docker system df -v
```

## Security Hardening

### Production Checklist
- [ ] Change default ports if exposed to internet
- [ ] Set up reverse proxy (nginx/traefik) with HTTPS
- [ ] Enable firewall rules (only allow necessary ports)
- [ ] Set up fail2ban for brute force protection
- [ ] Regular security updates: `docker-compose pull`
- [ ] Implement rate limiting in API
- [ ] Set up monitoring and alerting
- [ ] Regular database backups (automated)
- [ ] Implement log aggregation
- [ ] Set up intrusion detection

### SSL/TLS Setup (with reverse proxy)
```bash
# Example with Let's Encrypt + nginx
# See: https://certbot.eff.org/

# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Support

### Log Collection
```bash
# Collect all logs for support
docker-compose logs > deployment-logs.txt

# Include system info
docker version >> deployment-logs.txt
docker-compose version >> deployment-logs.txt
uname -a >> deployment-logs.txt
```

### Health Check Commands
```bash
# Quick health check script
curl -f http://localhost:3000/health || echo "Backend unhealthy"
curl -f http://localhost:80/health || echo "Frontend unhealthy"
docker-compose ps | grep -v "healthy\|Up" || echo "All services healthy"
```
