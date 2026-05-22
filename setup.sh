#!/bin/bash

# AptiSense AI - Setup Script for Linux/Mac
# This script sets up the project for first-time run

echo ""
echo "========================================="
echo " AptiSense AI - Setup Script"
echo "========================================="
echo ""

# Check Python
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found. Please install Python 3.9+"
    echo "On Ubuntu/Debian: sudo apt-get install python3 python3-pip"
    echo "On Mac: brew install python3"
    exit 1
fi
echo "✓ Python found: $(python3 --version)"

# Check Node
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js 18+"
    echo "Visit: https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js found: $(node --version)"

# Create .env if not exists
echo ""
echo "Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠ .env file created from .env.example"
    echo "IMPORTANT: Edit .env and add your GEMINI_API_KEY!"
    echo "Get your key from: https://ai.google.dev/"
    echo ""
    read -p "Press Enter to continue after updating .env..."
else
    echo "✓ .env already exists"
fi

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    exit 1
fi
cd ..
echo "✓ Backend dependencies installed"

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies"
    exit 1
fi
cd ..
echo "✓ Frontend dependencies installed"

# Success
echo ""
echo "========================================="
echo "✓ Setup complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Make sure GEMINI_API_KEY is set in .env"
echo "2. Run './run.sh' to start the application"
echo "   - Backend will be at http://localhost:8000"
echo "   - Frontend will be at http://localhost:5173"
echo ""
