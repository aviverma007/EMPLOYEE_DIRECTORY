# Employee Directory - Complete Full-Stack Application

A comprehensive Employee Directory application with **Excel file integration**, advanced search, image uploads, attendance tracking, and hierarchy management.

## 🌟 Features

- **Employee Management**: Complete CRUD operations for employee data
- **Excel File Integration**: Load employee data from local Excel files (**Primary Data Source**)
- **Google Sheets Support**: Optional sync from Google Sheets CSV (backup source)
- **Advanced Search**: 6+ searchable fields with dropdown suggestions
- **Image Upload**: Employee photo management with drag-and-drop
- **Attendance Tracking**: Daily attendance with status indicators
- **Hierarchy Builder**: Visual org chart and table view
- **Responsive Design**: Mobile-friendly glass-morphism UI
- **Dark/Light Theme**: Toggle between themes

## 📊 Excel File Configuration

### Default Excel File Location
```
C:\EmployeeDirectoryServer\EMPLOPYEE DIR.xlsx
```

### Required Excel Column Headers
```
| EMP ID | EMP NAME | DEPARTMENT | LOCATION | GRADE | MOBILE | EXTENSION NUMBER |
|--------|----------|------------|----------|-------|--------|------------------|
| 12345  | John Doe | IT         | NYC      | L3    | 123456 | 1001            |
```

## 🚀 ONE COMMAND START ⚡

### Super Quick Start (Choose Any)
```bash
# Universal scripts (Linux/Mac/Windows)
./run.sh          # Linux/Mac
run.bat           # Windows

# Docker (Recommended - Zero setup)
docker-compose up --build

# NPM script (Cross-platform)
npm start

# Direct command
cd backend && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload &
cd frontend && yarn start
```

### Prerequisites (For Local Dev Only)
- **Node.js 16+**: [Download here](https://nodejs.org/)
- **Python 3.8+**: [Download here](https://python.org/)
- **MongoDB**: [Download here](https://www.mongodb.com/try/download/community)

*Docker setup requires NO prerequisites - just Docker!*

### Manual Setup
```batch
# 1. Install dependencies
cd frontend
npm install

cd ../backend  
pip install -r requirements.txt

# 2. Configure environment
# Backend (.env in backend folder):
MONGO_URL=mongodb://localhost:27017/employee_directory
EXCEL_FILE_PATH=C:\EmployeeDirectoryServer\EMPLOPYEE DIR.xlsx
DATA_SOURCE=excel
HOST=0.0.0.0
PORT=8001

# Frontend (.env in frontend folder):
REACT_APP_BACKEND_URL=http://YOUR_SERVER_IP

# 3. Build frontend
cd frontend
npm run build

# 4. Start services
net start MongoDB
cd backend && python -m uvicorn server:app --host 0.0.0.0 --port 8001
cd frontend && npx serve -s build -l 3000
```

## 🌐 Access Your App

### After Running Any Start Command:
- **Main App**: `http://localhost` (Docker) or `http://localhost:3000` 
- **Backend API**: `http://localhost:8001/api/`
- **From Network**: `http://YOUR_IP:3000` (replace YOUR_IP with your actual IP)

### What You Get Instantly:
✅ **Employee Directory** with Google Sheets data (640+ employees)  
✅ **Advanced Search** with 6+ filter fields and suggestions  
✅ **Image Upload** with drag-and-drop interface  
✅ **Attendance System** with status tracking  
✅ **Hierarchy Builder** with visual org chart  
✅ **Modern UI** with glass-morphism design  
✅ **Mobile Responsive** design

## 📋 System Requirements

### Minimum Specifications
- **CPU**: 2+ cores (4+ recommended)
- **RAM**: 4GB minimum (8GB+ recommended)  
- **Storage**: 20GB available space
- **OS**: Windows 10+, Ubuntu 20.04+, CentOS 8+

### Software Stack
- **Backend**: FastAPI (Python)
- **Frontend**: React 19 with Tailwind CSS
- **Database**: MongoDB 5.0+
- **Reverse Proxy**: Nginx (optional, for single URL)

## 📊 API Endpoints

### Employee Management
```
GET    /api/employees              # Get all employees
GET    /api/employees/search       # Search with suggestions
GET    /api/employees/filter       # Multi-field filtering
GET    /api/field-values           # Get dropdown values
POST   /api/refresh-data          # Refresh from data source
```

### Image Management
```
POST   /api/employees/{id}/image   # Upload employee image
GET    /api/employees/{id}/image   # Get employee image  
DELETE /api/employees/{id}/image   # Delete employee image
```

### Attendance & Hierarchy
```
GET    /api/employees/{id}/attendance    # Get attendance
GET    /api/department/{name}/employees  # Department filter
POST   /api/hierarchy/save              # Save hierarchy
GET    /api/hierarchy/list              # List hierarchies
```

## 🔧 Configuration

### Data Sources
Configure in backend `.env`:
```env
# Excel File (PRIMARY - Default)
DATA_SOURCE=excel
EXCEL_FILE_PATH=C:\EmployeeDirectoryServer\EMPLOPYEE DIR.xlsx

# Google Sheets (Optional backup)
DATA_SOURCE=sheets
GOOGLE_SHEETS_URL=https://docs.google.com/spreadsheets/d/ID/export?format=csv

# Upload (runtime)
DATA_SOURCE=upload
```

### Database Schema
Employee fields supported:
- `emp_code` (required)
- `emp_name` (required) 
- `department` (required)
- `location` (required)
- `designation` (required)
- `mobile` (required)
- `extension_number`
- `email`
- `joining_date`
- `reporting_manager`

## 🛡️ Security

### Network Security
- Internal network deployment (192.168.x.x)
- Firewall rules for specific ports
- MongoDB bound to localhost only

### File Upload Security  
- 5MB file size limit
- Image format validation (JPEG, PNG, GIF, WEBP)
- Base64 storage in MongoDB
- Content type validation

## 🔄 Deployment Options

### Option 1: Single URL (Nginx)
- All traffic through port 80
- Frontend and API unified
- Professional deployment

### Option 2: Direct Ports
- Frontend: Port 3000
- Backend: Port 8001  
- Development/testing friendly

### Option 3: Docker (Advanced)
```dockerfile
# Dockerfile example available
# Use docker-compose for full stack
```

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly interface
- Mobile-optimized cards and tables
- Progressive Web App features

## 🎨 Customization

### Themes
- Built-in dark/light theme toggle
- Professional blue color scheme
- Glass-morphism effects
- Customizable CSS variables

### Branding
Update in `/frontend/src/App.css`:
```css
:root {
  --primary-blue: #2563eb;
  --secondary-blue: #1d4ed8;
  --light-blue: #dbeafe;
}
```

## 🚨 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB service
net start MongoDB
# or
sudo systemctl start mongod
```

**Port Already in Use**
```bash
# Check what's using ports
netstat -ano | findstr :8001
netstat -ano | findstr :3000
```

**Dependencies Missing**  
```bash
# Backend
pip install -r requirements.txt

# Frontend  
npm install
```

**Build Failures**
```bash
# Clear cache and rebuild
npm cache clean --force
rm -rf node_modules
npm install
npm run build
```

## 📞 Support

For issues and feature requests:
1. Check the troubleshooting section
2. Review logs in `/var/log/supervisor/` (Linux)
3. Check browser console for frontend errors
4. Verify all prerequisites are installed

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🙏 Acknowledgments

- FastAPI for the robust backend framework
- React team for the excellent frontend library  
- MongoDB for flexible data storage
- Tailwind CSS for beautiful styling

---

**Built with ❤️ for efficient employee management**