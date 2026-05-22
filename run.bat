@echo off
REM AptiSense AI - Startup Script for Windows
REM This script starts both backend and frontend in separate terminals

echo.
echo =========================================
echo  AptiSense AI - Recruitment Platform
echo =========================================
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and add your GEMINI_API_KEY
    pause
    exit /b 1
)

REM Start backend
echo Starting backend server...
start "AptiSense Backend" /D "%~dp0backend" cmd /k "python -m uvicorn main:app --reload --port 8000"

REM Wait a bit for backend to start
timeout /t 3 /nobreak

REM Start frontend
echo Starting frontend server...
start "AptiSense Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo =========================================
echo Servers starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo =========================================
echo.
echo Both servers should open in new terminals.
echo Press any key to close this window...
pause
