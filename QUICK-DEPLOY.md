# 🚀 Quick Deploy Guide

Choose your deployment method and follow the steps:

## 🎯 Choose Your Platform

### 1️⃣ VPS/Dedicated Server (Recommended for Beginners)

**Best for:** Full control, predictable costs, learning

```bash
# 1. Clone repository on your server
git clone https://github.com/YOUR_USERNAME/task-board.git
cd task-board

# 2. Configure environment
cp env.production.example .env
nano .env  # Edit with your values

# 3. Run deployment script
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh

# 4. Setup SSL (optional but recommended)
sudo chmod +x scripts/setup-nginx-ssl.sh
sudo ./scripts/setup-nginx-ssl.sh
```

**Estimated time:** 10-15 minutes  
**Cost:** $5-20/month (DigitalOcean, Linode, Vultr)

---

### 2️⃣ DigitalOcean App Platform (Easiest)

**Best for:** Managed deployment, automatic scaling

1. Fork/clone repository to GitHub
2. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
3. Click "Create App" → Connect GitHub repository
4. Configure:
   - Backend: `backend/Dockerfile`
   - Frontend: `frontend/Dockerfile.prod`
   - Add PostgreSQL database
   - Add Redis database
5. Set environment variables
6. Deploy!

**Estimated time:** 5-10 minutes  
**Cost:** $12-30/month

---

### 3️⃣ AWS (Enterprise)

**Best for:** Scalability, AWS ecosystem integration

```bash
# 1. Install AWS CLI
aws configure

# 2. Create ECR repositories
aws ecr create-repository --repository-name taskboard-backend
aws ecr create-repository --repository-name taskboard-frontend

# 3. Build and push images
# Backend
cd backend
docker build -t taskboard-backend .
docker tag taskboard-backend:latest ACCOUNT.dkr.ecr.REGION.amazonaws.com/taskboard-backend:latest
docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/taskboard-backend:latest

# Frontend
cd ../frontend
docker build -f Dockerfile.prod -t taskboard-frontend .
docker tag taskboard-frontend:latest ACCOUNT.dkr.ecr.REGION.amazonaws.com/taskboard-frontend:latest
docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/taskboard-frontend:latest

# 4. Use ECS, Lightsail, or EC2 to deploy
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed AWS instructions.

**Estimated time:** 30-60 minutes  
**Cost:** Variable ($20-200+/month)

---

### 4️⃣ Google Cloud Run (Serverless)

**Best for:** Automatic scaling, pay-per-use

```bash
# 1. Install gcloud CLI
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Deploy backend
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/taskboard-backend
gcloud run deploy taskboard-backend \
  --image gcr.io/YOUR_PROJECT_ID/taskboard-backend \
  --platform managed \
  --allow-unauthenticated

# 3. Deploy frontend
cd ../frontend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/taskboard-frontend -f Dockerfile.prod
gcloud run deploy taskboard-frontend \
  --image gcr.io/YOUR_PROJECT_ID/taskboard-frontend \
  --platform managed \
  --allow-unauthenticated
```

**Estimated time:** 15-20 minutes  
**Cost:** Pay-per-use (typically $5-30/month)

---

### 5️⃣ Kubernetes (Advanced)

**Best for:** Large scale, multi-region, high availability

```bash
# 1. Create secrets
kubectl create secret generic taskboard-secrets -n taskboard \
  --from-literal=db-password=YOUR_PASSWORD \
  --from-literal=jwt-secret=YOUR_JWT_SECRET

# 2. Update ConfigMap and Deployments with your values

# 3. Deploy
cd deployment/kubernetes
./deploy.sh

# Or use kubectl apply
kubectl apply -k .
```

See [deployment/kubernetes/README.md](deployment/kubernetes/README.md) for details.

**Estimated time:** 30-45 minutes  
**Cost:** Variable ($50-500+/month)

---

### 6️⃣ Heroku (Quick & Easy)

**Best for:** Rapid prototyping, hobby projects

```bash
# 1. Install Heroku CLI and login
heroku login

# 2. Create apps
heroku create taskboard-api
heroku create taskboard-app

# 3. Add databases
heroku addons:create heroku-postgresql:mini -a taskboard-api
heroku addons:create heroku-redis:mini -a taskboard-api

# 4. Set environment variables
heroku config:set JWT_SECRET=your_secret -a taskboard-api
heroku config:set DATABASE_URL=... -a taskboard-api

# 5. Deploy backend
cd backend
heroku git:remote -a taskboard-api
git push heroku main

# 6. Deploy frontend
cd ../frontend
heroku git:remote -a taskboard-app
git push heroku main
```

**Estimated time:** 15-20 minutes  
**Cost:** $7-25/month (with basic addons)

---

## 📋 Pre-Deployment Checklist

Before deploying, make sure you have:

- [ ] **Database**: PostgreSQL instance ready
- [ ] **Cache**: Redis instance ready
- [ ] **Secrets**: Strong passwords and JWT secret generated
- [ ] **Domain**: (Optional) Domain name configured
- [ ] **SSL**: (Production) SSL certificate ready

### Generate Secure Secrets

```bash
# Database Password
openssl rand -base64 32

# JWT Secret
openssl rand -base64 64
```

---

## 🔐 Environment Variables

Required for all deployments:

```env
# Database
DB_HOST=your-database-host
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=strong_password_here
DB_NAME=taskboard

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379

# JWT
JWT_SECRET=very_long_random_string_min_32_chars
JWT_EXPIRY=24h

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Frontend
REACT_APP_API_URL=https://your-backend-domain.com/api/v1
```

---

## 🧪 Test Your Deployment

After deployment:

```bash
# 1. Test backend health
curl https://your-backend-domain.com/api/v1/health

# 2. Register a user
curl -X POST https://your-backend-domain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","password":"test123"}'

# 3. Login
curl -X POST https://your-backend-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 4. Visit your frontend URL in browser
```

---

## 🆘 Troubleshooting

### Backend won't start
- Check environment variables
- Verify database connection
- Check logs: `docker logs` or platform-specific logs

### Frontend shows blank page
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings on backend
- Check browser console for errors

### Database connection failed
- Verify database is running
- Check connection credentials
- Ensure network/firewall allows connection

### WebSocket not working
- Verify proxy supports WebSocket upgrade
- Check CORS configuration
- Ensure no firewall blocking WebSocket

---

## 📚 Additional Resources

- **Full Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Kubernetes Details**: [deployment/kubernetes/README.md](deployment/kubernetes/README.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Main README**: [README.md](README.md)

---

## 🎉 Success!

Once deployed, your TaskBoard should be accessible at your configured domain!

**Next Steps:**
1. Create your first account
2. Set up automated backups
3. Configure monitoring
4. Enable HTTPS (if not already)
5. Set up CI/CD (optional)

---

**Need Help?** Open an issue on GitHub or check the troubleshooting section in [DEPLOYMENT.md](DEPLOYMENT.md)

