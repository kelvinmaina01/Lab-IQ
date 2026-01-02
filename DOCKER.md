# LabIQ Docker Setup Guide

## 🐳 Quick Start

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Start All Services
```bash
# Start frontend and ML service
docker-compose up -d

# Start with local database (for development)
docker-compose --profile with-db up -d
```

### Stop Services
```bash
docker-compose down
```

## 📦 Services

### Frontend (React/Vite)
- **Port**: 8080
- **URL**: http://localhost:8080
- **Health**: http://localhost:8080/health

### ML Service (FastAPI)
- **Port**: 8000
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

### Database (Optional - Supabase Postgres)
- **Port**: 5432
- **Default Password**: postgres

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Google AI
GOOGLE_API_KEY=your_google_api_key_here

# Database (if using local Supabase)
POSTGRES_PASSWORD=your_secure_password

# Supabase (if using cloud)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Production Deployment

### Build Images
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build frontend
docker-compose build ml-service
```

### Push to Registry
```bash
# Tag images
docker tag labiq-frontend:latest your-registry/labiq-frontend:latest
docker tag labiq-ml-service:latest your-registry/labiq-ml-service:latest

# Push to registry
docker push your-registry/labiq-frontend:latest
docker push your-registry/labiq-ml-service:latest
```

## 🔍 Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f ml-service
```

### Check Status
```bash
docker-compose ps
```

### Resource Usage
```bash
docker stats
```

## 🛠️ Development

### Hot Reload (Frontend)
The frontend Dockerfile is optimized for production. For development with hot reload:

```bash
# Use npm directly
npm run dev
```

### ML Service Development
```bash
# Run ML service with auto-reload
cd ml-service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🧹 Cleanup

### Remove Containers
```bash
docker-compose down
```

### Remove Volumes (⚠️ Deletes data)
```bash
docker-compose down -v
```

### Remove Images
```bash
docker-compose down --rmi all
```

## 📊 Service Architecture

```
┌─────────────────────────────────────────┐
│          Load Balancer / Nginx          │
│              (Port 80/443)              │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌─────▼──────┐
│  Frontend   │  │ ML Service │
│  (Port 80)  │  │ (Port 8000)│
└──────┬──────┘  └─────┬──────┘
       │                │
       └────────┬───────┘
                │
        ┌───────▼────────┐
        │    Supabase    │
        │   (Cloud/Local)│
        └────────────────┘
```

## 🔐 Security Notes

1. **Never commit `.env` files** - they contain sensitive credentials
2. **Use secrets management** in production (AWS Secrets Manager, Azure Key Vault, etc.)
3. **Enable HTTPS** in production with proper SSL certificates
4. **Limit exposed ports** - only expose what's necessary
5. **Regular updates** - keep Docker images and dependencies updated

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :8080

# Kill process (Windows)
taskkill /PID <process_id> /F
```

### Container Won't Start
```bash
# Check logs
docker-compose logs <service_name>

# Remove and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues
```bash
# Verify database is running
docker-compose ps supabase-db

# Check database logs
docker-compose logs supabase-db
```

## 📝 Notes

- Frontend builds are optimized for production with multi-stage builds
- ML service includes health checks for orchestration
- Volumes persist data between container restarts
- Networks enable service-to-service communication
- Profiles allow optional service activation (like local DB)
