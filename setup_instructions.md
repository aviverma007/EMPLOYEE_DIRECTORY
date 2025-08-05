# 🚀 Employee Directory - Local Setup Guide

## Prerequisites
Install these on your machine:
- **Node.js** v16+ : https://nodejs.org/
- **Python** v3.8+ : https://python.org/
- **MongoDB** Community: https://www.mongodb.com/try/download/community
- **VS Code**: https://code.visualstudio.com/

## Project Structure
```
employee-directory/
├── backend/                 # FastAPI backend
│   ├── server.py           # Main server file
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styles
│   │   └── index.js       # React entry point
│   ├── public/            # Static files
│   ├── package.json       # Node dependencies
│   └── .env              # Frontend environment
└── README.md             # This file
```

## 🛠️ Setup Instructions

### 1. Create Project Directory
```bash
mkdir employee-directory
cd employee-directory
```

### 2. Set up Backend
```bash
mkdir backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your MongoDB URL
echo 'MONGO_URL="mongodb://localhost:27017"' > .env
echo 'DB_NAME="employee_directory"' >> .env
```

### 3. Set up Frontend  
```bash
cd ../
mkdir frontend
cd frontend

# Install dependencies
npm install
# or
yarn install

# Create .env file
echo 'REACT_APP_BACKEND_URL=http://localhost:8001' > .env
```

### 4. Start MongoDB
```bash
# Start MongoDB service
# Windows (if installed as service):
net start MongoDB

# macOS (with Homebrew):
brew services start mongodb-community

# Linux:
sudo systemctl start mongod

# Or run directly:
mongod --dbpath /path/to/your/data/directory
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python server.py
```
Backend will run on: http://localhost:8001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# or
yarn start
```
Frontend will run on: http://localhost:3000

## 🌐 Access Your Application
Open your browser and go to: **http://localhost:3000**

## ✨ Features Available
- ✅ Employee search with 8 filter fields
- ✅ Google Sheets integration (642+ employees)
- ✅ Card/List view toggle
- ✅ Employee image upload
- ✅ Attendance tracking
- ✅ Dark/Light theme
- ✅ Modern glass-morphism UI

## 🔧 Troubleshooting
1. **MongoDB Connection Issues**: Ensure MongoDB is running
2. **Port Conflicts**: Change ports in .env files if 8001/3000 are busy
3. **CORS Issues**: Backend has CORS enabled for localhost:3000
4. **Dependencies**: Run `pip install -r requirements.txt` and `npm install`

## 📊 API Endpoints
- GET `/api/employees` - All employees
- GET `/api/employees/search` - Search with suggestions
- POST `/api/employees/filter` - Filter employees
- POST `/api/employees/{emp_code}/image` - Upload image
- GET `/api/employees/{emp_code}/image` - Get image
- DELETE `/api/employees/{emp_code}/image` - Delete image

Happy coding! 🎉