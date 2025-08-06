# 🚀 Employee Directory - One Command Start

## Super Quick Start (Choose One)

### Option 1: Universal Script (Recommended)
```bash
# Linux/Mac
./run.sh

# Windows
run.bat
```

### Option 2: Docker (Easiest)
```bash
docker-compose up --build
```
Then access: http://localhost

### Option 3: NPM Script
```bash
npm start
```

### Option 4: Direct Commands
```bash
# Backend
cd backend && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (new terminal)
cd frontend && yarn start
```

## What You Get

✅ **Full Employee Directory** running on:
- Frontend: http://localhost:3000
- Backend: http://localhost:8001/api/
- Combined: http://localhost (with Docker)

✅ **All Features Working**:
- Employee search & filtering
- Image upload
- Attendance tracking  
- Hierarchy builder
- Google Sheets integration

## Prerequisites

**For Local Development:**
- Node.js 16+ 
- Python 3.8+
- MongoDB (auto-started on Windows)

**For Docker:**
- Docker & Docker Compose only!

## Troubleshooting

**MongoDB not running?**
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

**Ports busy?**
```bash
# Kill processes on ports 8001, 3000
npx kill-port 8001 3000
```

**Dependencies missing?**
```bash
cd backend && pip install -r requirements.txt
cd frontend && yarn install
```

## Pro Tips

- Use `docker-compose logs -f` to see all logs
- Access http://YOUR_IP:3000 from other devices on network  
- Check `backend.log` and `frontend.log` for debugging
- Run `docker-compose down` to stop all Docker services

---

**That's it! Your Employee Directory is ready in one command! 🎉**