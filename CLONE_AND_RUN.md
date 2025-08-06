# 📦 Employee Directory - Ready to Clone & Run

## 🎯 What You're Getting

A **complete, production-ready Employee Directory** with:

✅ **Modern Full-Stack Architecture**
- FastAPI backend with MongoDB
- React frontend with Tailwind CSS  
- Professional glass-morphism UI design
- Mobile-responsive across all devices

✅ **Complete Employee Management**
- Google Sheets integration (640+ employees)
- Advanced search with 8 filter fields
- Real-time dropdown suggestions
- Image upload with drag-and-drop
- Attendance tracking system
- Organizational hierarchy builder

✅ **Zero-Configuration Startup**
- One-command start scripts for all platforms
- Docker support for instant deployment
- Auto-setup of environment variables
- Automatic dependency installation

## 🚀 Clone & Start (3 Steps)

### Step 1: Clone/Download
```bash
git clone <this-repository>
cd employee-directory
```

### Step 2: Choose Your Method

**Option A: Docker (Easiest)**
```bash
docker-compose up --build
```
Access: http://localhost

**Option B: One-Command Scripts**
```bash
# Linux/Mac
./start

# Windows  
start.bat

# Cross-platform Python
python3 start.py
```

**Option C: NPM Start**
```bash
npm start
```

### Step 3: Access Your App
- Frontend: http://localhost:3000
- Backend: http://localhost:8001/api/
- Network: http://YOUR_IP:3000

## 📋 Prerequisites (Local Only)

**Docker Method**: No prerequisites needed!

**Local Method**:
- Node.js 16+ (https://nodejs.org/)
- Python 3.8+ (https://python.org/)
- MongoDB (https://mongodb.com/try/download/community)

## 🌟 Features Ready to Use

### Employee Directory
- Search 640+ employees from Google Sheets
- Filter by name, department, location, code, mobile, extension
- Card and list view toggle
- Click employee for detailed modal with attendance

### Image Upload System  
- Drag-and-drop image upload
- File validation (5MB limit, multiple formats)
- Real-time preview and cropping
- Base64 storage in MongoDB

### Attendance Tracking
- Daily attendance with status (Present/Late/Half Day/Absent)
- Check-in/out times with hours calculation
- Color-coded status badges
- Historical attendance data

### Hierarchy Builder
- Visual organizational chart with connecting lines
- Table view with employee details
- Drag-and-drop hierarchy creation
- Department-based organization

### Modern UI/UX
- Glass-morphism design effects
- Smooth animations and transitions
- Toast notifications for user feedback
- Loading states and skeleton UI
- Dark/light theme toggle

## 🔧 Customization Options

### Data Sources
Switch between data sources by editing `backend/.env`:
```env
DATA_SOURCE=sheets    # Google Sheets (default)  
DATA_SOURCE=excel     # Local Excel files
DATA_SOURCE=upload    # Manual upload
```

### Styling  
Customize colors and theme in `frontend/src/App.css`:
```css
:root {
  --primary-blue: #2563eb;
  --secondary-blue: #1d4ed8; 
  --glass-bg: rgba(255, 255, 255, 0.1);
}
```

### API Configuration
Backend settings in `backend/.env`:
```env
MONGO_URL=mongodb://localhost:27017/employee_directory
HOST=0.0.0.0
PORT=8001
SECRET_KEY=your-secret-key
DEBUG=True
```

Frontend settings in `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
GENERATE_SOURCEMAP=false
```

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FastAPI Backend │    │    MongoDB      │
│   (Port 3000)   │────│   (Port 8001)   │────│   (Port 27017)  │
│                 │    │                 │    │                 │
│ • Employee UI   │    │ • REST APIs     │    │ • Employee Data │
│ • Search Forms  │    │ • Image Upload  │    │ • Image Storage │
│ • Image Upload  │    │ • Google Sheets │    │ • Attendance    │
│ • Hierarchy     │    │ • Attendance    │    │ • Hierarchies   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔗 Integration Points

### Google Sheets Integration
- Automatically fetches employee data from CSV export
- Real-time synchronization 
- Column mapping for different sheet formats
- Fallback to local data if sheets unavailable

### Database Schema
```javascript
// Employee Document
{
  "emp_code": "12345",
  "emp_name": "John Doe", 
  "department": "IT",
  "location": "New York",
  "designation": "Senior Developer",
  "mobile": "+1234567890",
  "extension_number": "1001",
  "image_url": "data:image/jpeg;base64,..."
}
```

## 🛡️ Security Features

- File upload validation (type, size, content)
- Input sanitization for all API endpoints  
- Environment variable configuration
- Base64 image storage (no file system access)
- CORS protection for cross-origin requests
- Error handling with proper HTTP status codes

## 🚨 Troubleshooting

### App Won't Start?
1. Check prerequisites are installed
2. Ensure ports 3000, 8001, 27017 are free
3. Try Docker method for zero-config startup
4. Check logs in backend.log and frontend.log

### No Data Showing?
1. Check Google Sheets URL is accessible
2. Verify MongoDB is running
3. Test API endpoint: http://localhost:8001/api/employees
4. Check browser console for JavaScript errors

### Images Not Loading?
1. Verify file size is under 5MB
2. Check supported formats: JPEG, PNG, GIF, WEBP
3. Test image upload API directly
4. Check MongoDB storage capacity

## 📈 Performance Notes

- **Frontend**: React 19 with optimized builds
- **Backend**: FastAPI with async/await patterns  
- **Database**: MongoDB with indexed queries
- **Images**: Base64 encoding for simplicity
- **Caching**: Browser caching for static assets

## 🎉 Ready for Production

This application is designed for:

- **Company Internal Networks** (192.168.x.x)
- **Employee Management** (up to 1000+ employees)
- **Department-Level Access** with search and filtering
- **HR and Administrative Use** with attendance tracking
- **Cross-Platform Deployment** (Windows, Linux, Mac)

### Scaling Considerations
- MongoDB can handle 10,000+ employees easily
- Frontend optimized for large datasets
- API endpoints support pagination and filtering
- Image storage scales with MongoDB GridFS if needed

---

## 🏁 Final Result

After cloning and running one command, you'll have:

🌐 **A fully functional employee directory** accessible from your browser
📊 **Real employee data** from Google Sheets integration  
🖼️ **Image upload capability** with professional UI
📈 **Attendance tracking** with status indicators
🏗️ **Hierarchy management** with visual org charts
📱 **Mobile-responsive design** that works on all devices
🎨 **Professional UI** with modern glass-morphism effects

**Perfect for any organization looking for a complete employee management solution!**

---

*Built with FastAPI, React, MongoDB, and Tailwind CSS for modern web standards.*