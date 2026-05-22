import json
import os
import sys
from datetime import datetime

# Setup path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.schemas.interview import InterviewReport
from app.services.interview_manager import InterviewSession, session_manager

def test_validation():
    # Load session 4a6971c8-78cd-439a-84d1-f12c545d30b5
    session_id = "4a6971c8-78cd-439a-84d1-f12c545d30b5"
    sessions_dir = os.path.join("data", "sessions")
    session_path = os.path.join(sessions_dir, f"{session_id}.json")
    
    with open(session_path, 'r') as f:
        data = json.load(f)
        
    print("Session loaded successfully from disk.")
    
    # Let's instantiate InterviewSession and populate it
    session = InterviewSession(
        session_id=data["session_id"],
        interview_type=data["interview_type"],
        position=data["position"],
        experience_level=data["experience_level"],
        enable_proctoring="proctoring" in data
    )
    session.start_time = datetime.fromisoformat(data["start_time"])
    if data.get("end_time"):
        session.end_time = datetime.fromisoformat(data["end_time"])
    session.question_history = data["question_history"]
    session.answer_history = data["answer_history"]
    session.interview_state = data["interview_state"]
    
    report = session.get_session_report()
    print("Report generated successfully.")
    
    # Try to validate report like interview.py does
    proc_data = report.get("proctoring")
    if proc_data:
        risk = proc_data.get("risk_level", "low")
        if risk not in ["low", "medium", "high"]:
            risk = "low"
        proctoring_session = {
            "session_id": proc_data.get("session_id", session_id),
            "total_frames_analyzed": int(proc_data.get("total_frames_analyzed", 0)),
            "faces_detected_anomalies": int(proc_data.get("faces_detected_anomalies", proc_data.get("suspicious_events_count", 0))),
            "total_looking_away_duration_seconds": float(proc_data.get("total_looking_away_duration_seconds", 0.0)),
            "max_looking_away_duration_seconds": float(proc_data.get("max_looking_away_duration_seconds", 0.0)),
            "suspicious_events": int(proc_data.get("suspicious_events", proc_data.get("suspicious_events_count", 0))),
            "average_cheating_probability": float(proc_data.get("average_cheating_probability", 0.0)),
            "integrity_score": float(proc_data.get("integrity_score", 100.0)),
            "flagged_for_review": bool(proc_data.get("flagged_for_review", False)),
            "risk_level": risk,
        }
    else:
        proctoring_session = {
            "session_id": session_id,
            "total_frames_analyzed": 0,
            "faces_detected_anomalies": 0,
            "total_looking_away_duration_seconds": 0.0,
            "max_looking_away_duration_seconds": 0.0,
            "suspicious_events": 0,
            "average_cheating_probability": 0.0,
            "integrity_score": 100.0,
            "flagged_for_review": False,
            "risk_level": "low",
        }

    try:
        validated_report = InterviewReport(
            session_id=report["session_id"],
            interview_type=report["interview_type"],
            position=report["position"],
            experience_level=report["experience_level"],
            interview_date=report["start_time"],
            duration_minutes=int(report["duration_minutes"]),
            metrics={
                "overall_score": report["metrics"]["overall_score"],
                "communication_score": report["metrics"]["communication_score"],
                "technical_score": report["metrics"]["technical_score"],
                "confidence_score": report["metrics"]["confidence_score"],
                "problem_solving_score": report["metrics"]["problem_solving_score"],
                "behavioral_score": report["metrics"]["behavioral_consistency_score"],
                "consistency_score": report["metrics"]["behavioral_consistency_score"],
                "employability_rating": report["metrics"]["employability_rating"],
            },
            proctoring=proctoring_session,
            recommendation={
                "recommendation_id": session_id,
                "candidate_status": "RECOMMENDED" if report["metrics"]["overall_score"] >= 70 else "REQUIRES_REVIEW" if report["metrics"]["overall_score"] >= 60 else "NOT_RECOMMENDED",
                "recommended_for_round": "technical" if report["metrics"]["overall_score"] >= 70 else None,
                "strengths": report["strengths"],
                "concerns": report["weaknesses"],
                "recommendation_text": report["feedback"],
                "follow_up_actions": ["Review feedback", "Schedule next round"],
            },
            answer_summaries=[{"index": i, "score": report["metrics"]["overall_score"]} for i in range(len(session.answer_history))],
            interview_transcript=report["interview_transcript"],
        )
        print("Pydantic validation SUCCEEDED!")
    except Exception as e:
        print("Pydantic validation FAILED!")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_validation()
