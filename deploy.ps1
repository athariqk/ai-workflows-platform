# PowerShell Deployment Script for AI Workflows Platform
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting AI Workflows Platform Deployment" -ForegroundColor Green

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ .env.production file not found!" -ForegroundColor Red
    Write-Host "📝 Please copy .env.production.example to .env.production and configure it" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Building Docker images..." -ForegroundColor Cyan
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Stopping existing containers..." -ForegroundColor Cyan
docker-compose down

Write-Host "🗑️  Removing old images (optional cleanup)..." -ForegroundColor Cyan
docker image prune -f

Write-Host "🚀 Starting services..." -ForegroundColor Cyan
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services!" -ForegroundColor Red
    exit 1
}

Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host "🔄 Running database migrations..." -ForegroundColor Cyan
docker-compose exec -T backend node scripts/migrate-deploy.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Migration failed, but continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "📝 Logs:" -ForegroundColor Cyan
Write-Host "  View all logs: docker-compose logs -f"
Write-Host "  Backend logs: docker-compose logs -f backend"
Write-Host "  Frontend logs: docker-compose logs -f frontend"
Write-Host ""

# Load environment variables to display URLs
if (Test-Path ".env.production") {
    Get-Content ".env.production" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            Set-Variable -Name $matches[1] -Value $matches[2] -Scope Script
        }
    }
}

$frontendPort = if ($FRONTEND_PORT) { $FRONTEND_PORT } else { "80" }
$backendPort = if ($BACKEND_PORT) { $BACKEND_PORT } else { "3000" }

Write-Host "🌐 Access your application:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:$frontendPort"
Write-Host "  Backend API: http://localhost:$backendPort"
Write-Host "  API Docs: http://localhost:$backendPort/v1/api-docs"
