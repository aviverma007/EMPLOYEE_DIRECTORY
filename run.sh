#!/bin/bash

# Employee Directory - Single Command Startup Script
# This script runs the entire application with one command

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to kill processes on port
kill_port() {
    if port_in_use $1; then
        print_warning "Killing processes on port $1..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local service=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service is ready!"
            return 0
        fi
        
        printf "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service failed to start within expected time"
    return 1
}

# Cleanup function
cleanup() {
    print_status "Cleaning up processes..."
    kill_port 8001  # Backend
    kill_port 3000  # Frontend
    kill_port 27017 # MongoDB
    pkill -f "uvicorn server:app" 2>/dev/null || true
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "yarn start" 2>/dev/null || true
    pkill -f "serve -s build" 2>/dev/null || true
    print_success "Cleanup completed"
}

# Trap to cleanup on exit
trap cleanup EXIT INT TERM

echo "==========================================="
echo "🚀 EMPLOYEE DIRECTORY - ONE COMMAND START"
echo "==========================================="
echo

# Check if Docker is available and user wants to use it
if command_exists docker && command_exists docker-compose; then
    echo "Docker is available. Choose your preferred method:"
    echo "1) Docker (Recommended - Easiest setup)"
    echo "2) Local development (Node.js + Python required)"
    echo
    read -p "Select option (1 or 2): " choice
    
    if [ "$choice" = "1" ]; then
        print_status "Starting with Docker..."
        
        # Check if sample data exists
        if [ ! -f "data/EMPLOYEE_DIR.xlsx" ]; then
            print_warning "Creating sample data directory..."
            mkdir -p data
        fi
        
        # Stop any existing containers
        print_status "Stopping existing containers..."
        docker-compose down 2>/dev/null || true
        
        # Build and start services
        print_status "Building and starting services..."
        docker-compose up --build -d
        
        # Wait for services
        wait_for_service "http://localhost:8001/api/employees" "Backend"
        wait_for_service "http://localhost:3000" "Frontend"
        
        # Get IP address
        IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
        
        echo
        echo "==========================================="
        echo "✅ APPLICATION READY!"
        echo
        echo "🌐 Access URLs:"
        echo "   Main App: http://$IP"
        echo "   Frontend: http://$IP:3000"
        echo "   Backend:  http://$IP:8001/api/"
        echo
        echo "📊 Features Available:"
        echo "   • Employee Directory"
        echo "   • Advanced Search & Filtering"
        echo "   • Image Upload"
        echo "   • Attendance Tracking"
        echo "   • Hierarchy Builder"
        echo
        echo "🛑 To stop: docker-compose down"
        echo "📋 Logs: docker-compose logs -f"
        echo "==========================================="
        
        # Keep script running
        print_status "Services running in background. Press Ctrl+C to view logs..."
        sleep 3
        docker-compose logs -f
        
        exit 0
    fi
fi

# Local development setup
print_status "Starting local development setup..."

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

if ! command_exists python3; then
    print_error "Python is not installed. Please install Python 3.8+ from https://python.org/"
    exit 1
fi

if ! command_exists mongod && ! pgrep mongod > /dev/null; then
    print_error "MongoDB is not installed or running. Please install MongoDB Community from https://mongodb.com/try/download/community"
    exit 1
fi

print_success "All prerequisites found!"

# Clean up any existing processes
cleanup

# Setup environment variables
print_status "Setting up environment..."

# Backend environment
cat > backend/.env << EOF
MONGO_URL=mongodb://localhost:27017/employee_directory
DATA_SOURCE=sheets
GOOGLE_SHEETS_URL=https://docs.google.com/spreadsheets/d/1bqpCqiYaP4cB7M0eaqfKL6Q9ZBfcJ2QiW8P9YqQA1cA/export?format=csv
EXCEL_FILE_PATH=./data/EMPLOYEE_DIR.xlsx
HOST=0.0.0.0
PORT=8001
SECRET_KEY=employee-directory-secret-key
DEBUG=True
EOF

# Frontend environment
cat > frontend/.env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
GENERATE_SOURCEMAP=false
EOF

print_success "Environment configured!"

# Install dependencies if needed
if [ ! -d "backend/venv" ] || [ ! -d "frontend/node_modules" ]; then
    print_status "Installing dependencies..."
    
    # Backend dependencies
    cd backend
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    
    # Frontend dependencies
    cd frontend
    if command_exists yarn; then
        yarn install
    else
        npm install
    fi
    cd ..
    
    print_success "Dependencies installed!"
fi

# Start MongoDB if not running
if ! pgrep mongod > /dev/null; then
    print_status "Starting MongoDB..."
    if command_exists systemctl; then
        sudo systemctl start mongod 2>/dev/null || true
    elif command_exists brew; then
        brew services start mongodb-community 2>/dev/null || true
    else
        mongod --fork --logpath /tmp/mongodb.log --dbpath ~/mongodb_data || true
    fi
fi

# Start services
print_status "Starting backend server..."
cd backend
source venv/bin/activate
nohup python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

print_status "Starting frontend server..."
cd frontend
if command_exists yarn; then
    nohup yarn start > ../frontend.log 2>&1 &
else
    nohup npm start > ../frontend.log 2>&1 &
fi
FRONTEND_PID=$!
cd ..

# Wait for services to be ready
wait_for_service "http://localhost:8001/api/employees" "Backend"
wait_for_service "http://localhost:3000" "Frontend"

# Get IP address
IP=$(ip route get 1 2>/dev/null | awk '{print $7}' | head -n1)
[ -z "$IP" ] && IP="localhost"

echo
echo "==========================================="
echo "✅ APPLICATION READY!"
echo
echo "🌐 Access URLs:"
echo "   Frontend: http://$IP:3000"
echo "   Backend:  http://$IP:8001/api/"
echo
echo "📊 Features Available:"
echo "   • Employee Directory (Google Sheets Data)"
echo "   • Advanced Search & Filtering"
echo "   • Image Upload"
echo "   • Attendance Tracking"
echo "   • Hierarchy Builder"
echo
echo "📋 Process IDs:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo
echo "📄 Logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo
echo "🛑 To stop: Press Ctrl+C"
echo "==========================================="

# Keep script running and show logs
print_status "Application running! Press Ctrl+C to stop..."
sleep 2

# Show real-time logs
tail -f backend.log frontend.log 2>/dev/null || true