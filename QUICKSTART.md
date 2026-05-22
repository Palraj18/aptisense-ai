# AptiSense AI - Quick Start Guide

Get your AI-powered recruitment platform up and running in minutes.

## 🚀 Prerequisites

- **Python 3.9+** - [Install here](https://www.python.org/downloads/)
- **Node.js 18+** - [Install here](https://nodejs.org/)
- **Gemini API Key** - [Get free key here](https://ai.google.dev/)

## ⚡ Quick Setup (< 5 minutes)

### Windows Users

1. **Run setup script:**
   ```bash
   setup.bat
   ```
   This will install all dependencies automatically.

2. **Start the application:**
   ```bash
   run.bat
   ```
   This opens two terminals - backend and frontend.

3. **Open in browser:**
   - Frontend: http://localhost:5173
   - API Docs: http://localhost:8000/docs

### Linux/Mac Users

1. **Make scripts executable:**
   ```bash
   chmod +x setup.sh run.sh
   ```

2. **Run setup script:**
   ```bash
   ./setup.sh
   ```

3. **Start the application:**
   ```bash
   ./run.sh
   ```

4. **Open in browser:**
   - Frontend: http://localhost:5173
   - API Docs: http://localhost:8000/docs

## 🔑 Configuration

1. Copy `.env.example` to `.env`
2. Add your GEMINI_API_KEY:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
3. Save and run the startup script

## 📋 Manual Setup (If Scripts Don't Work)

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Test the Platform

1. Go to http://localhost:5173
2. Click "Start Interview"
3. Configure settings:
   - Interview Type: Technical/HR/Mixed
   - Position: Any role
   - Experience Level: Entry/Mid/Senior
   - Enable Proctoring: Yes
4. Answer questions from the AI interviewer
5. View your comprehensive report and analytics

## 📊 What You Get

✅ **Adaptive AI Interviewer** - Real Gemini AI asking contextual follow-up questions
✅ **Advanced Analytics** - 8+ scoring dimensions
✅ **Professional UI** - Enterprise-grade design
✅ **Proctoring** - Real-time monitoring
✅ **Recruiter Recommendations** - RECOMMENDED/CONDITIONAL/NOT_RECOMMENDED

## 🐳 Using Docker

```bash
docker-compose up
```

Then open:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000

## 💡 Tips

- First run will be slower (Gemini initialization)
- Answer questions naturally for best analysis
- Enable proctoring to see full integrity scoring
- Check `/docs` endpoint for full API documentation

## ❓ Troubleshooting

**"GEMINI_API_KEY not found"**
→ Make sure you added it to .env and restarted the server

**"Port 8000 already in use"**
→ Change backend port in run script or use Docker

**"Frontend can't reach backend"**
→ Make sure backend is running at localhost:8000

**"npm: command not found"**
→ Install Node.js from https://nodejs.org/

## 📚 Full Documentation

See [README.md](README.md) for comprehensive documentation including:
- Architecture overview
- API endpoints
- Configuration options
- Development roadmap

---

**Need Help?** Check the logs in both terminals for error messages.
