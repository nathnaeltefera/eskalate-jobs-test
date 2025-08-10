# Docker Setup Guide

This guide explains how to run the Job Application Management System using Docker.

## 🐳 Docker Files Overview

- **`Dockerfile`** - Production build
- **`Dockerfile.dev`** - Development build with hot reload
- **`docker-compose.yml`** - Production setup with PostgreSQL
- **`docker-compose.dev.yml`** - Development setup with hot reload
- **`.dockerignore`** - Files to exclude from Docker build

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Your Cloudinary credentials (optional for file uploads)

### Production Setup

1. **Configure Environment Variables**
   ```bash
   # Edit docker-compose.yml and update:
   # - CLOUDINARY_CLOUD_NAME
   # - CLOUDINARY_API_KEY  
   # - CLOUDINARY_API_SECRET
   # - JWT_SECRET (change from default)
   ```

2. **Build and Run**
   ```bash
   docker-compose up -d
   ```

3. **Access the Application**
   - **API Documentation**: http://localhost:8080/api/docs
   - **Health Check**: http://localhost:8080/health
   - **Database Admin**: http://localhost:8081 (Adminer)

### Development Setup

1. **Configure Environment Variables**
   ```bash
   # Edit docker-compose.dev.yml and update Cloudinary credentials
   ```

2. **Build and Run Development Environment**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Features**
   - Hot reload enabled
   - Development database on port 5433
   - Extended JWT expiry (7 days)
   - Automatic database migrations

## 📋 Docker Commands

### Production Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Clean up (removes volumes - BE CAREFUL)
docker-compose down -v
```

### Development Commands
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View development logs
docker-compose -f docker-compose.dev.yml logs -f api-dev

# Stop development environment
docker-compose -f docker-compose.dev.yml down

# Rebuild development environment
docker-compose -f docker-compose.dev.yml up -d --build
```

### Database Commands
```bash
# Run database migrations
docker-compose exec api npx prisma migrate deploy

# Access database shell
docker-compose exec postgres psql -U postgres -d eskalte_jobs

# Reset database (development only)
docker-compose -f docker-compose.dev.yml exec api-dev npx prisma migrate reset
```

## 🔧 Configuration

### Environment Variables (docker-compose.yml)
```yaml
environment:
  NODE_ENV: production
  PORT: 8080
  DATABASE_URL: postgresql://postgres:postgres@postgres:5432/eskalte_jobs
  JWT_SECRET: your_super_secret_jwt_key_change_in_production
  JWT_EXPIRES_IN: 1d
  BASE_URL: http://localhost:8080
  CLOUDINARY_CLOUD_NAME: your_cloud_name
  CLOUDINARY_API_KEY: your_api_key
  CLOUDINARY_API_SECRET: your_api_secret
```

### Ports
- **8080** - API Server
- **8081** - Database Admin (Adminer)
- **5432** - PostgreSQL (production)
- **5433** - PostgreSQL (development)

## 📊 Services

### API Service
- Built from local Dockerfile
- Runs database migrations on startup
- Health checks enabled
- Automatic restart on failure

### PostgreSQL Database
- Official PostgreSQL 15 Alpine image
- Persistent data storage
- Health checks enabled
- Automatic initialization

### Adminer (Database Admin)
- Web-based database management
- Access at http://localhost:8081
- Login with: postgres/postgres

## 🧪 Testing the Setup

### Health Check
```bash
curl http://localhost:8080/health
```

### API Documentation
Visit http://localhost:8080/api/docs to see the Swagger UI

### Test Authentication
```bash
curl -X POST http://localhost:8080/api/auth/test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "role": "company"}'
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Change ports in docker-compose.yml if needed
   ports:
     - "3000:8080"  # Use different external port
   ```

2. **Database connection issues**
   ```bash
   # Check database health
   docker-compose ps
   docker-compose logs postgres
   ```

3. **Prisma migration issues**
   ```bash
   # Run migrations manually
   docker-compose exec api npx prisma migrate deploy
   ```

4. **Build issues**
   ```bash
   # Clean rebuild
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Logs
```bash
# View all logs
docker-compose logs

# Follow API logs
docker-compose logs -f api

# View database logs
docker-compose logs postgres
```

## 🚀 Deployment

For production deployment:

1. **Update JWT_SECRET** in docker-compose.yml
2. **Add your Cloudinary credentials**
3. **Configure reverse proxy** (nginx/traefik) if needed
4. **Set up SSL certificates** for HTTPS
5. **Configure backup** for PostgreSQL data

## 📁 Volume Management

### Data Persistence
- Database data is stored in `postgres_data` volume
- Survives container restarts and rebuilds
- To reset: `docker-compose down -v` (⚠️ destroys data)

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres eskalte_jobs > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres eskalte_jobs < backup.sql
```