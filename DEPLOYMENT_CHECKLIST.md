# Deployment Checklist - Cognitive Sensors

## Pre-Deployment Testing

### 1. Frontend Build & Browser Testing

#### Build Verification
```bash
cd frontend
npm run build
# ✅ Should complete with no errors
# ⚠️ Warnings about bundle size are normal (vite optimization)
```

#### Browser Testing (Test in Chrome First)
- [ ] Visit `http://localhost:5173`
- [ ] Click "Explore Topics" → Select topic
- [ ] Go to "Study Session"
- [ ] Verify "Sensor fusion" panel visible on right side
- [ ] Click "Enable camera & mic" button
- [ ] Grant browser permissions when prompted
- [ ] Verify:
  - [ ] Camera feed displays (see your face)
  - [ ] Focus Score shows 40-100%
  - [ ] Energy level animates with voice/sound
  - [ ] Metrics update every ~1 second

#### Cross-Browser Testing
```
Chrome/Chromium:    ✅ Full support (FaceDetector + Speech)
Firefox:            ⚠️  Camera works, Speech API not available
Safari:             ✅ Most features work
Edge:               ✅ Full support
Mobile (Chrome):    ⚠️  Camera works but small screen
```

### 2. Backend Testing

#### API Endpoint Verification
```bash
# Test sensor summary endpoint
curl -X POST http://localhost:5000/api/analytics/sensor-summary \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "cameraMetrics": {"focusScore": 0.8},
    "voiceMetrics": {"hesitationScore": 0.2}
  }'

# ✅ Should return: {"message": "sensor summary saved", "sessionId": "test-123"}
```

#### Database Schema Verification
```bash
# Check backend/data/store.json after quiz submission
cat backend/data/store.json | grep -A 10 "analytics"

# Should show:
# "analytics": {
#   "session-xxxx": {
#     "cameraMetrics": {...},
#     "voiceMetrics": {...}
#   }
# }
```

### 3. End-to-End Quiz Flow

#### Complete Session Flow
1. [ ] Start session → "Enable camera & mic"
2. [ ] Read study material for ~30 seconds
3. [ ] Move head left/right (verify focus score drops)
4. [ ] Say a few words naturally (verify hesitation score updates)
5. [ ] Click "Quiz"
6. [ ] Answer 3-5 questions while sensors active
7. [ ] During answers, pause deliberately (hesitation should spike)
8. [ ] Submit quiz
9. [ ] Check analytics dashboard:
    - [ ] "Focus Score" metric visible
    - [ ] "Speech Hesitation" metric visible
    - [ ] Values are reasonable (0-100%, not NaN or undefined)

### 4. ML Integration Testing

#### Sensor Data in Prediction
```bash
# After quiz submission, check backend logs
# Should see sensor features included in prediction request:

# Expected in POST /prediction body:
{
  "camera_focus_score": 0.82,
  "camera_distraction_score": 0.18,
  "voice_hesitation_score": 0.28,
  "voice_pause_ratio": 0.35,
  ...
}
```

#### Model Output Validation
- [ ] ML models load successfully (no FileNotFoundError)
- [ ] Predictions include sensor features
- [ ] Cognitive state output makes sense for actual behavior
- [ ] Adaptive recommendations reflect sensor data

### 5. Performance Testing

#### CPU/Memory Impact
- [ ] Open DevTools (F12) → Performance tab
- [ ] During sensor streaming:
  - [ ] CPU usage <15% (camera processing)
  - [ ] Memory stable (no leaks)
- [ ] No "jank" or frame rate drops
- [ ] Metrics update smoothly

#### Stress Test (Optional)
- [ ] Leave sensors running for 10+ minutes
- [ ] Verify no memory leak or freezing
- [ ] Check browser console for errors

### 6. Error Handling Testing

#### Graceful Degradation
- [ ] Deny camera permission → should show "Permission denied" in panel
- [ ] Deny microphone permission → ditto
- [ ] Unplug camera while running → metrics should gracefully zero
- [ ] Disable microphone in OS → voice metrics should stay at defaults
- [ ] Close browser dev tools → sensors should continue working

#### Browser Incompatibility
- [ ] Test in Firefox → camera works, speech metrics unavailable (OK)
- [ ] Test in Safari → should work fine
- [ ] Test in older Chrome/Edge → should fallback gracefully

---

## Production Deployment

### Before Going Live

#### Code Review Checklist
- [ ] All TypeScript/Python syntax validated (build/compile passes)
- [ ] No console errors (check browser DevTools)
- [ ] No backend Python tracebacks in logs
- [ ] ML models loadable (`ml-service/models/` directory exists)

#### Security Review
- [ ] ✅ No external API calls (all local processing)
- [ ] ✅ No credentials in frontend code
- [ ] ✅ Backend validates sessionId
- [ ] ⚠️ HTTPS enforced if applicable
- [ ] ⚠️ Privacy policy documents camera/mic usage

#### Documentation Review
- [ ] ✅ QUICKSTART_SENSORS.md reviewed
- [ ] ✅ ARCHITECTURE_COGNITIVE_SENSORS.md reviewed
- [ ] ✅ IMPLEMENTATION_SUMMARY.md reviewed
- [ ] [ ] Privacy policy/terms updated for students

### Deployment Steps

#### Step 1: Backend Deployment
```bash
# Verify backend runs
cd backend
python main.py
# ✅ Should start on http://localhost:5000

# Verify database schema
cat data/store.json | grep '"analytics"'
# ✅ Should exist

# Check ML models exist
ls ml-service/models/
# ✅ Should show:
# - cognitive_classifier.pkl
# - fake_understanding.pkl
# - efficiency_predictor.pkl
# - burnout_detector.pkl
```

#### Step 2: Frontend Deployment
```bash
# Build production bundle
cd frontend
npm run build
# ✅ Creates dist/ folder

# Test production build locally
npm run preview
# Visit http://localhost:4173
# ✅ All features should work
```

#### Step 3: Environment Variables
```bash
# Set in your deployment environment:
VITE_API_URL=https://your-api.example.com/api  # (if different from localhost)
```

#### Step 4: Database Migration
```bash
# If upgrading existing database:
python scripts/migrate_analytics_schema.py

# Or manually add "analytics" to store.json if missing:
{
  "sessions": {...},
  "behaviors": {...},
  "quiz_results": {...},
  "predictions": {...},
  "analytics": {}  # ← Add this
}
```

### Post-Deployment Monitoring

#### Week 1: Close Monitoring
- [ ] Check error logs daily
- [ ] Monitor CPU/memory usage
- [ ] Collect feedback from test group (50 students)
- [ ] Fix any reported issues

#### Week 2: Metrics Analysis
- [ ] Verify sensor accuracy (compare to manual scoring)
- [ ] Check ML prediction accuracy (target >70%)
- [ ] Calibrate thresholds if needed
- [ ] Analyze sensor data distribution

#### Week 3: Full Rollout
- [ ] Deploy to all students
- [ ] Monitor for scale issues
- [ ] Continue collecting feedback

#### Week 4: Optimization
- [ ] Profile performance bottlenecks
- [ ] Optimize if needed
- [ ] Document learnings
- [ ] Plan next iteration

---

## Rollback Plan

If issues arise post-deployment:

### Quick Rollback (Disable Sensors Only)
```javascript
// frontend/src/components/CognitiveSensorsPanel.jsx
// Temporarily comment out sensor processing

export const CognitiveSensorsPanel = ({ onMetricsUpdate }) => {
  // DISABLE: Don't process sensors, just pass empty metrics
  useEffect(() => {
    onMetricsUpdate({ 
      cameraMetrics: {}, 
      voiceMetrics: {} 
    });
  }, []);
  
  return <div>Sensors temporarily disabled</div>;
};
```

### Full Rollback (Revert to Previous Commit)
```bash
git revert HEAD  # Or git checkout <previous-commit>
npm run build
# Redeploy backend + frontend
```

### Data Loss Prevention
- ✅ All sensor data backed up in store.json
- ✅ No cascading database migrations
- ✅ Can restore from backup if needed

---

## Monitoring & Maintenance

### Daily Checks
```
[ ] Backend service running (http://localhost:5000/api/health)
[ ] Database file exists and readable (backend/data/store.json)
[ ] ML models loaded successfully (check backend logs)
[ ] No spike in error logs
```

### Weekly Checks
```
[ ] Sensor accuracy still >70%
[ ] CPU/memory usage stable
[ ] Database file size reasonable (<100MB)
[ ] Student feedback positive
```

### Monthly Reviews
```
[ ] Performance metrics (response time, accuracy)
[ ] Feature request backlog
[ ] Bug fix priority list
[ ] Threshold calibration needs
```

---

## Troubleshooting Hotline

### Issue: "FaceDetector is not defined"
**Solution**: Browser doesn't support FaceDetector (Firefox/Safari)
- This is OK, app has graceful fallback
- Focus metrics will default to 0.5

### Issue: "Metrics stuck at default values"
**Solution**: Sensors not streaming
- Verify camera/mic permissions granted
- Refresh page and retry
- Check browser console for errors

### Issue: "ML predictions not including sensor data"
**Solution**: Feature pipeline not updated
- Verify `ml-service/inference/predict.py` imports `build_sensor_features`
- Check sensor fields present in raw_behavior dict
- Test prediction endpoint directly with sensor data

### Issue: "Dashboard shows NaN for focus/hesitation"
**Solution**: Metrics not being sent from frontend
- Verify `CognitiveSensorsPanel` mounted in Quiz/StudySession
- Check `onMetricsUpdate` callback is wired correctly
- Look at network requests (DevTools) - sensor summary request should succeed

### Issue: "Performance degradation after 10 minutes"
**Solution**: Memory leak in sensor streaming
- Unplug camera + microphone
- Refresh page
- Check requestAnimationFrame cleanup in useEffect

---

## Success Criteria

### Core Functionality
✅ Camera permission flow works smoothly
✅ Sensors stream metrics at ~30Hz with <5% CPU
✅ Metrics correlate with actual behavior (face position ↔ focus)
✅ Backend receives and stores sensor data
✅ Dashboard displays metrics without errors
✅ ML predictions improved with sensor data

### Performance
✅ <500ms page load time
✅ <50ms per prediction
✅ <15% CPU during sensor streaming
✅ No memory leaks over 1+ hours
✅ Supports 1000+ concurrent quiz sessions

### User Experience
✅ Permission flow intuitive and clear
✅ Error messages helpful and actionable
✅ Metrics update smoothly in real-time
✅ No crashes or unexpected behaviors
✅ Teachers understand dashboard metrics

---

## Sign-Off Checklist

- [ ] QA Lead: All tests passed
- [ ] Tech Lead: Code review completed
- [ ] Product Manager: Feature complete per spec
- [ ] Privacy Officer: Privacy policy updated
- [ ] DevOps: Deployment plan reviewed
- [ ] Teachers: Documentation reviewed
- [ ] Students: UX testing completed

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Reviewed By:** _______________

---

*For emergency support, contact your DevOps team or file issue in GitHub.*

