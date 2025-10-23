# 🚀 TaskBoard - Quick Start Guide

## ⚡ TL;DR - Get Running in 60 Seconds

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/task-board.git
cd task-board

# Start everything with Docker
docker-compose up -d --build

# Wait ~30 seconds, then visit:
# http://localhost:3000
```

That's it! 🎉

---

## 📋 What Just Happened?

Docker Compose automatically:
1. ✅ Started PostgreSQL database (port 5432)
2. ✅ Started Redis cache (port 6379)
3. ✅ Built and started Go backend API (port 8080)
4. ✅ Built and started React frontend (port 3000)
5. ✅ Connected everything together

---

## 🎯 First Steps

### 1. Open the App
Navigate to: **http://localhost:3000**

### 2. Register Your Account
- Click **"Sign up"**
- Enter your details:
  - Email: `test@example.com`
  - Username: `testuser`
  - Password: `password123`
  - First/Last Name: (optional)
- Click **"Register"**

### 3. Login
- Email: `test@example.com`
- Password: `password123`
- Click **"Sign in"**

### 4. Create Your First Board
- Click **"+ New Board"** button
- Title: `My First Project`
- Description: `Getting started with TaskBoard`
- Click **"Create Board"**

### 5. Add Tasks
- Click **"Open Board"** on your new board
- Click **"+ Add New Task"**
- Title: `Complete the quick start guide`
- Priority: `High`
- Click **"Create Task"**

### 6. Complete Your First Task
- Click **▶️** button to move task to "In Progress"
- Click **✅** button to mark as "Done"
- Watch your productivity score update! 📈

---

## 🔧 Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Just frontend
docker-compose logs -f frontend
```

### Stop the Application
```bash
docker-compose down
```

### Restart Everything
```bash
docker-compose down
docker-compose up -d --build
```

### Reset Database (fresh start)
```bash
docker-compose down --volumes
docker-compose up -d --build
```

---

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React UI |
| **Backend API** | http://localhost:8080/api/v1 | REST API |
| **WebSocket** | ws://localhost:8080/api/v1/ws | Real-time updates |
| **PostgreSQL** | localhost:5432 | Database (internal) |
| **Redis** | localhost:6379 | Cache (internal) |

---

## 📊 Testing the API Directly

### Get a JWT Token
```bash
# Register
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"api@test.com","username":"apiuser","password":"test123"}'

# Login (save the token)
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"api@test.com","password":"test123"}'
```

### Create a Board
```bash
curl -X POST http://localhost:8080/api/v1/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"API Test Board","description":"Testing the API"}'
```

---

## 🐛 Troubleshooting

### Frontend shows blank page
**Solution**: Wait 30-60 seconds for the build to complete, then refresh.

### "Connection refused" errors
**Solution**: Make sure Docker is running and containers are up:
```bash
docker-compose ps
```

### Database connection errors
**Solution**: Reset the database:
```bash
docker-compose down --volumes
docker-compose up -d --build
```

### Port already in use
**Solution**: Change ports in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Frontend
  - "8081:8080"  # Backend
```

### WebSocket not connecting
**Solution**: 
1. Check browser console for errors
2. Verify backend is running: `docker-compose logs backend`
3. Try refreshing the page

---

## 🎓 Next Steps

1. **Explore the Code**:
   - Backend: `backend/internal/`
   - Frontend: `frontend/src/`
   - Read: `ARCHITECTURE.md`

2. **Customize**:
   - Modify `backend/.env` for configuration
   - Update UI colors in `frontend/src/index.css`

3. **Deploy**:
   - Push to GitHub (see `setup-github.md`)
   - Deploy to cloud (AWS, Heroku, DigitalOcean)

4. **Extend**:
   - Add tests
   - Implement new features
   - Add CI/CD pipeline

---

## 📚 Documentation

- **Main README**: `README.md` - Full documentation
- **Architecture**: `ARCHITECTURE.md` - System design details
- **GitHub Setup**: `setup-github.md` - Push to GitHub
- **Contributing**: `CONTRIBUTING.md` - Contribution guidelines

---

## ✅ Health Check

Verify everything is working:

```bash
# Check all containers are running
docker-compose ps

# Expected output:
# NAME                 STATUS
# task-board-backend   Up
# task-board-frontend  Up
# task-board-postgres  Up
# task-board-redis     Up

# Test backend health
curl http://localhost:8080/api/v1/health

# Open frontend
start http://localhost:3000  # Windows
open http://localhost:3000   # Mac
xdg-open http://localhost:3000  # Linux
```

---

## 🎉 You're Ready!

Your TaskBoard is up and running. Start creating boards and managing tasks!

**Need help?** Check the main README or open an issue on GitHub.

**Want to contribute?** See CONTRIBUTING.md

---

**Happy Task Managing! 📋✨**

