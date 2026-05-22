# AptiSense AI - Architecture Documentation

Comprehensive technical architecture of the AptiSense AI recruitment intelligence platform.

## System Overview

AptiSense AI is a modern, microservices-based recruitment platform that combines:
- Real-time AI interviewing using Google Gemini
- Advanced psychological and behavioral analysis
- Enterprise-grade proctoring and integrity monitoring
- Professional SaaS-style user interface
- Recruiter-grade analytics and recommendations

## Architectural Layers

```
┌─────────────────────────────────────────────────────┐
│                  Frontend Layer                      │
│  (React 18 + Vite + Tailwind CSS + Recharts)       │
├─────────────────────────────────────────────────────┤
│          API Gateway & Middleware Layer              │
│  (FastAPI CORS, Auth, Rate Limiting, Logging)      │
├─────────────────────────────────────────────────────┤
│               Service Layer (FastAPI)                │
│  ┌──────────────┬──────────────┬──────────────┐    │
│  │  Interview   │  Evaluation  │  Proctoring  │    │
│  │  Service     │  Service     │  Service     │    │
│  │              │              │              │    │
│  ├──────────────┼──────────────┼──────────────┤    │
│  │  AI Orch.    │  Memory Mgmt │  Question    │    │
│  │  Service     │  Service     │  Bank Svc    │    │
│  └──────────────┴──────────────┴──────────────┘    │
├─────────────────────────────────────────────────────┤
│               Data & Storage Layer                   │
│  (JSON Files, Optional PostgreSQL, Redis)          │
└─────────────────────────────────────────────────────┘
```

## Backend Architecture

### Core Services

#### 1. Interview Service (`interview_manager.py`)
**Purpose**: Manages interview lifecycle from start to completion

**Responsibilities**:
- Create and manage interview sessions
- Track current question and answer history
- Manage interview state (idle → in_progress → completed)
- Generate comprehensive reports

**Key Classes**:
```python
class InterviewSession:
    - session_id: str
    - status: "idle" | "in_progress" | "completed"
    - current_question: Question
    - answer_history: List[Answer]
    - difficulty_level: float
    - follow_up_count: int
    
    Methods:
    - start()
    - end()
    - add_question()
    - add_answer()
    - get_session_report()
```

**Storage**: JSON files in `backend/data/sessions/{session_id}.json`

---

#### 2. AI Orchestration Service (`ai_orchestration.py`)
**Purpose**: Orchestrates Gemini AI for intelligent analysis and adaptive questions

**Responsibilities**:
- Analyze candidate answers using Gemini
- Generate contextual follow-up questions
- Produce recruiter recommendations
- Fallback to rule-based analysis if API fails

**Key Methods**:
```python
- analyze_answer(answer_text, context, session_memory)
  → AnswerAnalysis with 8+ scoring dimensions
  
- generate_follow_up_question(context, performance)
  → FollowUpQuestion with reasoning
  
- generate_recruiter_recommendation(overall_metrics)
  → RecruitmentRecommendation (RECOMMENDED/CONDITIONAL/NOT_RECOMMENDED)
```

**Gemini Integration**:
- Model: `gemini-pro`
- Detailed system prompts requesting JSON responses
- Fallback mechanisms for API failures
- Retry logic with exponential backoff

---

#### 3. Interview Memory Service (`interview_memory.py`)
**Purpose**: Maintains conversation context for adaptive interviewing

**Responsibilities**:
- Track conversation history and exchanges
- Extract patterns and insights
- Maintain identified strengths and weaknesses
- Support context-aware follow-up generation

**Data Structure**:
```python
class InterviewMemory:
    - conversation_history: List[Exchange]
    - identified_strengths: List[str]
    - identified_weaknesses: List[str]
    - behavioral_patterns: Dict[str, Any]
    
Exchange:
    - question: str
    - answer: str
    - analysis: AnswerAnalysis
    - follow_up: Optional[str]
```

**Persistence**: JSON files in `backend/data/sessions/{session_id}_memory.json`

---

#### 4. Evaluation Service (`evaluation.py`)
**Purpose**: Comprehensive answer evaluation with 8+ scoring dimensions

**Scoring Dimensions** (0-100 scale):
1. **Technical Score** (25% weight) - Depth and accuracy
2. **Communication Score** (20% weight) - Clarity and articulation
3. **Confidence Score** (15% weight) - Assurance level
4. **Clarity Score** (15% weight) - Logical structure
5. **Relevance Score** (10% weight) - Answer appropriateness
6. **Depth Score** (10% weight) - Detail completeness
7. **Vocabulary Score** (5% weight) - Language proficiency
8. **Hesitation Indicators** - Derived from typing metrics

**Key Methods**:
```python
- evaluate_answer(answer_text, typing_metrics, ai_analysis)
  → AnswerAnalysis with all scores
  
- _analyze_typing_metrics(typing_data)
  → Typing interpretation (hesitation, confidence)
  
- calculate_aggregate_metrics(all_answers)
  → InterviewMetrics with weighted overall score
```

**Overall Score Calculation**:
```
Overall = (Tech×0.25) + (Comm×0.20) + (Conf×0.15) + (Clarity×0.15) + (Rel×0.10) + (Depth×0.10) + (Vocab×0.05)
```

---

#### 5. Proctoring Service (`proctoring.py`)
**Purpose**: Real-time monitoring and integrity assessment

**Monitoring Capabilities**:
- Face detection and presence tracking
- Eye direction monitoring (forward/left/right/down)
- Multiple face detection
- Looking away duration tracking
- Suspicious event logging

**Integrity Scoring**:
```
Integrity Score = (Face Presence Ratio × 0.5) + (Suspicion Score × 0.5)

Face Presence Ratio = Frames with Face Detected / Total Frames
Suspicion Score = 100 - (Cheating Probability × 100)
```

**Event Types**:
- FACE_DETECTED
- FACE_NOT_DETECTED
- MULTIPLE_FACES
- LOOKING_AWAY
- EYES_NOT_VISIBLE
- SUSPICIOUS_ACTIVITY

---

#### 6. Question Bank Service (`question_bank.py`)
**Purpose**: Adaptive question selection with difficulty management

**Adaptive Algorithm**:
```python
if normalized_performance >= ADAPTIVE_DIFFICULTY_THRESHOLD (0.65):
    difficulty += 1  # Increase difficulty
elif normalized_performance < 0.45:
    difficulty -= 1  # Decrease difficulty
else:
    keep_current_difficulty()
```

**Question Pool**:
- ~16 default questions across technical, HR, and mixed categories
- Difficulty levels: easy, medium, hard
- Excludes recently used questions
- Supports custom question uploads

---

### Data Models (Pydantic Schemas)

**Request/Response Models** in `app/schemas/interview.py`:

```python
# Interview Lifecycle
- InterviewSessionRequest
- InterviewSessionResponse
- InterviewAnswerRequest
- InterviewAnswerResponse

# Scoring & Analysis
- AnswerAnalysis
- TypingMetrics
- InterviewMetrics

# Recommendations
- RecruitmentRecommendation
- InterviewReport
- ProctoringSession
```

### API Endpoints

**Interview API** (`app/api/interview.py`):
```
POST   /api/v1/interview/start          → Create session, return first question
POST   /api/v1/interview/answer         → Submit answer, get analysis + follow-up
GET    /api/v1/interview/next-question/{id}  → Get next adaptive question
POST   /api/v1/interview/end/{id}       → Conclude interview
GET    /api/v1/interview/report/{id}    → Get comprehensive report
GET    /api/v1/interview/status/{id}    → Get current status
```

**Proctoring API** (`app/api/proctoring.py`):
```
POST   /api/v1/proctoring/analyze-frame/{id}    → Process video frame
GET    /api/v1/proctoring/integrity-score/{id}  → Get integrity report
GET    /api/v1/proctoring/brief-summary/{id}    → Quick status
POST   /api/v1/proctoring/flag-suspicious/{id}  → Log suspicious event
```

---

## Frontend Architecture

### Component Hierarchy

```
App
├── ThemeProvider (Design System)
│   └── InterviewProvider (State Management)
│       └── MainLayout
│           ├── HomePage
│           │   └── Feature Cards, Stats
│           ├── InterviewPage
│           │   ├── InterviewSetup
│           │   ├── InterviewChat
│           │   │   ├── QuestionDisplay
│           │   │   ├── AnswerInput (with typing metrics)
│           │   │   └── FollowUpDisplay
│           │   └── ProctoringPanel
│           │       ├── WebcamFeed
│           │       └── StatusIndicators
│           ├── ResultsPage
│           │   ├── RecommendationBox
│           │   ├── AnalyticsDashboard
│           │   └── TranscriptViewer
│           └── DashboardPage
│               ├── StatsCards
│               ├── PerformanceTrendChart
│               ├── InterviewBreakdownChart
│               └── RecentInterviewsTable
```

### State Management

**ThemeContext** (`contexts/ThemeContext.jsx`):
```javascript
{
  colors: {
    primary: '#00D9FF',
    bgPrimary: '#0A0E27',
    textPrimary: '#FFFFFF',
    // ... 20+ color values
  },
  fonts: { family, size },
  spacing: (8-point grid),
  shadows: (multiple levels + glow),
  transitions: (150ms/300ms/500ms)
}
```

**InterviewContext** (`contexts/InterviewContext.jsx`):
```javascript
{
  sessionId: string,
  interviewState: {
    status: string,
    currentQuestion: Question,
    questionIndex: number,
    totalQuestions: number,
    answers: Answer[],
    report: InterviewReport
  }
}
```

### Key Components

#### InterviewChatComponent
- Displays current question
- Textarea for answer input with auto-grow
- Tracks typing metrics (WPM, backspaces, hesitation)
- Handles Ctrl+Enter submission
- Shows follow-up questions

#### AnalyticsDashboard
- Radar chart for skill assessment
- Bar chart for score breakdown
- Proctoring summary
- Recruiter recommendations
- Recharts for visualization

#### ProctoringPanel
- Webcam feed (react-webcam)
- Real-time face detection indicators
- Looking direction display
- Eyes visible status
- Suspicious events counter
- Integrity score gauge

### API Client

**`src/services/api.js`**:
```javascript
Axios instance with grouped endpoints:
- interviewAPI (start, submitAnswer, getNextQuestion, etc.)
- proctoringAPI (analyzeFrame, getIntegrityScore, etc.)
```

---

## Data Flow

### Complete Interview Flow

```
1. User starts interview
   ↓
2. Frontend calls POST /interview/start
   ↓
3. Backend creates session, selects first question
   ↓
4. Frontend displays question, enables webcam
   ↓
5. User answers question, types response
   ↓
6. Frontend tracks typing metrics
   ↓
7. User submits answer (Ctrl+Enter or button)
   ↓
8. Frontend sends:
   - Answer text
   - Typing metrics
   - Session ID
   ↓
9. Backend processes:
   a) Stores answer in session
   b) Calls Gemini for analysis (8+ dimensions)
   c) Updates interview memory
   d) Calculates confidence score
   ↓
10. Backend responds with:
    - Answer analysis
    - Current performance
    - Follow-up question (if enabled)
    ↓
11. Frontend displays follow-up (optional)
    ↓
12. Steps 5-11 repeat for each answer
    ↓
13. User ends interview or reaches limit
    ↓
14. Backend generates comprehensive report:
    - All answers and analysis
    - Aggregate metrics
    - Recruiter recommendation
    - Proctoring summary
    ↓
15. Frontend displays results page with analytics
```

### Proctoring Flow

```
1. Interview started with proctoring enabled
   ↓
2. Frontend initializes webcam (react-webcam)
   ↓
3. Every N ms, frontend captures frame
   ↓
4. Frontend sends frame data to /proctoring/analyze-frame
   ↓
5. Backend processes:
   a) Detects faces (OpenCV + MediaPipe)
   b) Analyzes eye direction
   c) Tracks looking away duration
   d) Logs events
   ↓
6. Backend returns:
   - Faces detected count
   - Eye direction
   - Eyes visible status
   ↓
7. Frontend updates live indicators
   ↓
8. At interview end, backend calculates:
   - Overall integrity score
   - Risk level
   - Detailed proctoring report
   ↓
9. Report included in final results
```

---

## Security Architecture

### Authentication & Authorization
- Currently: Session-based (future: JWT tokens)
- Session tracking via session_id
- CORS protection for API access

### Data Protection
- Environment variables for secrets (GEMINI_API_KEY)
- Session data stored locally (future: encrypted database)
- No PII stored in logs

### API Security
- Input validation via Pydantic schemas
- Error handling without stack traces in production
- Rate limiting (future implementation)

---

## Performance Optimization Strategies

### Backend
- Lazy loading of ML models
- Caching of question bank
- Connection pooling for database
- Async handlers for I/O operations

### Frontend
- Code splitting via Vite
- Component lazy loading
- Image optimization
- Gzip compression

### Data
- Session memory pruning after 24 hours
- Batch proctoring event logging
- Efficient typing metrics calculation

---

## Scalability Considerations

### Horizontal Scaling
- Stateless backend services
- Load balancing via Nginx
- Multiple worker processes

### Vertical Scaling
- Memory optimization for proctoring
- Database indexing strategies
- Cache warming strategies

### Future Enhancements
- Redis for session caching
- PostgreSQL for persistent storage
- Elasticsearch for analytics
- Message queue (Celery) for async tasks

---

## Monitoring & Observability

### Health Checks
```
GET /health → { status: "ok", timestamp: ... }
```

### Logging Levels
- DEBUG: Detailed trace information
- INFO: General informational messages
- WARNING: Warning messages for recoverable errors
- ERROR: Error messages for failures

### Metrics to Track
- API response times
- AI analysis latency
- Proctoring accuracy
- Interview completion rate
- System resource usage

---

## Integration Points

### External Services
1. **Google Gemini API**: For AI analysis
   - Rate: 60 req/min (free tier)
   - Fallback: Rule-based analysis

2. **Webcam API**: For proctoring
   - Browser: getUserMedia()
   - OpenCV: Local face detection

### Database (Optional)
- PostgreSQL for production
- SQLAlchemy ORM
- Alembic for migrations

---

## Deployment Architectures

### Development
```
LocalHost:5173  ←→  LocalHost:8000
(React Dev)         (FastAPI Dev)
    ↓                   ↓
ThemeContext       InterviewService
  ↓↓↓↓↓            ↓↓↓↓↓↓↓↓↓↓↓
All APIs          All Services
```

### Production (Docker)
```
Nginx (Port 80/443)
    ↓
React SPA (Port 5173)  ←→  FastAPI (Port 8000)
    ↓                           ↓
Static Files                Services + DB
```

### Production (Kubernetes)
```
Ingress Controller
    ↓
Service: Frontend  ←→  Service: Backend
    ↓                      ↓
Pod × N              Pod × N
```

---

## Error Handling Strategy

### Backend Error Codes
- 200: Success
- 400: Bad Request (validation failed)
- 401: Unauthorized
- 404: Not Found (session/question)
- 500: Internal Server Error
- 503: Service Unavailable

### Frontend Error Handling
- Try-catch blocks for API calls
- Error boundaries for component failures
- Fallback UI for network errors
- User-friendly error messages

### Fallback Mechanisms
- AI analysis fails → Rule-based analysis
- Proctoring unavailable → Proceed without
- Question bank empty → Default questions
- Database down → JSON file storage

---

## Version History

- **v1.0**: Initial MVP with basic TextBlob analysis
- **v1.5**: Added proctoring and basic analytics
- **v2.0**: Professional architecture redesign with Gemini AI, 8+ scoring dimensions, enterprise UI

---

This architecture prioritizes:
✅ Modularity & maintainability
✅ Scalability & performance
✅ Security & compliance
✅ User experience
✅ Extensibility for future features
