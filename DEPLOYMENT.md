# 🚀 TaskBoard Deployment Guide

This guide provides comprehensive instructions for deploying TaskBoard to production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Production Deployment](#quick-production-deployment)
- [Deployment Options](#deployment-options)
  - [Docker Compose (VPS/Dedicated Server)](#1-docker-compose-vpsdedicated-server)
  - [Cloud Platform Deployments](#2-cloud-platform-deployments)
  - [Kubernetes Deployment](#3-kubernetes-deployment)
- [Environment Configuration](#environment-configuration)
- [Security Checklist](#security-checklist)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ **Server/Cloud Account**: VPS, AWS, GCP, Azure, or DigitalOcean
- ✅ **Docker & Docker Compose**: Version 20.10+ and 2.0+
- ✅ **Domain Name** (optional but recommended for production)
- ✅ **SSL Certificate** (Let's Encrypt recommended)
- ✅ **Database** (Managed PostgreSQL recommended for production)
- ✅ **At least 2GB RAM** and 20GB storage

---

## Quick Production Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/task-board.git
cd task-board
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp env.production.example .env

# Edit the .env file with your production values
nano .env
```

**Critical Variables to Change:**

```env
# Use a strong, random password (generate with: openssl rand -base64 32)
DB_PASSWORD=your_super_secure_database_password

# Use a strong JWT secret (generate with: openssl rand -base64 64)
JWT_SECRET=your_super_long_jwt_secret_key_minimum_32_characters

# Set to your frontend domain
CORS_ORIGIN=https://yourdomain.com

# Set to your backend API URL
REACT_APP_API_URL=https://api.yourdomain.com/api/v1
```

### 3. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs to ensure everything started correctly
docker-compose -f docker-compose.prod.yml logs -f

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### 4. Verify Deployment

```bash
# Test backend health
curl http://localhost:8080/api/v1/health

# Test frontend
curl http://localhost:80
```

---

## Deployment Options

## 1. Docker Compose (VPS/Dedicated Server)

**Best for:** Small to medium deployments, single-server setup

### A. Basic VPS Setup (Ubuntu/Debian)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Clone repository
git clone https://github.com/YOUR_USERNAME/task-board.git
cd task-board

# Configure environment
cp env.production.example .env
nano .env

# Deploy
docker-compose -f docker-compose.prod.yml up -d --build
```

### B. With Nginx Reverse Proxy + SSL

**Install Nginx and Certbot:**

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

**Configure Nginx** (`/etc/nginx/sites-available/taskboard`):

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable and get SSL:**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/taskboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

### C. Using Traefik (Alternative Reverse Proxy)

Create `docker-compose.traefik.yml`:

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=your@email.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - taskboard-network

  backend:
    # ... your backend config
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.yourdomain.com`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.backend.loadbalancer.server.port=8080"

  frontend:
    # ... your frontend config
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.frontend.loadbalancer.server.port=80"
```

---

## 2. Cloud Platform Deployments

### A. AWS (Amazon Web Services)

#### Option 1: AWS ECS (Elastic Container Service)

**1. Push images to ECR:**

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Create repositories
aws ecr create-repository --repository-name taskboard-backend
aws ecr create-repository --repository-name taskboard-frontend

# Build and push backend
cd backend
docker build -t taskboard-backend .
docker tag taskboard-backend:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/taskboard-backend:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/taskboard-backend:latest

# Build and push frontend
cd ../frontend
docker build -f Dockerfile.prod -t taskboard-frontend .
docker tag taskboard-frontend:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/taskboard-frontend:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/taskboard-frontend:latest
```

**2. Set up infrastructure:**

- Create RDS PostgreSQL instance
- Create ElastiCache Redis cluster
- Create ECS Cluster
- Create Task Definitions for backend and frontend
- Create ALB (Application Load Balancer)
- Configure target groups and listeners
- Create ECS Services

**3. Use AWS CLI or Terraform (see `deployment/aws/` directory)**

#### Option 2: AWS Lightsail (Simpler, Fixed Pricing)

```bash
# Create Lightsail container service
aws lightsail create-container-service \
  --service-name taskboard \
  --power small \
  --scale 1

# Deploy containers
aws lightsail create-container-service-deployment \
  --service-name taskboard \
  --containers file://lightsail-containers.json \
  --public-endpoint file://lightsail-endpoint.json
```

### B. Google Cloud Platform (GCP)

#### Using Cloud Run (Serverless)

```bash
# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and push backend
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/taskboard-backend
gcloud run deploy taskboard-backend \
  --image gcr.io/YOUR_PROJECT_ID/taskboard-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DB_HOST=$DB_HOST,DB_PASSWORD=$DB_PASSWORD,JWT_SECRET=$JWT_SECRET

# Build and push frontend
cd ../frontend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/taskboard-frontend -f Dockerfile.prod
gcloud run deploy taskboard-frontend \
  --image gcr.io/YOUR_PROJECT_ID/taskboard-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars REACT_APP_API_URL=https://taskboard-backend-xxx.run.app/api/v1
```

### C. DigitalOcean

#### Using App Platform

1. **Via DigitalOcean Dashboard:**
   - Go to App Platform → Create App
   - Connect your GitHub repository
   - Configure components:
     - Backend: Dockerfile at `backend/Dockerfile`
     - Frontend: Dockerfile at `frontend/Dockerfile.prod`
   - Add PostgreSQL database
   - Add Redis database
   - Configure environment variables
   - Deploy

2. **Via doctl CLI:**

```bash
# Install doctl
snap install doctl
doctl auth init

# Create app spec (see deployment/digitalocean/app.yaml)
doctl apps create --spec deployment/digitalocean/app.yaml
```

### D. Heroku

```bash
# Login
heroku login

# Create app
heroku create taskboard-backend
heroku create taskboard-frontend

# Add PostgreSQL and Redis
heroku addons:create heroku-postgresql:mini -a taskboard-backend
heroku addons:create heroku-redis:mini -a taskboard-backend

# Set config vars
heroku config:set JWT_SECRET=your_secret -a taskboard-backend

# Deploy backend
cd backend
git subtree push --prefix backend heroku main

# Deploy frontend
cd ../frontend
git subtree push --prefix frontend heroku main
```

### E. Azure

#### Using Azure Container Instances

```bash
# Login
az login

# Create resource group
az group create --name taskboard-rg --location eastus

# Create PostgreSQL
az postgres flexible-server create \
  --resource-group taskboard-rg \
  --name taskboard-db \
  --location eastus \
  --admin-user dbadmin \
  --admin-password YourPassword123! \
  --sku-name Standard_B1ms

# Create container registry
az acr create --resource-group taskboard-rg --name taskboardacr --sku Basic

# Build and push images
az acr build --registry taskboardacr --image taskboard-backend:latest ./backend
az acr build --registry taskboardacr --image taskboard-frontend:latest ./frontend -f Dockerfile.prod

# Deploy container instances
az container create \
  --resource-group taskboard-rg \
  --name taskboard-backend \
  --image taskboardacr.azurecr.io/taskboard-backend:latest \
  --dns-name-label taskboard-api \
  --ports 8080 \
  --environment-variables \
    DB_HOST=taskboard-db.postgres.database.azure.com \
    JWT_SECRET=your_secret
```

---

## 3. Kubernetes Deployment

See `deployment/kubernetes/` directory for complete manifests.

**Quick Deploy:**

```bash
# Apply all manifests
kubectl apply -f deployment/kubernetes/

# Check status
kubectl get pods -n taskboard
kubectl get services -n taskboard

# Get external IP
kubectl get service taskboard-frontend -n taskboard
```

**Using Helm:**

```bash
# Install from helm chart
helm install taskboard ./deployment/helm/taskboard

# Upgrade
helm upgrade taskboard ./deployment/helm/taskboard

# Uninstall
helm uninstall taskboard
```

---

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | PostgreSQL host | `postgres` or `db.example.com` | ✅ |
| `DB_PORT` | PostgreSQL port | `5432` | ✅ |
| `DB_USER` | Database user | `postgres` | ✅ |
| `DB_PASSWORD` | Database password | `strong_password_here` | ✅ |
| `DB_NAME` | Database name | `taskboard` | ✅ |
| `REDIS_HOST` | Redis host | `redis` or `cache.example.com` | ✅ |
| `REDIS_PORT` | Redis port | `6379` | ✅ |
| `JWT_SECRET` | JWT signing key | `min_32_char_random_string` | ✅ |
| `JWT_EXPIRY` | Token expiry | `24h` | ❌ (default: 24h) |
| `PORT` | Backend port | `8080` | ❌ (default: 8080) |
| `CORS_ORIGIN` | Allowed origins | `https://app.example.com` | ✅ |
| `REACT_APP_API_URL` | Backend API URL | `https://api.example.com/api/v1` | ✅ |

### Generating Secure Secrets

```bash
# Generate strong database password
openssl rand -base64 32

# Generate JWT secret (64 bytes recommended)
openssl rand -base64 64

# Or use random strings
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1
```

---

## Security Checklist

Before going to production:

- [ ] **Environment Variables**: All secrets stored securely (not in code)
- [ ] **JWT Secret**: Strong, random, and unique (min 32 characters)
- [ ] **Database Password**: Strong and unique
- [ ] **CORS**: Configured to only allow your frontend domain
- [ ] **HTTPS**: SSL/TLS enabled (use Let's Encrypt)
- [ ] **Firewall**: Only necessary ports open (80, 443)
- [ ] **Database**: Not publicly accessible (use private network)
- [ ] **Redis**: Password protected or on private network
- [ ] **Docker Images**: Using specific versions (not `latest`)
- [ ] **Updates**: System and dependencies up to date
- [ ] **Backups**: Database backup strategy in place
- [ ] **Monitoring**: Health checks and alerts configured
- [ ] **Rate Limiting**: API rate limiting implemented
- [ ] **Logging**: Centralized logging configured

### Additional Security Headers

Add these to your reverse proxy (Nginx/Traefik):

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

---

## Monitoring & Maintenance

### Health Checks

**Backend:**
```bash
curl http://localhost:8080/api/v1/health
```

**Frontend:**
```bash
curl http://localhost:80/health
```

### Log Management

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Export logs to file
docker-compose -f docker-compose.prod.yml logs > logs.txt
```

### Database Backups

**PostgreSQL Backup:**

```bash
# Create backup directory
mkdir -p backups

# Manual backup
docker exec taskboard-postgres pg_dump -U postgres taskboard > backups/taskboard_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup (add to crontab)
0 2 * * * docker exec taskboard-postgres pg_dump -U postgres taskboard > /path/to/backups/taskboard_$(date +\%Y\%m\%d).sql
```

**Restore:**

```bash
docker exec -i taskboard-postgres psql -U postgres taskboard < backups/taskboard_20250101.sql
```

### Updates and Maintenance

```bash
# Pull latest code
git pull origin main

# Rebuild and restart services
docker-compose -f docker-compose.prod.yml up -d --build

# Remove old images
docker image prune -a
```

### Monitoring Tools (Recommended)

- **Prometheus + Grafana**: Metrics and dashboards
- **ELK Stack**: Log aggregation and analysis
- **Sentry**: Error tracking
- **Uptime Robot**: Uptime monitoring
- **Datadog/New Relic**: APM and monitoring

---

## Troubleshooting

### Container won't start

```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs backend

# Check container status
docker ps -a

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Database connection issues

```bash
# Test database connectivity
docker exec taskboard-backend ping postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Verify environment variables
docker exec taskboard-backend env | grep DB_
```

### WebSocket connection fails

- Ensure your reverse proxy supports WebSocket upgrade
- Check CORS settings
- Verify firewall allows WebSocket connections
- Check browser console for specific errors

### High memory usage

```bash
# Check container stats
docker stats

# Restart services to clear memory
docker-compose -f docker-compose.prod.yml restart
```

### SSL Certificate issues

```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

---

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_board_id ON tasks(board_id);
CREATE INDEX idx_boards_user_id ON boards(user_id);

-- Analyze tables
ANALYZE tasks;
ANALYZE boards;
ANALYZE users;
```

### Redis Caching

Configure Redis for session storage and caching:

```go
// In your backend code
cache.Set("user:"+userID, userData, 1*time.Hour)
```

### Frontend Optimization

- Enable gzip compression (already in nginx.prod.conf)
- Use CDN for static assets
- Implement code splitting
- Enable browser caching

---

## Scaling

### Horizontal Scaling

**Load Balancer Setup:**

```yaml
# docker-compose.scale.yml
services:
  backend:
    # ... same config
    deploy:
      replicas: 3
  
  load-balancer:
    image: nginx:alpine
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
    depends_on:
      - backend
```

**Nginx Load Balancer Config:**

```nginx
upstream backend {
    least_conn;
    server backend:8080 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

### Database Scaling

- Use managed database services (AWS RDS, GCP Cloud SQL)
- Enable read replicas for read-heavy workloads
- Implement connection pooling
- Consider database sharding for very large datasets

---

## CI/CD Integration

### GitHub Actions Example

See `.github/workflows/deploy.yml` for automated deployments.

### GitLab CI Example

See `.gitlab-ci.yml` for automated deployments.

---

## Support

For deployment issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review logs: `docker-compose logs -f`
3. Open an issue on GitHub
4. Check documentation: [README.md](README.md) and [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

**🎉 Congratulations! Your TaskBoard is now deployed to production!**

