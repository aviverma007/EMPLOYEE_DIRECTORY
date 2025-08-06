@echo off
title Employee Directory - Single Command Startup
cls

REM Employee Directory - Single Command Startup Script
REM This script runs the entire application with one command

echo ===========================================
echo 🚀 EMPLOYEE DIRECTORY - ONE COMMAND START
echo ===========================================
echo.

REM Check if Docker is available
where docker >nul 2>&1
if %errorlevel% equ 0 (
    where docker-compose >nul 2>&1
    if %errorlevel% equ 0 (
        echo Docker is available. Choose your preferred method:
        echo 1^) Docker ^(Recommended - Easiest setup^)
        echo 2^) Local development ^(Node.js + Python required^)
        echo.
        set /p choice="Select option (1 or 2): "
        
        if "!choice!"=="1" (
            goto :docker_setup
        )
    )
)

:local_setup
echo [INFO] Starting local development setup...

REM Check prerequisites
echo [INFO] Checking prerequisites...

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ from https://python.org/
    pause
    exit /b 1
)

REM Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if %errorlevel% neq 0 (
    echo [INFO] Starting MongoDB...
    net start MongoDB >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] MongoDB is not installed or failed to start. Please install MongoDB Community from https://mongodb.com/try/download/community
        pause
        exit /b 1
    )
)

echo [SUCCESS] All prerequisites found!

REM Clean up existing processes
echo [INFO] Cleaning up existing processes...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Setup environment variables
echo [INFO] Setting up environment...

REM Backend environment
(
echo MONGO_URL=mongodb://localhost:27017/employee_directory
echo DATA_SOURCE=sheets
echo GOOGLE_SHEETS_URL=https://docs.google.com/spreadsheets/d/1bqpCqiYaP4cB7M0eaqfKL6Q9ZBfcJ2QiW8P9YqQA1cA/export?format=csv
echo EXCEL_FILE_PATH=./data/EMPLOYEE_DIR.xlsx
echo HOST=0.0.0.0
echo PORT=8001
echo SECRET_KEY=employee-directory-secret-key
echo DEBUG=True
) > backend\.env

REM Frontend environment
(
echo REACT_APP_BACKEND_URL=http://localhost:8001
echo GENERATE_SOURCEMAP=false
) > frontend\.env

echo [SUCCESS] Environment configured!

REM Install dependencies if needed
if not exist "backend\venv" (
    echo [INFO] Setting up Python virtual environment...
    cd backend
    python -m venv venv
    cd ..
)

if not exist "backend\venv\Scripts\python.exe" (
    echo [INFO] Installing Python dependencies...
    cd backend
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
)

if not exist "frontend\node_modules" (
    echo [INFO] Installing Node.js dependencies...
    cd frontend
    where yarn >nul 2>&1
    if %errorlevel% equ 0 (
        yarn install
    ) else (
        npm install
    )
    cd ..
)

echo [SUCCESS] Dependencies ready!

REM Start services
echo [INFO] Starting backend server...
cd backend
start /B "" cmd /c "call venv\Scripts\activate && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload > ..\backend.log 2>&1"
cd ..

echo [INFO] Starting frontend server...
cd frontend
where yarn >nul 2>&1
if %errorlevel% equ 0 (
    start /B "" cmd /c "yarn start > ..\frontend.log 2>&1"
) else (
    start /B "" cmd /c "npm start > ..\frontend.log 2>&1"
)
cd ..

REM Wait for services to be ready
echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Try to detect backend readiness
:check_backend
curl -s http://localhost:8001/api/employees >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto :check_backend
)

REM Try to detect frontend readiness
:check_frontend
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto :check_frontend
)

REM Get IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do set IP=%%a
set IP=%IP: =%

echo.
echo ===========================================
echo ✅ APPLICATION READY!
echo.
echo 🌐 Access URLs:
echo    Frontend: http://%IP%:3000
echo    Backend:  http://%IP%:8001/api/
echo.
echo 📊 Features Available:
echo    • Employee Directory ^(Google Sheets Data^)
echo    • Advanced Search ^& Filtering
echo    • Image Upload
echo    • Attendance Tracking
echo    • Hierarchy Builder
echo.
echo 📄 Logs:
echo    Backend: type backend.log
echo    Frontend: type frontend.log
echo.
echo 🛑 To stop: Close this window or Press Ctrl+C
echo ===========================================
echo.

REM Keep window open and show status
echo [INFO] Application running! Close this window to stop...
:loop
timeout /t 30 /nobreak >nul
goto loop

:docker_setup
echo [INFO] Starting with Docker...

REM Check if sample data exists
if not exist "data\EMPLOYEE_DIR.xlsx" (
    echo [WARNING] Creating sample data directory...
    mkdir data 2>nul
)

REM Stop existing containers
echo [INFO] Stopping existing containers...
docker-compose down >nul 2>&1

REM Build and start services
echo [INFO] Building and starting services...
docker-compose up --build -d

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker containers
    pause
    exit /b 1
)

REM Wait for services
echo [INFO] Waiting for services to be ready...
timeout /t 20 /nobreak >nul

REM Get IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do set IP=%%a
set IP=%IP: =%

echo.
echo ===========================================
echo ✅ APPLICATION READY!
echo.
echo 🌐 Access URLs:
echo    Main App: http://%IP%
echo    Frontend: http://%IP%:3000
echo    Backend:  http://%IP%:8001/api/
echo.
echo 📊 Features Available:
echo    • Employee Directory
echo    • Advanced Search ^& Filtering
echo    • Image Upload
echo    • Attendance Tracking
echo    • Hierarchy Builder
echo.
echo 🛑 To stop: docker-compose down
echo 📋 Logs: docker-compose logs -f
echo ===========================================
echo.

REM Keep window open
echo [INFO] Services running in background. Press any key to view logs...
pause >nul
docker-compose logs -f

exit