@echo off
REM AptiSense AI - Setup Script for Windows
REM This script sets up the project for first-time run

echo.
echo =========================================
echo  AptiSense AI - Setup Script
echo =========================================
echo.

REM Check Python
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.9+
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo ✓ Python found

REM Check Node
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 18+
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found

REM Create .env if not exists
echo.
echo Setting up environment configuration...
if not exist .env (
    copy .env.example .env
    echo ⚠ .env file created from .env.example
    echo IMPORTANT: Edit .env and add your GEMINI_API_KEY!
    echo Get your key from: https://ai.google.dev/
    echo.
    pause
) else (
    echo ✓ .env already exists
)

REM Install backend dependencies
echo.
echo Installing backend dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..
echo ✓ Backend dependencies installed

REM Install frontend dependencies
echo.
echo Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..
echo ✓ Frontend dependencies installed

REM Success
echo.
echo =========================================
echo ✓ Setup complete!
echo =========================================
echo.
echo Next steps:
echo 1. Make sure GEMINI_API_KEY is set in .env
echo 2. Run 'run.bat' to start the application
echo    - Backend will be at http://localhost:8000
echo    - Frontend will be at http://localhost:5173
echo.
pause
