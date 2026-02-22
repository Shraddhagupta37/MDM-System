Write-Host "MDM System Setup Script" -ForegroundColor Green
Write-Host "========================"

# Check if Docker is installed
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "Docker is running" -ForegroundColor Green

# Create .env file if it doesn't exist
if (!(Test-Path .env)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password123
JWT_SECRET=your_jwt_secret_key_$(Get-Random)
ADMIN_EMAIL=admin@moveinsync.com
ADMIN_PASSWORD=Admin@123456
"@ | Out-File -FilePath .env -Encoding UTF8
    Write-Host ".env file created" -ForegroundColor Green
}

# Create necessary directories
Write-Host "Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path backend, frontend, logs | Out-Null
Write-Host "Directories created" -ForegroundColor Green

# Build and start containers
Write-Host "Building and starting containers..." -ForegroundColor Yellow
docker-compose up -d --build

# Wait for services to be ready
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if services are running
$services = docker-compose ps --services --filter "status=running"
if ($services) {
    Write-Host "All services are running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your applications:" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:3000"
    Write-Host "Backend API: http://localhost:5000"
    Write-Host "MongoDB: localhost:27017"
    Write-Host ""
    Write-Host "Default login:" -ForegroundColor Cyan
    Write-Host "Email: admin@moveinsync.com"
    Write-Host "Password: Admin@123456"
    Write-Host ""
    Write-Host "To stop: docker-compose down"
} else {
    Write-Host "Something went wrong. Check logs with: docker-compose logs" -ForegroundColor Red
}