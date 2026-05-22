# NeuroLearn++ Backend

Flask API layer for session tracking, behavior ingestion, quiz evaluation, and ML predictions.

## Endpoints

- `GET /api/health`
- `POST /api/session`
- `POST /api/behavior`
- `POST /api/quiz/evaluate`
- `POST /api/prediction`

## Run

```bash
pip install -r requirements.txt
python main.py
```

Server starts on `http://localhost:5000`.

## Example prediction payload

```json
{
  "sessionId": "session-001",
  "quizScore": 62,
  "rawBehavior": {
    "typing_speed_wpm": 31,
    "avg_pause_ms": 1120,
    "backspace_rate": 0.16,
    "rewrite_frequency": 0.38,
    "focus_loss_events": 2,
    "tab_switch_count": 3,
    "question_time_sec": 92
  }
}
```
