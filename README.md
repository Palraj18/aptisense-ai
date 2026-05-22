# AptiSense AI - Recruitment Intelligence Platform

Professional AI-powered recruitment intelligence and assessment platform with adaptive interviewing, advanced proctoring, and recruiter-grade analytics.

## Features

### 🤖 Adaptive AI Interview Engine
- Real-time Gemini AI interviewer
- Intelligent follow-up question generation based on answer context
- Interview memory and conversation retention
- Dynamic difficulty adaptation
- Realistic interviewer behavior simulation

### 📊 Advanced Analytics & Scoring
- 8+ dimensional scoring system:
  - Technical Understanding
  - Communication Skills
  - Confidence & Articulation
  - Problem Solving Ability
  - Leadership Potential
  - Behavioral Consistency
  - Vocabulary & Language Use
  - Hesitation & Uncertainty Analysis
- Recruiter-grade recommendations
- Employability rating
- Professional recruiter insights

### 🔍 Enterprise-Grade Proctoring
- Real-time face detection and tracking
- Eye direction monitoring
- Multiple face detection
- Cheating probability scoring
- Looking away duration tracking
- Suspicious event logging
- Session integrity scoring
- Proctoring timeline visualization

### 💼 Professional Dashboard
- Interview analytics and metrics
- Performance trend tracking
- Candidate session history
- Recruiter recommendations
- Detailed interview reports
- Transcript generation

### 🎨 Modern SaaS UI
- Professional dark theme with glassmorphism
- Responsive design (desktop and mobile)
- Real-time status indicators
- Elegant data visualization
- Smooth animations and transitions
- Premium design language

## Architecture

### Backend (FastAPI)
```
backend/
├── app/
│   ├── api/
│   │   ├── interview.py          # Interview endpoints
│   │   ├── proctoring.py         # Proctoring endpoints
│   │   └── __init__.py
│   ├── services/
│   │   ├── ai_orchestration.py   # Gemini AI integration
│   │   ├── interview_manager.py  # Interview workflow
│   │   ├── evaluation.py         # Answer evaluation & scoring
│   │   ├── interview_memory.py   # Conversation memory
│   │   ├── proctoring.py         # Proctoring logic
│   │   ├── question_bank.py      # Question management
│   │   └── ...
│   ├── schemas/
│   │   ├── interview.py          # Pydantic models
│   │   └── __init__.py
│   ├── core/
│   │   ├── config.py             # Configuration
│   │   └── __init__.py
│   └── __init__.py
├── main.py                        # FastAPI application
└── requirements.txt              # Python dependencies
```

### Frontend (React + Vite)
```
frontend/
├── src/
│   ├── components/
│   │   ├── InterviewChatComponent.jsx      # Interview chat UI
│   │   ├── AnalyticsDashboard.jsx          # Analytics visualization
│   │   ├── ProctoringPanel.jsx             # Proctoring monitor
│   │   └── ...
│   ├── contexts/
│   │   ├── ThemeContext.jsx                # Dark theme system
│   │   ├── InterviewContext.jsx            # Interview state
│   │   └── ...
│   ├── layouts/
│   │   ├── MainLayout.jsx                  # Main layout with sidebar
│   │   └── ...
│   ├── pages/
│   │   ├── Interview.jsx                   # Interview page
│   │   ├── Results.jsx                     # Results/report page
│   │   ├── Dashboard.jsx                   # Analytics dashboard
│   │   └── ...
│   ├── services/
│   │   ├── api.js                          # API client (axios)
│   │   └── ...
│   ├── App.jsx                             # Main app component
│   └── main.jsx                            # Entry point
├── package.json                            # Dependencies
└── vite.config.js                          # Vite configuration
```

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- Gemini API Key

### Backend Setup

1. **Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Create .env file:**
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

3. **Run the backend:**
```bash
python -m uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

3. **Build for production:**
```bash
npm run build
```

## API Endpoints

### Interview API

**Start Interview Session**
```
POST /api/v1/interview/start
{
  "interview_type": "technical|hr|mixed",
  "position": "Senior Engineer",
  "experience_level": "entry|mid|senior",
  "enable_proctoring": true
}
```

**Submit Answer**
```
POST /api/v1/interview/answer
{
  "session_id": "uuid",
  "question_id": "question_001",
  "answer_text": "...",
  "typing_metrics": {...}
}
```

**Get Next Question**
```
GET /api/v1/interview/next-question/{session_id}
```

**End Interview**
```
POST /api/v1/interview/end/{session_id}
```

**Get Interview Report**
```
GET /api/v1/interview/report/{session_id}
```

### Proctoring API

**Analyze Frame**
```
POST /api/v1/proctoring/analyze-frame/{session_id}
{
  "face_detected": true,
  "face_count": 1,
  "face_confidence": 0.95,
  "looking_direction": "forward",
  "eyes_visible": true
}
```

**Get Integrity Score**
```
GET /api/v1/proctoring/integrity-score/{session_id}
```

## Configuration

Create a `.env` file in the root directory:

```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Environment
DEBUG=False
ENV=production

# Interview Settings
MAX_INTERVIEW_DURATION_MINUTES=60
MIN_INTERVIEW_DURATION_MINUTES=5
MAX_FOLLOW_UP_QUESTIONS=3
ADAPTIVE_DIFFICULTY_THRESHOLD=0.65

# Proctoring
FACE_DETECTION_CONFIDENCE=0.5
MAX_LOOKING_AWAY_DURATION_SECONDS=5
CHEATING_PROBABILITY_THRESHOLD=0.7

# Frontend
REACT_APP_API_URL=http://localhost:8000/api/v1
```

## Interview Scoring System

### Dimensions (0-100 scale)

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Technical Score | 25% | Technical depth and accuracy |
| Communication Score | 20% | Clarity and articulation |
| Confidence Score | 15% | Assurance and certainty |
| Clarity Score | 15% | Logical structure |
| Relevance Score | 10% | Answer appropriateness |
| Depth Score | 10% | Detail and completeness |
| Vocabulary Score | 5% | Language proficiency |

### Overall Employability Rating
- **80-100**: Excellent - Recommended for immediate hire
- **70-79**: Good - Recommended with minor improvements
- **60-69**: Moderate - Requires additional evaluation
- **Below 60**: Needs Improvement

## Key Technologies

**Backend**
- FastAPI 0.104+ - Web framework
- Google Generative AI - AI/LLM integration
- Pydantic 2.0+ - Data validation
- OpenCV - Computer vision
- MediaPipe - Face detection
- SQLAlchemy - Database ORM

**Frontend**
- React 18+ - UI framework
- Vite - Build tool
- Tailwind CSS - Styling
- Framer Motion - Animations
- Recharts - Data visualization
- Axios - HTTP client
- Zustand - State management

## Project Structure Notes

### Professional Practices Implemented

✅ Modular service architecture
✅ Separation of concerns
✅ Pydantic schema validation
✅ Comprehensive error handling
✅ Real-time AI processing
✅ Session management
✅ Memory persistence
✅ Adaptive algorithms
✅ Professional UI/UX
✅ Security & proctoring
✅ Analytics & reporting
✅ Database design patterns
✅ API documentation
✅ Logging & monitoring

## Development Roadmap

- [ ] Database integration (PostgreSQL)
- [ ] User authentication & roles
- [ ] Advanced interview templates
- [ ] Candidate pool management
- [ ] Bulk interview scheduling
- [ ] Report PDF export
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] API rate limiting
- [ ] Performance optimization
- [ ] Mobile app version
- [ ] Video recording/playback

## Support & Documentation

For detailed API documentation, visit `/docs` after starting the backend server.

## License

Proprietary - AptiSense AI Platform

## Version

**Current**: 2.0.0 (Professional Edition)

---

Built with professional-grade architecture for enterprise recruitment intelligence.
