#!/usr/bin/env node

/**
 * Employee Directory - Cross-platform Single Command Startup
 * This script provides a unified way to start the application across all platforms
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(level, message) {
    const timestamp = new Date().toLocaleTimeString();
    const colorMap = {
        INFO: colors.blue,
        SUCCESS: colors.green,
        WARNING: colors.yellow,
        ERROR: colors.red
    };
    
    console.log(`${colorMap[level]}[${level}]${colors.reset} ${timestamp} - ${message}`);
}

function commandExists(command) {
    return new Promise((resolve) => {
        exec(`${os.platform() === 'win32' ? 'where' : 'which'} ${command}`, (error) => {
            resolve(!error);
        });
    });
}

function isPortInUse(port) {
    return new Promise((resolve) => {
        const command = os.platform() === 'win32' 
            ? `netstat -an | findstr :${port}`
            : `lsof -i :${port}`;
        
        exec(command, (error, stdout) => {
            resolve(stdout.trim().length > 0);
        });
    });
}

function killPort(port) {
    return new Promise((resolve) => {
        const command = os.platform() === 'win32'
            ? `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /f /pid %a`
            : `lsof -ti:${port} | xargs kill -9`;
        
        exec(command, () => resolve());
    });
}

function waitForService(url, serviceName, maxAttempts = 30) {
    return new Promise(async (resolve) => {
        log('INFO', `Waiting for ${serviceName} to be ready...`);
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    log('SUCCESS', `${serviceName} is ready!`);
                    resolve(true);
                    return;
                }
            } catch (error) {
                // Service not ready yet
            }
            
            process.stdout.write('.');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        log('ERROR', `${serviceName} failed to start within expected time`);
        resolve(false);
    });
}

function createEnvironmentFiles() {
    log('INFO', 'Setting up environment files...');
    
    // Backend .env
    const backendEnv = `MONGO_URL=mongodb://localhost:27017/employee_directory
DATA_SOURCE=sheets
GOOGLE_SHEETS_URL=https://docs.google.com/spreadsheets/d/1bqpCqiYaP4cB7M0eaqfKL6Q9ZBfcJ2QiW8P9YqQA1cA/export?format=csv
EXCEL_FILE_PATH=./data/EMPLOYEE_DIR.xlsx
HOST=0.0.0.0
PORT=8001
SECRET_KEY=employee-directory-secret-key
DEBUG=True`;

    // Frontend .env
    const frontendEnv = `REACT_APP_BACKEND_URL=http://localhost:8001
GENERATE_SOURCEMAP=false`;

    fs.writeFileSync(path.join(__dirname, '../backend/.env'), backendEnv);
    fs.writeFileSync(path.join(__dirname, '../frontend/.env'), frontendEnv);
    
    log('SUCCESS', 'Environment files created!');
}

function installDependencies() {
    return new Promise(async (resolve) => {
        log('INFO', 'Checking dependencies...');
        
        // Check if backend venv exists
        const backendVenvPath = path.join(__dirname, '../backend/venv');
        const frontendNodeModulesPath = path.join(__dirname, '../frontend/node_modules');
        
        const promises = [];
        
        // Backend dependencies
        if (!fs.existsSync(backendVenvPath)) {
            log('INFO', 'Installing backend dependencies...');
            promises.push(new Promise((resolve) => {
                const isWindows = os.platform() === 'win32';
                const pythonCmd = isWindows ? 'python' : 'python3';
                const venvScript = isWindows ? 'venv\\Scripts\\activate' : 'venv/bin/activate';
                
                exec(`cd backend && ${pythonCmd} -m venv venv`, (error) => {
                    if (error) {
                        log('ERROR', 'Failed to create Python virtual environment');
                        resolve();
                        return;
                    }
                    
                    const activateAndInstall = isWindows 
                        ? `cd backend && call ${venvScript} && pip install -r requirements.txt`
                        : `cd backend && source ${venvScript} && pip install -r requirements.txt`;
                    
                    exec(activateAndInstall, (error) => {
                        if (error) {
                            log('ERROR', 'Failed to install Python dependencies');
                        } else {
                            log('SUCCESS', 'Backend dependencies installed!');
                        }
                        resolve();
                    });
                });
            }));
        }
        
        // Frontend dependencies
        if (!fs.existsSync(frontendNodeModulesPath)) {
            log('INFO', 'Installing frontend dependencies...');
            promises.push(new Promise(async (resolve) => {
                const hasYarn = await commandExists('yarn');
                const installCmd = hasYarn ? 'yarn install' : 'npm install';
                
                exec(`cd frontend && ${installCmd}`, (error) => {
                    if (error) {
                        log('ERROR', 'Failed to install frontend dependencies');
                    } else {
                        log('SUCCESS', 'Frontend dependencies installed!');
                    }
                    resolve();
                });
            }));
        }
        
        await Promise.all(promises);
        resolve();
    });
}

async function startServices() {
    log('INFO', 'Starting services...');
    
    // Clean up existing processes
    await killPort(8001);
    await killPort(3000);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isWindows = os.platform() === 'win32';
    
    // Start backend
    log('INFO', 'Starting backend server...');
    const backendCommand = isWindows
        ? 'cmd /c "cd backend && call venv\\Scripts\\activate && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload"'
        : 'bash -c "cd backend && source venv/bin/activate && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload"';
    
    const backend = spawn(backendCommand, { shell: true, stdio: 'pipe' });
    backend.stdout.on('data', (data) => {
        process.stdout.write(`[Backend] ${data}`);
    });
    
    // Start frontend
    log('INFO', 'Starting frontend server...');
    const hasYarn = await commandExists('yarn');
    const frontendCommand = isWindows
        ? `cmd /c "cd frontend && ${hasYarn ? 'yarn start' : 'npm start'}"`
        : `bash -c "cd frontend && ${hasYarn ? 'yarn start' : 'npm start'}"`;
    
    const frontend = spawn(frontendCommand, { shell: true, stdio: 'pipe' });
    frontend.stdout.on('data', (data) => {
        process.stdout.write(`[Frontend] ${data}`);
    });
    
    // Wait for services to be ready
    const backendReady = await waitForService('http://localhost:8001/api/employees', 'Backend');
    const frontendReady = await waitForService('http://localhost:3000', 'Frontend');
    
    if (backendReady && frontendReady) {
        // Get IP address
        const networkInterfaces = os.networkInterfaces();
        let ip = 'localhost';
        
        for (const name of Object.keys(networkInterfaces)) {
            for (const net of networkInterfaces[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    ip = net.address;
                    break;
                }
            }
        }
        
        console.log(`
===========================================
✅ APPLICATION READY!

🌐 Access URLs:
   Frontend: http://${ip}:3000
   Backend:  http://${ip}:8001/api/

📊 Features Available:
   • Employee Directory (Google Sheets Data)
   • Advanced Search & Filtering
   • Image Upload
   • Attendance Tracking
   • Hierarchy Builder

🛑 To stop: Press Ctrl+C
===========================================`);
        
        // Handle cleanup on exit
        process.on('SIGINT', () => {
            log('INFO', 'Shutting down services...');
            backend.kill();
            frontend.kill();
            process.exit(0);
        });
        
        // Keep process running
        setInterval(() => {}, 1000);
        
    } else {
        log('ERROR', 'Failed to start services');
        process.exit(1);
    }
}

async function main() {
    console.log(`
===========================================
🚀 EMPLOYEE DIRECTORY - ONE COMMAND START
===========================================
`);

    try {
        // Check prerequisites
        log('INFO', 'Checking prerequisites...');
        
        const hasNode = await commandExists('node');
        const hasPython = await commandExists(os.platform() === 'win32' ? 'python' : 'python3');
        
        if (!hasNode) {
            log('ERROR', 'Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/');
            process.exit(1);
        }
        
        if (!hasPython) {
            log('ERROR', 'Python is not installed. Please install Python 3.8+ from https://python.org/');
            process.exit(1);
        }
        
        log('SUCCESS', 'All prerequisites found!');
        
        // Setup environment
        createEnvironmentFiles();
        
        // Install dependencies
        await installDependencies();
        
        // Start services
        await startServices();
        
    } catch (error) {
        log('ERROR', `Failed to start application: ${error.message}`);
        process.exit(1);
    }
}

// Handle global fetch (Node.js 18+ has fetch, for older versions we'd need node-fetch)
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

main().catch(console.error);