#!/bin/bash
# Deployment script for AI Workflows Platform

set -e

echo "🚀 Starting AI Workflows Platform Deployment"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found!"
    echo "📝 Please copy .env.production.example to .env.production and configure it"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "📦 Building Docker images..."
docker-compose build

echo "🔄 Stopping existing containers..."
docker-compose down

echo "🗑️  Removing old images (optional cleanup)..."
docker image prune -f

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔄 Running database migrations..."
docker-compose exec -T backend node scripts/migrate-deploy.js || {
    echo "⚠️  Migration failed, but continuing..."
}

echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "📝 Logs:"
echo "  View all logs: docker-compose logs -f"
echo "  Backend logs: docker-compose logs -f backend"
echo "  Frontend logs: docker-compose logs -f frontend"
echo ""
echo "🌐 Access your application:"
echo "  Frontend: http://localhost:${FRONTEND_PORT:-80}"
echo "  Backend API: http://localhost:${BACKEND_PORT:-3000}"
echo "  API Docs: http://localhost:${BACKEND_PORT:-3000}/v1/api-docs"
