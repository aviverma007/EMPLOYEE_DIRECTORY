@echo off
title Employee Directory - One Command Start
setlocal EnableDelayedExpansion

REM 🚀 Employee Directory - One Command Start (Windows)
cls
echo ===========================================
echo 🚀 EMPLOYEE DIRECTORY - ONE COMMAND START
echo ===========================================
echo.

REM Quick check if already running
curl -s http://localhost:8001/api/employees >nul 2>&1
set backend_running=%errorlevel%
curl -s http://localhost:3000 >nul 2>&1  
set frontend_running=%errorlevel%

if %backend_running%==0 if %frontend_running%==0 (
    echo [SUCCESS] Application is already running!
    echo.
    echo 🌐 Access URLs:
    echo    Frontend: http://localhost:3000
    echo    Backend:  http://localhost:8001/api/
    echo.
    echo 📊 All features are available!
    pause
    exit /b 0
)

REM Check for Docker
where docker >nul 2>&1 && where docker-compose >nul 2>&1
if %errorlevel%==0 (
    echo 🐳 Docker available! Choose your method:
    echo 1^) Docker ^(Easiest - Zero setup^)
    echo 2^) Local development ^(Manual setup^)
    echo.
    set /p choice="Select option (1 or 2, default 1): "
    if "!choice!"=="" set choice=1
    
    if "!choice!"=="1" (
        goto :docker_setup
    )
)

:local_setup
echo [INFO] Setting up local development...

REM Check prerequisites
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Install from https://python.org/
    pause
    exit /b 1
)

echo [SUCCESS] Prerequisites found!

REM Create environment files
echo [INFO] Setting up environment...
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

(
echo REACT_APP_BACKEND_URL=http://localhost:8001
echo GENERATE_SOURCEMAP=false
) > frontend\.env

REM Install dependencies if needed
if not exist "backend\venv" (
    echo [INFO] Setting up Python environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
)

if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    where yarn >nul 2>&1
    if %errorlevel%==0 (
        yarn install
    ) else (
        npm install
    )
    cd ..
)

REM Start MongoDB if needed
net start MongoDB >nul 2>&1

REM Clean existing processes
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Start services
echo [INFO] Starting backend...
cd backend
start /B "" cmd /c "call venv\Scripts\activate && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload > ..\backend.log 2>&1"
cd ..

echo [INFO] Starting frontend...
cd frontend
where yarn >nul 2>&1
if %errorlevel%==0 (
    start /B "" cmd /c "yarn start > ..\frontend.log 2>&1"
) else (
    start /B "" cmd /c "npm start > ..\frontend.log 2>&1"
)
cd ..

echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Wait for services
:check_backend
curl -s http://localhost:8001/api/employees >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto :check_backend
)

:check_frontend  
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto :check_frontend
)

echo.
echo ===========================================
echo ✅ EMPLOYEE DIRECTORY RUNNING!
echo.
echo 🌐 Access URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8001/api/
echo.
echo 📊 Features Available:
echo    ✅ Employee Directory ^(Google Sheets^)
echo    ✅ Advanced Search ^& Filtering  
echo    ✅ Image Upload ^& Management
echo    ✅ Attendance Tracking
echo    ✅ Hierarchy Builder with Org Chart
echo    ✅ Mobile Responsive UI
echo.
echo 📄 Logs:
echo    Backend: type backend.log
echo    Frontend: type frontend.log
echo.
echo 🛑 To stop: Close this window
echo ===========================================
echo.

echo [INFO] Application running! Press any key to view logs...
pause >nul
type backend.log frontend.log 2>nul
pause
exit /b 0

:docker_setup
echo [INFO] Starting with Docker...
if not exist "data" mkdir data

docker-compose down >nul 2>&1
echo [INFO] Building and starting services...
docker-compose up --build -d

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker containers
    pause
    exit /b 1
)

timeout /t 20 /nobreak >nul

echo.
echo ===========================================
echo ✅ EMPLOYEE DIRECTORY RUNNING!
echo.
echo 🌐 Access URLs:
echo    Main App: http://localhost
echo    Frontend: http://localhost:3000  
echo    Backend:  http://localhost:8001/api/
echo.
echo 📊 All features available!
echo 🛑 To stop: docker-compose down
echo ===========================================
echo.

pause
exit /b 0