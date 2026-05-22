# AptiSense AI - Pre-Launch Verification Checklist

Use this checklist to verify all components are functioning correctly before launching to production.

## Environment Setup

- [ ] `.env` file created and configured
- [ ] `GEMINI_API_KEY` is valid and active
- [ ] Python 3.9+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] pip installed (`pip --version`)
- [ ] npm installed (`npm --version`)

## Backend Verification

### Installation
- [ ] `pip install -r requirements.txt` completed successfully
- [ ] No dependency conflicts
- [ ] All packages versions match requirements.txt

### Startup
- [ ] Backend starts without errors: `python -m uvicorn main:app --reload`
- [ ] No import errors in console
- [ ] No missing module errors

### Health Checks
- [ ] `/` endpoint responds with app info
- [ ] `/health` endpoint returns 200 OK
- [ ] `/docs` endpoint shows Swagger UI with all endpoints
- [ ] `/redoc` endpoint shows ReDoc documentation

### API Endpoints
**Interview API**:
- [ ] POST `/api/v1/interview/start` responds (create test payload)
- [ ] GET `/api/v1/interview/status/{session_id}` responds
- [ ] POST `/api/v1/interview/answer` responds (if session exists)
- [ ] GET `/api/v1/interview/next-question/{session_id}` responds
- [ ] POST `/api/v1/interview/end/{session_id}` responds
- [ ] GET `/api/v1/interview/report/{session_id}` responds

**Proctoring API**:
- [ ] POST `/api/v1/proctoring/analyze-frame/{session_id}` responds
- [ ] GET `/api/v1/proctoring/integrity-score/{session_id}` responds
- [ ] GET `/api/v1/proctoring/brief-summary/{session_id}` responds
- [ ] POST `/api/v1/proctoring/flag-suspicious/{session_id}` responds

### Configuration
- [ ] DEBUG=False in .env (production)
- [ ] CORS_ORIGINS configured correctly
- [ ] MAX_INTERVIEW_DURATION_MINUTES set appropriately
- [ ] ADAPTIVE_DIFFICULTY_THRESHOLD is 0.65
- [ ] All required environment variables are present

### Services
- [ ] AI Orchestration Service initializes without errors
- [ ] Gemini API connection successful (check logs)
- [ ] Interview Manager creates sessions correctly
- [ ] Memory service persists conversation history
- [ ] Evaluation service calculates scores
- [ ] Question bank has questions loaded
- [ ] Proctoring service initializes OpenCV

## Frontend Verification

### Installation
- [ ] `npm install` completed successfully in frontend/ directory
- [ ] No peer dependency warnings
- [ ] All packages installed correctly
- [ ] node_modules directory created

### Development Server
- [ ] `npm run dev` starts without errors
- [ ] Vite server shows compilation success
- [ ] Frontend accessible at http://localhost:5173

### Home Page
- [ ] Home page loads at http://localhost:5173
- [ ] All feature cards display
- [ ] All stats cards display
- [ ] "Start Interview" button is clickable
- [ ] No console errors
- [ ] No network errors (check DevTools)

### Theme System
- [ ] Dark theme applied correctly
- [ ] Primary color (cyan) visible
- [ ] Typography renders with correct fonts
- [ ] Spacing looks consistent (8px grid)
- [ ] Shadows appear on cards and buttons
- [ ] Transitions smooth on hover

### Components
- [ ] MainLayout with sidebar renders
- [ ] Navigation links are present
- [ ] Responsive design works (test on mobile size)
- [ ] All icons display correctly

## Integration Verification

### API Communication
- [ ] Frontend can reach backend at http://localhost:8000
- [ ] CORS errors don't appear in console
- [ ] API responses parse correctly
- [ ] Errors are handled gracefully

### State Management
- [ ] Theme context provides colors/fonts
- [ ] Interview context can be initialized
- [ ] Context values accessible to all components
- [ ] No context provider errors

## End-to-End Interview Flow

### Interview Start
- [ ] Navigate to /interview (or click Start Interview)
- [ ] Interview setup page displays
- [ ] All configuration options visible:
  - [ ] Interview Type dropdown
  - [ ] Position input
  - [ ] Experience Level dropdown
  - [ ] Enable Proctoring toggle
- [ ] Start button is clickable

### Interview Execution
- [ ] First question displays
- [ ] Question text is readable
- [ ] Answer textarea is functional
- [ ] Can type in textarea
- [ ] Character count or similar feature works
- [ ] Submit button (Ctrl+Enter) works
- [ ] Loading indicator appears during submission

### AI Response
- [ ] Backend successfully calls Gemini API
- [ ] Answer analysis returns without error
- [ ] Follow-up question displays (if applicable)
- [ ] Analysis includes scoring breakdown
- [ ] No timeout errors (< 10 seconds)

### Multiple Answers
- [ ] Can submit 3-5 answers consecutively
- [ ] Each answer stores successfully
- [ ] Performance metrics update
- [ ] Difficulty adapts correctly
- [ ] Interview state persists

### Interview Completion
- [ ] End Interview button works
- [ ] Interview transitions to results page
- [ ] Results page loads successfully
- [ ] All metrics display correctly

### Results Page
- [ ] Recommendation status displays (RECOMMENDED/CONDITIONAL/NOT_RECOMMENDED)
- [ ] Recommendation color is correct:
  - [ ] Green for RECOMMENDED
  - [ ] Yellow for CONDITIONAL
  - [ ] Red for NOT_RECOMMENDED
- [ ] Strengths and concerns list displays
- [ ] Strengths have positive phrasing
- [ ] Concerns have constructive phrasing

### Analytics Dashboard
- [ ] Radar chart renders with skill assessment
- [ ] Bar chart shows score breakdown
- [ ] Pie chart shows interview type distribution
- [ ] All charts have proper legends
- [ ] Tooltip information is helpful
- [ ] Colors match theme

### Transcript
- [ ] Interview transcript displays Q&A pairs
- [ ] Questions show as "Question:" role
- [ ] Answers show as "Candidate:" role
- [ ] Question/answer text is complete and readable

## Proctoring Verification

### Webcam Access
- [ ] Browser permission for camera requested
- [ ] Permission can be granted
- [ ] Webcam feed displays in ProctoringPanel
- [ ] Video shows in real-time (no lag)
- [ ] Video quality is reasonable

### Face Detection
- [ ] Face detection indicators update
- [ ] "Face Detected" shows when face visible
- [ ] "Face Not Detected" shows correctly
- [ ] Count updates accurately
- [ ] No freezing or lag

### Event Logging
- [ ] Looking away is detected
- [ ] Multiple faces detection works
- [ ] Events logged with timestamps
- [ ] Suspicious events counter increments
- [ ] Events persist in session

### Integrity Score
- [ ] Integrity score calculates correctly
- [ ] Score updates in real-time
- [ ] Score ranges from 0-100
- [ ] Risk level indicators appear:
  - [ ] Green for low risk (80+)
  - [ ] Yellow for medium (50-80)
  - [ ] Red for high risk (<50)

## Data Verification

### Session Data
- [ ] Session ID generated and unique
- [ ] Session data saved to backend/data/sessions/
- [ ] Session file contains all answers
- [ ] Session file contains analysis
- [ ] Session file valid JSON

### Interview Report
- [ ] Report includes all answered questions
- [ ] Report shows scores for each answer
- [ ] Report shows overall metrics
- [ ] Report includes recruiter recommendation
- [ ] Report includes proctoring summary
- [ ] Timestamps are accurate

### Persistence
- [ ] Data survives browser refresh
- [ ] Session accessible after page reload
- [ ] Report data remains after browser close and reopen
- [ ] Multiple sessions don't interfere

## Performance Verification

### Backend Performance
- [ ] `/api/v1/interview/start` responds in < 1 second
- [ ] `/api/v1/interview/answer` responds in < 10 seconds (including AI)
- [ ] `/api/v1/interview/report/{id}` responds in < 2 seconds
- [ ] `/api/v1/proctoring/integrity-score/{id}` responds in < 100ms
- [ ] No memory leaks (monitor with Task Manager)
- [ ] CPU usage stable (< 50% idle)

### Frontend Performance
- [ ] Home page loads in < 2 seconds
- [ ] Interview page loads in < 1 second
- [ ] Charts render in < 500ms
- [ ] Interactions response in < 200ms
- [ ] No layout shifts or jank
- [ ] Smooth scrolling

### Network
- [ ] All API calls complete successfully
- [ ] No 404 or 500 errors in Network tab
- [ ] Bundle size reasonable (< 5MB total)
- [ ] Gzip compression working if applicable

## Error Handling Verification

### Missing GEMINI_API_KEY
- [ ] Backend shows helpful error message
- [ ] Fallback rule-based analysis activates
- [ ] Interview continues without AI
- [ ] No crash

### Invalid Session ID
- [ ] Proper 404 response
- [ ] User-friendly error message
- [ ] No crash or stack trace

### Network Disconnect
- [ ] Frontend handles connection error gracefully
- [ ] Retry mechanism activates
- [ ] User gets clear feedback
- [ ] No blank page

### Invalid Input
- [ ] Backend validates input
- [ ] 400 Bad Request returned
- [ ] Clear error message provided
- [ ] Frontend shows error to user

## Deployment Preparation

### Docker
- [ ] Dockerfile exists for backend
- [ ] Dockerfile exists for frontend
- [ ] `docker-compose.yml` properly configured
- [ ] Both images build without errors: `docker-compose build`
- [ ] Services start correctly: `docker-compose up`
- [ ] Services accessible on expected ports

### Configuration Files
- [ ] `.env.example` exists with all variables
- [ ] `.env` created from template
- [ ] `.env` not committed to git (check .gitignore)
- [ ] All required variables in `.env`
- [ ] No secrets in code or documentation

### Documentation
- [ ] README.md comprehensive and accurate
- [ ] QUICKSTART.md has correct instructions
- [ ] DEPLOYMENT.md covers your target platform
- [ ] ARCHITECTURE.md explains system design
- [ ] setup.bat/setup.sh work without issues
- [ ] run.bat/run.sh work without issues

### Logging
- [ ] Backend logs errors properly
- [ ] Frontend console logs don't have warnings
- [ ] Error messages are helpful
- [ ] No sensitive data in logs

## Browser Compatibility

- [ ] Chrome 90+ works correctly
- [ ] Firefox 88+ works correctly
- [ ] Safari 14+ works correctly
- [ ] Edge 90+ works correctly
- [ ] Mobile browsers work (responsive design)

## Accessibility

- [ ] Tab navigation works
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG standards
- [ ] All text is readable
- [ ] No blinking/flashing content

## Security Verification

- [ ] No API keys in frontend code
- [ ] No API keys in git repository
- [ ] CORS properly restricted
- [ ] Input validation working
- [ ] No console errors/warnings about security
- [ ] HTTPS ready (if deploying)

## Final Checks

- [ ] No uncommitted changes in version control
- [ ] All tests pass (if tests exist)
- [ ] Code review completed
- [ ] Documentation proofread
- [ ] Performance acceptable
- [ ] Budget and timeline met
- [ ] Stakeholders approve
- [ ] Ready for launch ✅

---

## Go/No-Go Decision

**All items checked?** → ✅ **GO TO PRODUCTION**

**Issues found?** → Document and prioritize:
1. **Critical** (blocking launch) → Fix before launch
2. **High** (degraded functionality) → Schedule for v2.0.1
3. **Medium** (minor issues) → Backlog for future
4. **Low** (polish/enhancement) → Nice-to-have

---

**Sign-off**:
- [ ] QA Lead Approval: _______________ Date: _______
- [ ] Tech Lead Approval: ______________ Date: _______
- [ ] Product Manager Approval: ________ Date: _______

---

**Launch Date**: _______________

**Production URL**: _______________

**Support Contact**: _______________
