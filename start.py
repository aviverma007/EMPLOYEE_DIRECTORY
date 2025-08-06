#!/usr/bin/env python3

"""
Employee Directory - Single Command Startup
This script starts both frontend and backend with one command
"""

import os
import sys
import subprocess
import time
import platform
import threading
from urllib.request import urlopen
from urllib.error import URLError

def print_colored(text, color_code):
    """Print colored text to console"""
    if platform.system() == "Windows":
        print(text)
    else:
        print(f"\033[{color_code}m{text}\033[0m")

def log_info(message):
    print_colored(f"[INFO] {message}", "34")

def log_success(message):
    print_colored(f"[SUCCESS] {message}", "32")

def log_error(message):
    print_colored(f"[ERROR] {message}", "31")

def log_warning(message):
    print_colored(f"[WARNING] {message}", "33")

def check_command(command):
    """Check if a command exists"""
    try:
        subprocess.run([command, "--version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def check_port(port):
    """Check if a port is accessible"""
    try:
        urlopen(f"http://localhost:{port}", timeout=1)
        return True
    except URLError:
        return False

def wait_for_service(url, service_name, max_attempts=30):
    """Wait for a service to be ready"""
    log_info(f"Waiting for {service_name} to be ready...")
    
    for attempt in range(max_attempts):
        try:
            urlopen(url, timeout=2)
            log_success(f"{service_name} is ready!")
            return True
        except URLError:
            print(".", end="", flush=True)
            time.sleep(2)
    
    log_error(f"{service_name} failed to start within expected time")
    return False

def get_local_ip():
    """Get local IP address"""
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

def create_env_files():
    """Create environment files"""
    log_info("Setting up environment files...")
    
    # Backend .env
    backend_env = """MONGO_URL=mongodb://localhost:27017/employee_directory
DATA_SOURCE=excel
EXCEL_FILE_PATH=./data/EMPLOYEE_DIR.xlsx
HOST=0.0.0.0
PORT=8001
SECRET_KEY=employee-directory-secret-key
DEBUG=True"""

    # Frontend .env
    frontend_env = """REACT_APP_BACKEND_URL=http://localhost:8001
GENERATE_SOURCEMAP=false"""

    with open("backend/.env", "w") as f:
        f.write(backend_env)
    
    with open("frontend/.env", "w") as f:
        f.write(frontend_env)
    
    log_success("Environment files created!")

def install_dependencies():
    """Install dependencies if needed"""
    log_info("Checking dependencies...")
    
    # Check backend dependencies
    if not os.path.exists("backend/venv") and not check_command("uvicorn"):
        log_info("Installing backend dependencies...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"], check=True)
            log_success("Backend dependencies installed!")
        except subprocess.CalledProcessError:
            log_error("Failed to install backend dependencies")
    
    # Check frontend dependencies
    if not os.path.exists("frontend/node_modules"):
        log_info("Installing frontend dependencies...")
        try:
            os.chdir("frontend")
            if check_command("yarn"):
                subprocess.run(["yarn", "install"], check=True)
            else:
                subprocess.run(["npm", "install"], check=True)
            os.chdir("..")
            log_success("Frontend dependencies installed!")
        except subprocess.CalledProcessError:
            log_error("Failed to install frontend dependencies")
            os.chdir("..")

def start_backend():
    """Start backend server"""
    log_info("Starting backend server...")
    
    try:
        os.chdir("backend")
        if os.path.exists("venv"):
            # Use virtual environment if available
            if platform.system() == "Windows":
                python_path = "venv\\Scripts\\python.exe"
            else:
                python_path = "venv/bin/python"
        else:
            python_path = sys.executable
        
        process = subprocess.Popen([
            python_path, "-m", "uvicorn", "server:app", 
            "--host", "0.0.0.0", "--port", "8001", "--reload"
        ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        
        os.chdir("..")
        return process
    
    except Exception as e:
        log_error(f"Failed to start backend: {e}")
        os.chdir("..")
        return None

def start_frontend():
    """Start frontend server"""
    log_info("Starting frontend server...")
    
    try:
        os.chdir("frontend")
        
        if check_command("yarn"):
            process = subprocess.Popen(["yarn", "start"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        else:
            process = subprocess.Popen(["npm", "start"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        
        os.chdir("..")
        return process
    
    except Exception as e:
        log_error(f"Failed to start frontend: {e}")
        os.chdir("..")
        return None

def stream_output(process, prefix):
    """Stream process output with prefix"""
    for line in iter(process.stdout.readline, ''):
        if line.strip():
            print(f"[{prefix}] {line.strip()}")

def main():
    """Main function"""
    print("===========================================")
    print("🚀 EMPLOYEE DIRECTORY - ONE COMMAND START")
    print("===========================================")
    print()
    
    # Check if services are already running
    if check_port(8001) and check_port(3000):
        log_success("Services already running!")
        ip = get_local_ip()
        print(f"""
===========================================
✅ APPLICATION READY!

🌐 Access URLs:
   Frontend: http://{ip}:3000
   Backend:  http://{ip}:8001/api/

📊 Features Available:
   • Employee Directory
   • Advanced Search & Filtering
   • Image Upload
   • Attendance Tracking
   • Hierarchy Builder

🛑 Services already running via supervisor
===========================================""")
        return
    
    # Check prerequisites
    log_info("Checking prerequisites...")
    
    if not check_command("python3") and not check_command("python"):
        log_error("Python is not installed. Please install Python 3.8+ from https://python.org/")
        sys.exit(1)
    
    if not check_command("node"):
        log_error("Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/")
        sys.exit(1)
    
    log_success("All prerequisites found!")
    
    # Setup
    create_env_files()
    install_dependencies()
    
    # Start services
    backend_process = start_backend()
    if not backend_process:
        log_error("Failed to start backend")
        sys.exit(1)
    
    # Wait a bit for backend to initialize
    time.sleep(3)
    
    frontend_process = start_frontend()
    if not frontend_process:
        log_error("Failed to start frontend")
        backend_process.terminate()
        sys.exit(1)
    
    # Start output streaming threads
    backend_thread = threading.Thread(target=stream_output, args=(backend_process, "Backend"))
    frontend_thread = threading.Thread(target=stream_output, args=(frontend_process, "Frontend"))
    
    backend_thread.daemon = True
    frontend_thread.daemon = True
    
    backend_thread.start()
    frontend_thread.start()
    
    # Wait for services to be ready
    backend_ready = wait_for_service("http://localhost:8001/api/employees", "Backend")
    frontend_ready = wait_for_service("http://localhost:3000", "Frontend")
    
    if backend_ready and frontend_ready:
        ip = get_local_ip()
        print(f"""
===========================================
✅ APPLICATION READY!

🌐 Access URLs:
   Frontend: http://{ip}:3000
   Backend:  http://{ip}:8001/api/

📊 Features Available:
   • Employee Directory (Google Sheets Data)
   • Advanced Search & Filtering
   • Image Upload
   • Attendance Tracking
   • Hierarchy Builder

🛑 To stop: Press Ctrl+C
===========================================""")
        
        try:
            # Keep running
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            log_info("Shutting down services...")
            frontend_process.terminate()
            backend_process.terminate()
            log_success("Services stopped!")
    else:
        log_error("Failed to start services")
        frontend_process.terminate()
        backend_process.terminate()
        sys.exit(1)

if __name__ == "__main__":
    main()