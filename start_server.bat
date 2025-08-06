@echo off
title Employee Directory Server
cls
echo =====================================
echo   EMPLOYEE DIRECTORY SERVER
echo   Single URL Access
echo =====================================
echo.

echo [1/4] Starting MongoDB...
net start MongoDB >nul 2>&1
if %errorlevel%==0 (
    echo ✓ MongoDB started successfully
) else (
    echo ✗ MongoDB start failed
    echo Please install MongoDB Community Server
    echo Download from: https://www.mongodb.com/try/download/community
    pause
    exit
)
echo.

echo [2/4] Starting Backend API...
cd /d "%~dp0\backend"
start /B "" cmd /c "call ..\venv\Scripts\activate && python -m uvicorn server:app --host 0.0.0.0 --port 8001"
echo ✓ Backend API starting on port 8001...
echo.

echo [3/4] Waiting for backend initialization...
timeout /t 8 /nobreak >nul
echo ✓ Backend ready
echo.

echo [4/4] Starting Nginx Web Server...
cd /d "%~dp0"
if exist nginx\nginx.exe (
    start /B "" nginx\nginx.exe
    echo ✓ Web server started on port 80
) else (
    echo ✗ Nginx not found. Starting frontend directly...
    cd /d "%~dp0\frontend"
    start /B "" cmd /c "npx serve -s build -l 3000"
    echo ✓ Frontend started on port 3000
)
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do set IP=%%a
set IP=%IP: =%
if defined IP (
    echo =====================================
    echo   🚀 APPLICATION READY!
    echo   
    echo   ✅ Access URLs:
    if exist nginx\nginx.exe (
        echo   👉 http://%IP%
    ) else (
        echo   👉 http://%IP%:3000
    )
    echo   
    echo   📊 Features Available:
    echo   • Employee Directory
    echo   • Search & Filtering  
    echo   • Image Upload
    echo   • Attendance Tracking
    echo   • Hierarchy Builder
    echo =====================================
) else (
    echo =====================================
    echo   🚀 APPLICATION READY!
    echo   Check your network settings for IP
    echo =====================================
)
echo.
echo Press Ctrl+C to stop all services
echo Keeping server running...

:loop
timeout /t 30 /nobreak >nul
goto loop