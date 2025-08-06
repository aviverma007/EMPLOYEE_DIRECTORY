# Employee Directory - Complete Project Structure

```
EMPLOYEE_DIRECTORY/
├── 📁 backend/                          # FastAPI Backend Server
│   ├── server.py                        # Main FastAPI application
│   ├── requirements.txt                 # Python dependencies
│   ├── .env.example                     # Environment configuration template
│   └── .env                             # Environment variables (create from example)
│
├── 📁 frontend/                         # React Frontend Application  
│   ├── 📁 public/                       # Static files
│   │   ├── index.html                   # Main HTML template
│   │   ├── manifest.json                # PWA manifest
│   │   └── favicon.ico                  # Browser icon
│   ├── 📁 src/                          # Source code
│   │   ├── App.js                       # Main React component
│   │   ├── App.css                      # Styling with Tailwind
│   │   └── HierarchyBuilder.js          # Organizational chart component
│   ├── package.json                     # NPM dependencies
│   ├── craco.config.js                  # Build configuration
│   ├── tailwind.config.js               # Tailwind CSS config
│   ├── postcss.config.js                # PostCSS configuration
│   ├── .env.example                     # Frontend environment template
│   └── .env                             # Frontend environment (create from example)
│
├── 📁 data/                             # Data storage directory
│   └── .gitkeep                         # Ensures directory exists
│
├── 📁 venv/                             # Python virtual environment (auto-created)
├── 📁 nginx/                            # Nginx configuration (auto-downloaded)
│
├── 🚀 STARTUP SCRIPTS:
│   ├── setup_windows.bat                # Complete Windows setup automation
│   ├── start_server.bat                 # Start all services
│   └── stop_server.bat                  # Stop all services
│
├── 📖 DOCUMENTATION:
│   ├── README.md                        # Main project documentation
│   ├── DEPLOYMENT.md                    # Detailed deployment guide
│   └── PROJECT_STRUCTURE.md             # This file
│
└── 🔧 CONFIG FILES:
    ├── .gitignore                       # Git ignore rules
    ├── test_result.md                   # Testing history and protocols
    └── backend_test.py                  # Backend testing script
```

## 🎯 Key Files Overview

### Core Application Files
- **`backend/server.py`** - Complete FastAPI backend with 20+ endpoints
- **`frontend/src/App.js`** - Main React application with all UI components
- **`frontend/src/HierarchyBuilder.js`** - Organizational chart and table builder
- **`frontend/src/App.css`** - Professional styling with glass-morphism effects

### Configuration Files
- **`backend/.env`** - Database, API keys, data source configuration
- **`frontend/.env`** - Backend URL and build settings
- **`backend/requirements.txt`** - Python packages (FastAPI, MongoDB, etc.)
- **`frontend/package.json`** - React, Tailwind, and build tools

### Deployment Files  
- **`setup_windows.bat`** - Complete automated setup for Windows
- **`start_server.bat`** - One-click application launcher
- **`README.md`** - Comprehensive documentation with setup instructions
- **`DEPLOYMENT.md`** - Platform-specific deployment guides

## 🚀 Quick Setup Commands

### Windows (Recommended)
```batch
# 1. Run complete setup
setup_windows.bat

# 2. Start application  
start_server.bat

# 3. Access at: http://YOUR_SERVER_IP
```

### Manual Setup (Any Platform)
```bash
# Backend setup
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings

# Frontend setup
cd ../frontend  
npm install
cp .env.example .env
# Edit .env with your server IP
npm run build

# Start services
# Terminal 1: python -m uvicorn server:app --host 0.0.0.0 --port 8001
# Terminal 2: npx serve -s build -l 3000
```

## 📦 Features Included

### ✅ Complete Feature Set
- **Employee Management**: CRUD operations with MongoDB storage
- **Google Sheets Sync**: Real-time data from Google Sheets CSV
- **Advanced Search**: 6+ fields with intelligent suggestions
- **Image Upload**: Drag-and-drop with base64 storage
- **Attendance System**: Mock daily attendance with status tracking
- **Hierarchy Builder**: Visual org chart and detailed table view
- **Excel Support**: Upload and process Excel files
- **Responsive UI**: Mobile-friendly with dark/light themes

### 🏗️ Architecture
- **Backend**: FastAPI + MongoDB + Python 3.9+
- **Frontend**: React 19 + Tailwind CSS + Modern UI
- **Database**: MongoDB with collections for employees, images, hierarchies
- **Deployment**: Single URL access via Nginx or direct ports

### 🛡️ Security Features
- File upload validation (5MB limit, format checking)
- Input sanitization and error handling
- Environment variable configuration
- Network security for internal deployment

## 📱 Access Methods

### Single URL (Professional)
- Configure Nginx for unified access
- All features at: `http://YOUR_SERVER_IP`
- Professional deployment suitable for company use

### Direct Ports (Development)
- Frontend: `http://YOUR_SERVER_IP:3000`
- Backend API: `http://YOUR_SERVER_IP:8001/api/`
- Quick testing and development

## 🔧 Customization

### Environment Configuration
Edit `.env` files to customize:
- Database connection strings
- Data sources (Google Sheets, Excel, Manual)
- Server ports and security settings
- Feature toggles and API keys

### UI Theming
Modify `frontend/src/App.css`:
- Color schemes and branding
- Professional blue theme included
- Glass-morphism effects and animations
- Responsive breakpoints

### Data Sources
Support for multiple data sources:
- **Google Sheets**: CSV export URL
- **Excel Files**: Upload and process .xlsx files  
- **Manual Entry**: Direct employee data management

## 🚨 Prerequisites

### Required Software
- **Node.js 16+**: Frontend build and runtime
- **Python 3.9+**: Backend API server
- **MongoDB Community**: Database storage
- **Git** (optional): For cloning updates

### System Requirements
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 20GB available space
- **Network**: Internal network access (192.168.x.x)
- **OS**: Windows 10+, Ubuntu 20.04+, CentOS 8+

## 🆘 Support & Troubleshooting

### Common Issues
1. **MongoDB connection**: Check if service is running
2. **Port conflicts**: Verify ports 8001 and 3000 are available  
3. **Dependencies**: Run `npm install` and `pip install -r requirements.txt`
4. **Network access**: Check firewall settings for internal access

### Debug Commands
```bash
# Check services
curl http://localhost:8001/api/employees  # Backend
curl http://localhost:3000                # Frontend

# Check logs
tail -f backend.log                       # Backend logs
F12 -> Console                           # Frontend logs
```

### Support Resources
- **README.md**: Comprehensive setup guide
- **DEPLOYMENT.md**: Platform-specific instructions  
- **test_result.md**: Testing protocols and history

---

**This is a complete, production-ready Employee Directory system ready for company deployment! 🚀**