# Employee Directory - Deployment Guide

## 🚀 Quick Deployment Commands

### For Windows Server (Recommended)

```batch
# 1. Clone/Download the application
git clone <your-repo-url> employee-directory
cd employee-directory

# 2. Ensure your Excel file is at: C:\EmployeeDirectoryServer\EMPLOPYEE DIR.xlsx

# 3. Run automatic setup
setup_windows.bat

# 4. Start the application
start_server.bat

# Access at: http://YOUR_SERVER_IP
```

**Note**: This application is pre-configured to use Excel file at `C:\EmployeeDirectoryServer\EMPLOPYEE DIR.xlsx` as the primary data source.

### For Linux/Ubuntu Server

```bash
# 1. Install dependencies
sudo apt update
sudo apt install -y python3 python3-pip nodejs npm mongodb nginx

# 2. Setup application
cd employee-directory

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration

# Frontend setup  
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your server IP
npm run build

# 3. Configure services (see full Linux guide below)
```

## 🖥️ Windows Server Deployment

### Prerequisites
- Windows Server 2016+ or Windows 10+
- Administrator access
- Internet connection for downloads

### Automatic Setup
```batch
# Download and run
setup_windows.bat
```

This script automatically:
- Installs npm/pip dependencies
- Detects server IP address
- Configures environment files
- Builds frontend for production
- Downloads and configures Nginx
- Sets up Windows Firewall rules

### Manual Setup (if automatic fails)

1. **Install Prerequisites**
   - Node.js 16+: https://nodejs.org/
   - Python 3.9+: https://python.org/
   - MongoDB Community: https://www.mongodb.com/try/download/community

2. **Configure Environment**
   ```batch
   # Backend .env
   cd backend
   copy .env.example .env
   # Edit with your settings
   
   # Frontend .env
   cd ..\frontend
   copy .env.example .env
   # Replace YOUR_SERVER_IP with actual IP
   ```

3. **Install Dependencies**
   ```batch
   cd frontend
   npm install
   npm run build
   
   cd ..\backend
   pip install -r requirements.txt
   ```

4. **Start Services**
   ```batch
   # Option A: Use provided scripts
   start_server.bat
   
   # Option B: Manual start
   net start MongoDB
   cd backend && python -m uvicorn server:app --host 0.0.0.0 --port 8001
   cd frontend && npx serve -s build -l 3000
   ```

## 🐧 Linux Server Deployment

### Ubuntu/Debian

```bash
# 1. System dependencies
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nodejs npm mongodb nginx git curl

# 2. Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 3. Application setup
cd /var/www
sudo git clone <your-repo> employee-directory
sudo chown -R $USER:$USER employee-directory
cd employee-directory

# 4. Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration

# 5. Frontend setup
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your server IP
npm run build

# 6. Configure Nginx
sudo cp ../nginx.conf.example /etc/nginx/sites-available/employee-directory
sudo ln -s /etc/nginx/sites-available/employee-directory /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 7. Setup systemd services
sudo cp ../systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable employee-directory-backend
sudo systemctl start employee-directory-backend

# 8. Configure firewall
sudo ufw allow 80
sudo ufw allow 8001
sudo ufw enable
```

### CentOS/RHEL

```bash
# 1. System dependencies
sudo yum update -y
sudo yum install -y python3 python3-pip nodejs npm mongodb-org nginx git

# 2. Start services
sudo systemctl start mongod
sudo systemctl enable mongod

# 3. Follow similar steps as Ubuntu above
```

## 🌐 Network Configuration

### Internal Network Setup
```bash
# Find your server IP
# Windows:
ipconfig | findstr IPv4

# Linux:
ip addr show | grep inet
```

### Firewall Configuration
```bash
# Windows (PowerShell as Admin)
netsh advfirewall firewall add rule name="Employee Directory" dir=in action=allow protocol=TCP localport=80

# Linux (UFW)
sudo ufw allow 80
sudo ufw allow from 192.168.0.0/16 to any port 8001

# Linux (iptables)
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -s 192.168.0.0/16 -p tcp --dport 8001 -j ACCEPT
```

## 🔧 Production Configuration

### Environment Variables
```bash
# Backend (.env)
MONGO_URL=mongodb://localhost:27017/employee_directory
DATA_SOURCE=sheets
GOOGLE_SHEETS_URL=https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv
DEBUG=False

# Frontend (.env)
REACT_APP_BACKEND_URL=http://192.168.1.100
NODE_ENV=production
```

### MongoDB Security
```javascript
// Connect to MongoDB
mongo

// Create database user
use employee_directory
db.createUser({
  user: "emp_user",
  pwd: "secure_password_here",
  roles: ["readWrite"]
})

// Update connection string
MONGO_URL=mongodb://emp_user:secure_password_here@localhost:27017/employee_directory
```

### Nginx Configuration (Single URL)
```nginx
server {
    listen 80;
    server_name YOUR_SERVER_IP;
    client_max_body_size 10M;
    
    # Frontend
    location / {
        root /var/www/employee-directory/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 🔄 Process Management

### Windows (Task Scheduler)
```batch
# Create scheduled task to start on boot
schtasks /create /tn "Employee Directory" /tr "C:\path\to\start_server.bat" /sc onstart /ru SYSTEM
```

### Linux (systemd)
```bash
# Backend service
sudo systemctl enable employee-directory-backend
sudo systemctl start employee-directory-backend

# Check status
sudo systemctl status employee-directory-backend

# View logs
sudo journalctl -u employee-directory-backend -f
```

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# API health check
curl http://localhost:8001/api/employees

# Frontend check
curl http://localhost:3000

# MongoDB check
mongo --eval "db.adminCommand('ismaster')"
```

### Log Locations
```
# Windows
- Backend: Console output or Windows Event Log
- Frontend: Browser Developer Console
- MongoDB: %ProgramFiles%\MongoDB\log\mongod.log

# Linux  
- Backend: /var/log/employee-directory/backend.log
- Frontend: Nginx access logs
- MongoDB: /var/log/mongodb/mongod.log
- Nginx: /var/log/nginx/access.log
```

### Backup Strategy
```bash
# Database backup
mongodump --db employee_directory --out /backup/$(date +%Y%m%d)

# Code backup
tar -czf /backup/employee-directory-$(date +%Y%m%d).tar.gz /var/www/employee-directory

# Automated backup script (cron)
0 2 * * * /opt/backup-employee-directory.sh
```

## 🚨 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Windows
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Linux  
sudo lsof -i :8001
sudo kill -9 <PID>
```

**MongoDB Connection Failed**
```bash
# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
sudo systemctl status mongod
```

**Nginx Won't Start**
```bash
# Test configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
```

**Build Failures**
```bash
# Clear caches
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Python issues
pip cache purge
pip install --upgrade pip
pip install -r requirements.txt
```

### Support Commands
```bash
# System information
# Windows
systeminfo

# Linux
hostnamectl
df -h
free -h
ps aux | grep -E "(python|nginx|mongo)"
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Prerequisites installed
- [ ] Server IP address identified
- [ ] Firewall ports opened (80, 8001)
- [ ] MongoDB service running
- [ ] Environment files configured

### Deployment
- [ ] Dependencies installed (npm, pip)
- [ ] Environment variables set
- [ ] Frontend built for production
- [ ] Backend running on port 8001
- [ ] Frontend accessible on port 3000 or 80
- [ ] API endpoints responding

### Post-Deployment
- [ ] Application accessible from network
- [ ] All features working (search, upload, etc.)
- [ ] Data loading from configured source
- [ ] Images uploading and displaying
- [ ] Performance acceptable
- [ ] Monitoring configured
- [ ] Backup strategy implemented

## 🆘 Getting Help

1. **Check logs** first for error messages
2. **Verify prerequisites** are correctly installed
3. **Test network connectivity** between components
4. **Review configuration files** for typos
5. **Check file permissions** on Linux systems
6. **Restart services** if configuration changed
7. **Update firewall rules** if accessing remotely

For additional support, check the main README.md file for detailed API documentation and feature explanations.