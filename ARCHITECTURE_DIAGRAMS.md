# System Architecture Diagram

## High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       STUDENT SESSION                            │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │  STUDY SESSION   │  │   QUIZ PAGE      │  │ DASHBOARD    │   │
│  │  - Topic reading │  │ - Answer Qs      │  │ - Analytics  │   │
│  │  - Explanation   │  │ - Timer ticking  │  │ - Metrics    │   │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────────┘   │
│           │                     │                      ▲         │
│           │                     │                      │         │
│           └─────────────────────┴──────────────────────┘         │
│                      (Quiz submission)                            │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────┐
        │ COGNITIVE SENSORS PANEL (NEW)            │
        │                                          │
        │  ┌────────────────────┐  ┌────────────┐ │
        │  │  CAMERA FEED       │  │  ENERGY    │ │
        │  │                    │  │  LEVEL     │ │
        │  │  [Video Stream]    │  │  █████░░░░ │ │
        │  └────────────────────┘  └────────────┘ │
        │                                          │
        │  ┌────────────────────────────────────┐ │
        │  │  METRICS (Real-time)               │ │
        │  │  • Focus Score: 82%                │ │
        │  │  • Distraction: 18%                │ │
        │  │  • Hesitation: 28%                 │ │
        │  └────────────────────────────────────┘ │
        │                                          │
        │  [Enable Camera & Mic Button]           │
        └──────────────────────────────────────────┘
                   │                    │
                   ▼                    ▼
        ┌─────────────────┐   ┌──────────────────┐
        │ FACE DETECTOR   │   │ WEB SPEECH API   │
        │ (Browser)       │   │ (Browser)        │
        │                 │   │                  │
        │ • Detect face   │   │ • Recognize      │
        │ • Get position  │   │   words          │
        │ • Get size      │   │ • Count pauses   │
        └────────┬────────┘   └────────┬─────────┘
                 │                     │
                 ▼                     ▼
        ┌─────────────────┐   ┌──────────────────┐
        │ CAMERA METRICS  │   │ VOICE METRICS    │
        │ (JS Utils)      │   │ (JS Utils)       │
        │                 │   │                  │
        │ • focusScore    │   │ • hesitation     │
        │ • distraction   │   │ • pauseRatio     │
        │ • confusion     │   │ • energyLevel    │
        │ • lookAway      │   │ • fillerRate     │
        └────────┬────────┘   └────────┬─────────┘
                 │                     │
                 └──────────┬──────────┘
                            │
                            ▼
            ┌───────────────────────────────────┐
            │ SENSOR METRICS STATE              │
            │ (React Component State)           │
            │                                   │
            │ sensorMetrics = {                 │
            │   cameraMetrics: {...},           │
            │   voiceMetrics: {...}             │
            │ }                                 │
            └────────────┬──────────────────────┘
                         │
                         ▼
            ┌───────────────────────────────────┐
            │ QUIZ SUBMISSION HANDLER           │
            │                                   │
            │ • Collect all metrics             │
            │ • Send to /prediction endpoint    │
            │ • Include sensor data in request  │
            └────────────┬──────────────────────┘
                         │
                         ▼
            ┌───────────────────────────────────┐
            │ POST /api/analytics/sensor-summary│
            │                                   │
            │ Body: {                           │
            │   sessionId,                      │
            │   cameraMetrics,                  │
            │   voiceMetrics                    │
            │ }                                 │
            └────────────┬──────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────┐
        │ BACKEND STORAGE                        │
        │                                        │
        │ store.json:                            │
        │ {                                      │
        │   "analytics": {                       │
        │     "session-123": {                   │
        │       "cameraMetrics": {...},          │
        │       "voiceMetrics": {...}            │
        │     }                                  │
        │   }                                    │
        │ }                                      │
        └────────────┬─────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ POST /api/prediction                   │
        │                                        │
        │ • Typing features (existing)           │
        │ • Camera features (NEW)                │
        │ • Voice features (NEW)                 │
        └────────────┬─────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ ML FEATURE FUSION (ml-service)         │
        │                                        │
        │ build_behavior_features()              │
        │ + build_sensor_features()              │
        │ = combined_features                    │
        └────────────┬─────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ ML MODEL ENSEMBLE                      │
        │                                        │
        │ • Cognitive Classifier                 │
        │ • Burnout Detector                     │
        │ • Efficiency Predictor                 │
        │ • Fake Understanding Detector          │
        └────────────┬─────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ PREDICTION OUTPUT                      │
        │                                        │
        │ {                                      │
        │   "cognitive_state": "Clear",          │
        │   "burnout_risk": 0,                   │
        │   "time_to_master_min": 25.5,          │
        │   "fake_understanding": 0,             │
        │   "adaptive_action": "Increase..."     │
        │ }                                      │
        └────────────┬─────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ ANALYTICS DASHBOARD                    │
        │                                        │
        │ ┌──────────────────────────────────┐   │
        │ │ Predicted State:     Clear        │   │
        │ │ Focus Score:         82%          │   │
        │ │ Speech Hesitation:   28%          │   │
        │ │ Learning Efficiency: 88%          │   │
        │ └──────────────────────────────────┘   │
        │                                        │
        │ [Charts, graphs, insights...]          │
        │                                        │
        └────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App.jsx (Main)
│
├─ AppNav.jsx (Navigation)
│
├─ Home.jsx (Landing page)
│
├─ TopicDashboard.jsx (Topic selection)
│
├─ StudySession.jsx (Study phase)
│  │
│  ├─ [Textarea] (Explanation input)
│  │
│  └─ CognitiveSensorsPanel.jsx (NEW)
│     │
│     ├─ [Video element] (Camera feed)
│     │
│     ├─ [Audio analysis] (Microphone)
│     │
│     └─ [Metric cards] (Real-time display)
│        ├─ Focus Score card
│        ├─ Distraction card
│        └─ Hesitation card
│
├─ Quiz.jsx (Quiz phase)
│  │
│  ├─ [Quiz questions]
│  │
│  └─ CognitiveSensorsPanel.jsx (NEW)
│     └─ [Same as StudySession]
│
└─ Dashboard.jsx (Analytics)
   │
   ├─ [KPI cards]
   │  ├─ Predicted State
   │  ├─ Learning Efficiency
   │  ├─ Focus Score (NEW)
   │  └─ Speech Hesitation (NEW)
   │
   └─ [Various charts]
      ├─ Growth tracking
      ├─ Topic mastery
      └─ Heatmap
```

---

## File Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend Layer                                              │
│                                                              │
│ App.jsx                                                     │
│  ├─ useTypingBehavior() [hook]                             │
│  ├─ api.predict()  ────────┐                              │
│  ├─ api.saveSensorSummary() ────┐  [UPDATED]              │
│  │                          │    │                          │
│  └─ StudySession.jsx        │    │                         │
│     ├─ CognitiveSensorsPanel.jsx [NEW]                     │
│     │  ├─ computeCameraSensorSummary()  ─┐                │
│     │  │  cognitiveSensors.js [NEW]      │                │
│     │  └─ computeVoiceSensorSummary()    │                │
│     │                                     │                │
│     └─ onSensorMetricsUpdate() ──────────┘                │
│                                                              │
│  └─ Quiz.jsx                                               │
│     └─ CognitiveSensorsPanel.jsx [NEW] (same as above)    │
│                                                              │
│  └─ Dashboard.jsx [UPDATED]                                │
│     └─ Display cameraMetrics, voiceMetrics                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ api.predict()
                        │ api.saveSensorSummary()
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend Layer                                               │
│                                                              │
│ api.py [UPDATED]                                           │
│  ├─ POST /analytics/sensor-summary                        │
│  │  └─ store.py [UPDATED]                                 │
│  │     └─ db["analytics"] [NEW KEY]                       │
│  │                                                          │
│  └─ POST /prediction                                       │
│     └─ ml_bridge.py                                        │
│        └─ predict_all()                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ predict_all()
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ ML Service Layer                                            │
│                                                              │
│ predict.py [UPDATED]                                       │
│  │                                                          │
│  ├─ build_behavior_features()   (existing)               │
│  │  └─ feature_pipeline/build_features.py                │
│  │                                                          │
│  ├─ build_sensor_features()     (NEW)                    │
│  │  └─ feature_pipeline/vision_audio_features.py [NEW]  │
│  │                                                          │
│  └─ ML Models (unchanged):                                │
│     ├─ cognitive_classifier.pkl                          │
│     ├─ fake_understanding.pkl                            │
│     ├─ efficiency_predictor.pkl                          │
│     └─ burnout_detector.pkl                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Schema (store.json)

```json
{
  "sessions": {
    "session-123456": {
      "sessionId": "session-123456",
      "topic": "DBMS Normalization",
      "userId": "user-001",
      "startedAt": "2026-05-12T14:30:00Z"
    }
  },
  
  "behaviors": {
    "session-123456": {
      "sessionId": "session-123456",
      "topic": "DBMS Normalization",
      "features": {
        "typingSpeedWpm": 35,
        "averagePauseMs": 1200,
        "backspaceRate": 0.16
        ...
      },
      "records": [{...}, {...}],
      "updatedAt": "2026-05-12T14:35:00Z"
    }
  },
  
  "quiz_results": {
    "session-123456": {
      "sessionId": "session-123456",
      "answers": {...},
      "quizScore": 75,
      "submittedAt": "2026-05-12T14:42:00Z"
    }
  },
  
  "predictions": {
    "session-123456": {
      "sessionId": "session-123456",
      "quizScore": 75,
      "result": {
        "cognitive_state": "Clear",
        "burnout_risk": 0,
        "time_to_master_min": 25.5
        ...
      },
      "createdAt": "2026-05-12T14:42:30Z"
    }
  },
  
  "analytics": {
    "session-123456": {
      "sessionId": "session-123456",
      "cameraMetrics": {
        "faceDetected": true,
        "focusScore": 0.82,
        "distractionScore": 0.18,
        "confusionScore": 0.12,
        "lookAwayRatio": 0.15
      },
      "voiceMetrics": {
        "hesitationScore": 0.28,
        "pauseRatio": 0.35,
        "fillerRate": 0.08,
        "energyLevel": 0.65,
        "speechRateWpm": 140
      },
      "updatedAt": "2026-05-12T14:42:00Z"
    }
  }
}
```

---

## Browser API Stack

```
HARDWARE (Webcam + Microphone)
       │
       ▼
┌─────────────────────────────────────────┐
│ Browser APIs                            │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ getUserMedia (Media Streams API)    │ │
│ │ → Access to webcam + mic stream     │ │
│ └─────────────────────────────────────┘ │
│                   │                      │
│          ┌────────┴────────┐            │
│          ▼                 ▼            │
│   ┌────────────────┐  ┌────────────────┐│
│   │ FaceDetector   │  │ Web Audio API  ││
│   │ (Proposed)     │  │ (AudioContext) ││
│   │ • Detect faces │  │ • FFT Analysis ││
│   │ • Get boxes    │  │ • Frequency    ││
│   │ • In Chrome,   │  │   data         ││
│   │   Edge only    │  │ • Universal    ││
│   │   ⚠️ Fallback  │  │   support      ││
│   │   to defaults  │  └────────────────┘│
│   └────────┬───────┘         │           │
│            │                 │           │
│            └────────┬────────┘           │
│                     │                    │
│            ┌────────▼────────┐           │
│            │ SpeechRecognition│           │
│            │ • Transcribe     │           │
│            │   speech         │           │
│            │ • Get words      │           │
│            │ • Chrome/Safari  │           │
│            │ ⚠️ No Firefox    │           │
│            └────────┬────────┘           │
│                     │                    │
└─────────────────────┼────────────────────┘
                      │
                      ▼
            JavaScript Processing
            (All in browser, no server)
```

---

## Timing Diagram (Per Quiz Session)

```
Time   │ Study Session          │ Quiz            │ Submission
       │                        │                 │
0:00   │ [Start Session]        │                 │
       │ - Create session       │                 │
       │ - Init typing tracking │                 │
       │                        │                 │
0:05   │ [User enables sensors] │                 │
       │ - Request permissions  │                 │
       │ - Start camera stream  │                 │
       │ - Start speech rec     │                 │
       │ - Start metric updates │                 │
       │ (~30 fps)              │                 │
       │                        │                 │
0:10   │ [Real-time metrics]    │                 │
       │ focusScore = 0.85      │                 │
       │ hesitation = 0.20      │                 │
       │ energyLevel = 0.65     │                 │
       │                        │                 │
0:20   │ [User explains topic]  │                 │
       │ Typing + Camera data   │                 │
       │ collected continuously │                 │
       │                        │                 │
0:35   │ [User submits]         │                 │
       │ - Save typing features │                 │
       │ - Save camera metrics  │                 │
       │ - Save voice metrics   │                 │
       │ → Dashboard            │                 │
       │                        │                 │
0:36   │                        │ [Quiz starts]   │
       │                        │ Sensors stay on │
       │                        │ Metrics update  │
       │                        │ during answers  │
       │                        │                 │
1:00   │                        │ [User answers]  │
       │                        │ 10 questions    │
       │                        │ + pause/hesitate│
       │                        │ → hesitation ↑  │
       │                        │                 │
1:15   │                        │ [Submit quiz]   │
       │                        │                 │ [Collect all data]
       │                        │                 │ - Typing features
       │                        │                 │ - Camera metrics
       │                        │                 │ - Voice metrics
       │                        │                 │ - Quiz score
       │                        │                 │ POST /prediction
       │                        │                 │
1:16   │                        │                 │ [ML inference]
       │                        │                 │ + feature fusion
       │                        │                 │ + model ensemble
       │                        │                 │
1:17   │                        │                 │ [Response]
       │                        │                 │ - Cognitive state
       │                        │                 │ - Adaptive action
       │                        │                 │ - Show dashboard
```

---

## Request/Response Example

### Quiz Submission with Sensors

**Request:**
```http
POST /api/prediction HTTP/1.1
Content-Type: application/json

{
  "sessionId": "session-1234",
  "quizScore": 75,
  "rawBehavior": {
    // Existing typing features
    "typing_speed_wpm": 35.2,
    "avg_pause_ms": 1120,
    "backspace_rate": 0.16,
    "rewrite_frequency": 0.38,
    "focus_loss_events": 2,
    "tab_switch_count": 3,
    "question_time_sec": 92,
    
    // NEW: Sensor features
    "camera_focus_score": 0.82,
    "camera_distraction_score": 0.18,
    "camera_confusion_score": 0.12,
    "camera_look_away_ratio": 0.15,
    "voice_hesitation_score": 0.28,
    "voice_pause_ratio": 0.35,
    "voice_confidence_score": 0.72,
    "voice_filler_rate": 0.08
  }
}
```

**Response:**
```json
{
  "features": {
    "typing_speed_wpm": 35.2,
    "avg_pause_ms": 1120,
    "camera_focus_score": 0.82,
    "voice_hesitation_score": 0.28,
    "sensor_fatigue_level": 0.31,
    "sensor_confidence_level": 0.65
  },
  "cognitive_state": "Clear",
  "fake_understanding": 0,
  "time_to_master_min": 25.5,
  "burnout_risk": 0,
  "adaptive_action": "Increase difficulty and introduce challenge problems."
}
```

---

## Deployment Topology

```
                  ┌─────────────────┐
                  │  Student Browser│
                  │  (Chrome/Safari)│
                  │                 │
                  │ ┌─────────────┐ │
                  │ │ React App   │ │
                  │ │ + Sensors   │ │
                  │ └─────────────┘ │
                  └────────┬────────┘
                           │
                           │ (HTTP/HTTPS)
                           │
                    ┌──────▼───────┐
                    │  Flask Backend│
                    │  :5000        │
                    │               │
                    │ ┌───────────┐ │
                    │ │ /api/...  │ │
                    │ │ /prediction│ │
                    │ │ /analytics │ │
                    │ └───────────┘ │
                    └────────┬──────┘
                             │
                    ┌────────▼──────┐
                    │ Data Store    │
                    │ store.json    │
                    │ (JSON file)   │
                    └───────────────┘
                             │
                    ┌────────▼──────┐
                    │ ML Service    │
                    │ (Python)      │
                    │               │
                    │ ┌───────────┐ │
                    │ │ Models    │ │
                    │ │ Features  │ │
                    │ │ Inference │ │
                    │ └───────────┘ │
                    └───────────────┘
```

---

**Last Updated:** May 12, 2026
**Version:** 1.0 (with Cognitive Sensors)

