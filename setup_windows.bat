@echo off
echo =====================================
echo  EMPLOYEE DIRECTORY SETUP (WINDOWS)
echo =====================================
echo.

echo [1/7] Installing Frontend Dependencies...
cd /d "%~dp0\frontend"
npm install
if %errorlevel% neq 0 (
    echo ✗ Frontend dependencies failed. Please install Node.js from https://nodejs.org/
    pause
    exit
)
echo ✓ Frontend dependencies installed
echo.

echo [2/7] Installing Backend Dependencies...
cd /d "%~dp0\backend"
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ✗ Backend dependencies failed. Please install Python from https://python.org/
    pause
    exit
)
echo ✓ Backend dependencies installed
echo.

echo [3/7] Detecting Server IP...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do set SERVER_IP=%%a
set SERVER_IP=%SERVER_IP: =%
echo ✓ Server IP detected: %SERVER_IP%
echo.

echo [4/7] Configuring Backend Environment...
(
echo MONGO_URL=mongodb://localhost:27017/employee_directory
echo EXCEL_FILE_PATH=C:\EmployeeDirectoryServer\EMPLOPYEE DIR.xlsx
echo DATA_SOURCE=excel
echo HOST=0.0.0.0
echo PORT=8001
echo SECRET_KEY=employee-directory-secret-key
echo DEBUG=False
) > .env
echo ✓ Backend environment configured for Excel data source
echo.

echo [5/7] Configuring Frontend Environment...
cd /d "%~dp0\frontend"
echo REACT_APP_BACKEND_URL=http://%SERVER_IP% > .env
echo ✓ Frontend environment configured
echo.

echo [6/7] Building Frontend for Production...
npm run build
if %errorlevel% neq 0 (
    echo ✗ Frontend build failed
    pause
    exit
)
echo ✓ Frontend built successfully
echo.

echo [7/7] Downloading Nginx for Single URL Access...
cd /d "%~dp0"
if not exist nginx\nginx.exe (
    echo Downloading Nginx...
    powershell -Command "Invoke-WebRequest -Uri 'http://nginx.org/download/nginx-1.24.0.zip' -OutFile 'nginx.zip'"
    powershell -Command "Expand-Archive -Path 'nginx.zip' -DestinationPath '.' -Force"
    ren nginx-1.24.0 nginx
    del nginx.zip
)

echo Creating Nginx configuration...
(
echo worker_processes  1;
echo events {
echo     worker_connections  1024;
echo }
echo http {
echo     include       mime.types;
echo     default_type  application/octet-stream;
echo     sendfile        on;
echo     keepalive_timeout  65;
echo     
echo     server {
echo         listen       80;
echo         server_name  %SERVER_IP%;
echo         
echo         location / {
echo             root   %~dp0frontend/build;
echo             index  index.html index.htm;
echo             try_files $uri $uri/ /index.html;
echo         }
echo         
echo         location /api/ {
echo             proxy_pass http://127.0.0.1:8001;
echo             proxy_set_header Host $host;
echo             proxy_set_header X-Real-IP $remote_addr;
echo             client_max_body_size 10M;
echo         }
echo     }
echo }
) > nginx\conf\nginx.conf

echo ✓ Nginx configured
echo.

echo [FINAL] Configuring Windows Firewall...
netsh advfirewall firewall delete rule name="Employee Directory" >nul 2>&1
netsh advfirewall firewall add rule name="Employee Directory" dir=in action=allow protocol=TCP localport=80 >nul 2>&1
echo ✓ Firewall configured
echo.

echo =====================================
echo   ✅ SETUP COMPLETE!
echo   
echo   📋 Next Steps:
echo   1. Install MongoDB Community Server
echo   2. Run: start_server.bat
echo   3. Access: http://%SERVER_IP%
echo   
echo   📁 Files Created:
echo   • start_server.bat (Start application)
echo   • stop_server.bat (Stop application)
echo   
echo =====================================
pause