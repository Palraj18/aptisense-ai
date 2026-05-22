"""Proctoring API endpoints."""
from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any
from app.services.interview_manager import session_manager

router = APIRouter(prefix="/api/v1/proctoring", tags=["proctoring"])


@router.post("/analyze-frame/{session_id}")
async def analyze_frame(
    session_id: str,
    face_detected: bool = False,
    face_count: int = 0,
    face_confidence: float = 0.0,
    looking_direction: str = "forward",
    eyes_visible: bool = True,
    head_pose: Optional[Dict[str, float]] = None,
):
    """Analyze a single proctoring frame."""
    try:
        session = session_manager.get_session(session_id)
        if not session or not session.proctoring:
            raise HTTPException(status_code=404, detail="Session or proctoring not found")
        
        analysis = session.proctoring.analyze_frame(
            face_detected=face_detected,
            face_count=face_count,
            face_confidence=face_confidence,
            looking_direction=looking_direction,
            eyes_visible=eyes_visible,
            head_pose=head_pose,
        )
        
        return analysis
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/integrity-score/{session_id}")
async def get_integrity_score(session_id: str):
    """Get current proctoring integrity score."""
    try:
        session = session_manager.get_session(session_id)
        if not session or not session.proctoring:
            raise HTTPException(status_code=404, detail="Session or proctoring not found")
        
        integrity = session.proctoring.get_session_integrity_score()
        return integrity
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/brief-summary/{session_id}")
async def get_brief_summary(session_id: str):
    """Get brief proctoring summary."""
    try:
        session = session_manager.get_session(session_id)
        if not session or not session.proctoring:
            raise HTTPException(status_code=404, detail="Session or proctoring not found")
        
        summary = session.proctoring.get_brief_summary()
        return summary
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/flag-suspicious/{session_id}")
async def flag_suspicious_activity(
    session_id: str,
    activity_type: str,
    severity: str = "medium",
    details: Optional[Dict[str, Any]] = None,
):
    """Manually flag suspicious activity."""
    try:
        session = session_manager.get_session(session_id)
        if not session or not session.proctoring:
            raise HTTPException(status_code=404, detail="Session or proctoring not found")
        
        from app.services.proctoring import ProctoringEvent
        from datetime import datetime
        
        event = ProctoringEvent(
            timestamp=datetime.utcnow(),
            event_type=activity_type,
            severity=severity,
            details=details or {},
        )
        
        session.proctoring._log_event(event)
        
        return {
            "success": True,
            "message": f"Activity flagged: {activity_type}",
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
