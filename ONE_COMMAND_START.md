# 🚀 Employee Directory - ONE COMMAND START

## ⚡ Super Quick Start (Choose Any)

### Method 1: Universal Scripts
```bash
# Linux/Mac
./start

# Windows
start.bat

# Python (Cross-platform)
python3 start.py
```

### Method 2: Docker (Recommended)
```bash
docker-compose up --build
```
Access: http://localhost

### Method 3: NPM Script
```bash
npm start
```

### Method 4: Direct Commands
```bash
# Terminal 1 - Backend
cd backend && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 - Frontend  
cd frontend && yarn start
```

## 🎯 What You Get Instantly

✅ **Complete Employee Directory** with:
- 640+ employees from Google Sheets
- Advanced search with 8 filter fields
- Real-time dropdown suggestions
- Card/List view toggle
- Professional glass-morphism UI

✅ **Image Upload System** with:
- Drag-and-drop interface
- File validation (5MB limit)
- Preview before upload
- Base64 storage in MongoDB

✅ **Attendance Tracking** with:
- Daily attendance status
- Check-in/out times
- Hours worked calculation
- Status badges (Present/Late/Absent)

✅ **Hierarchy Builder** with:
- Visual org chart with connecting lines
- Table view with all employee details
- Drag-and-drop hierarchy creation
- Export/import functionality

✅ **Mobile Responsive** design for all devices

## 🌐 Access URLs

After running any start command:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001/api/
- **Single URL**: http://localhost (Docker only)
- **Network Access**: http://YOUR_IP:3000

## 📋 Prerequisites

### For Local Development:
- **Node.js 16+** (https://nodejs.org/)  
- **Python 3.8+** (https://python.org/)
- **MongoDB** (https://mongodb.com/try/download/community)

### For Docker (Easiest):
- **Docker & Docker Compose** only!

## ⚠️ Troubleshooting

### Services Already Running?
If you see "already running" messages:
```bash
# Check current status
curl http://localhost:8001/api/employees
curl http://localhost:3000

# Your app is ready at the URLs above!
```

### MongoDB Issues?
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### Port Conflicts?
```bash
# Kill existing processes
pkill -f uvicorn
pkill -f "yarn start"
pkill -f "npm start"

# Or use kill-port (if available)
npx kill-port 8001 3000
```

### Dependencies Missing?
```bash
# Backend
cd backend && pip install -r requirements.txt

# Frontend  
cd frontend && yarn install
```

## 🔧 Advanced Options

### Environment Customization
Edit `.env` files in `backend/` and `frontend/` folders:

```bash
# Backend (.env)
DATA_SOURCE=sheets  # or 'excel' for local files
GOOGLE_SHEETS_URL=your_sheets_url
MONGO_URL=your_mongodb_url

# Frontend (.env)  
REACT_APP_BACKEND_URL=http://your_server:8001
```

### Data Sources
- **Google Sheets**: Live sync from CSV export (default)
- **Excel Upload**: Upload .xlsx files via UI
- **Manual Entry**: Direct employee data entry

### Docker Customization
```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose up --build --force-recreate
```

## 📊 API Endpoints

Once running, these endpoints are available:

```
GET    /api/employees              # All employees
GET    /api/employees/search       # Search with suggestions  
POST   /api/employees/filter       # Multi-field filtering
GET    /api/field-values           # Dropdown values
POST   /api/employees/{id}/image   # Upload image
GET    /api/employees/{id}/image   # Get image
DELETE /api/employees/{id}/image   # Delete image
GET    /api/employees/{id}/attendance  # Get attendance
POST   /api/refresh-data          # Refresh from source
```

## 🏆 Success Indicators

You know it's working when you see:

1. **Backend Ready**: 
   - Console shows "Uvicorn running on http://0.0.0.0:8001"
   - http://localhost:8001/api/employees returns JSON

2. **Frontend Ready**:
   - Console shows "webpack compiled successfully"  
   - http://localhost:3000 shows the Employee Directory

3. **Full Integration**:
   - Search works and shows suggestions
   - Employee cards display properly
   - Image upload functionality works
   - Attendance data loads in modals

## 🎉 You're Done!

Your Employee Directory is now running with:
- Professional UI with modern design
- Full-text search across all employee fields
- Real-time image upload and management
- Attendance tracking and reporting
- Organizational hierarchy visualization
- Mobile-responsive interface

Access it at http://localhost:3000 and start managing your employee directory!

---

**Need help?** Check the main README.md or DEPLOYMENT.md for detailed instructions.