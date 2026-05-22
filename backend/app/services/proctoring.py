"""Enhanced proctoring service for interview integrity monitoring."""
import base64
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict


@dataclass
class ProctoringEvent:
    """Single proctoring event."""
    timestamp: datetime
    event_type: str  # "face_detected", "looking_away", "multiple_faces", "suspicious"
    severity: str  # "low", "medium", "high"
    details: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp.isoformat(),
            "event_type": self.event_type,
            "severity": self.severity,
            "details": self.details,
        }


class ProctoringService:
    """Monitors proctoring metrics and detects suspicious behavior."""

    def __init__(self, session_id: str):
        """Initialize proctoring service."""
        self.session_id = session_id
        self.events: List[ProctoringEvent] = []
        self.frames_analyzed = 0
        self.frames_with_face = 0
        self.looking_away_start: Optional[datetime] = None
        self.looking_away_durations: List[float] = []
        self.face_detection_history: List[int] = []
        self.eye_movement_history: List[Dict[str, float]] = []
        self.suspicious_activity_count = 0
        self.session_start = datetime.utcnow()

    def analyze_frame(
        self,
        frame_data: Optional[str] = None,
        face_detected: bool = False,
        face_count: int = 0,
        face_confidence: float = 0.0,
        looking_direction: str = "forward",
        eyes_visible: bool = True,
        head_pose: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        """
        Analyze a single frame for proctoring metrics.
        
        Args:
            frame_data: Base64 encoded frame (optional)
            face_detected: Whether face was detected
            face_count: Number of faces detected
            face_confidence: Confidence score for face detection
            looking_direction: Direction candidate is looking ("forward", "left", "right", "down", "up")
            eyes_visible: Whether eyes are visible
            head_pose: Head pose angles (yaw, pitch, roll)
            
        Returns:
            Frame analysis with integrity metrics
        """
        self.frames_analyzed += 1
        analysis = {
            "frame_number": self.frames_analyzed,
            "timestamp": datetime.utcnow().isoformat(),
            "faces_detected": face_count,
            "face_confidence": face_confidence,
            "looking_direction": looking_direction,
            "eyes_visible": eyes_visible,
            "suspicious_activity": False,
            "cheating_probability": 0.0,
        }
        
        # Face detection analysis
        if face_detected and face_count == 1:
            self.frames_with_face += 1
            analysis["faces_detected"] = 1
            
            # Reset looking away timer if looking forward
            if looking_direction == "forward" and self.looking_away_start:
                duration = (datetime.utcnow() - self.looking_away_start).total_seconds()
                self.looking_away_durations.append(duration)
                self._check_looking_away_threshold(duration)
                self.looking_away_start = None
            
            # Start looking away timer
            elif looking_direction != "forward" and not self.looking_away_start:
                self.looking_away_start = datetime.utcnow()
                self._log_event(
                    ProctoringEvent(
                        timestamp=datetime.utcnow(),
                        event_type="looking_away",
                        severity="medium",
                        details={"direction": looking_direction, "eyes_visible": eyes_visible},
                    )
                )
        
        # Multiple faces detection
        if face_count > 1:
            self.suspicious_activity_count += 1
            analysis["suspicious_activity"] = True
            analysis["cheating_probability"] += 0.3
            self._log_event(
                ProctoringEvent(
                    timestamp=datetime.utcnow(),
                    event_type="multiple_faces",
                    severity="high",
                    details={"face_count": face_count},
                )
            )
        
        # No face detection
        if not face_detected or face_count == 0:
            self.suspicious_activity_count += 1
            analysis["suspicious_activity"] = True
            analysis["cheating_probability"] += 0.2
            self._log_event(
                ProctoringEvent(
                    timestamp=datetime.utcnow(),
                    event_type="no_face_detected",
                    severity="high",
                    details={"duration": "ongoing"},
                )
            )
        
        # Eyes not visible
        if face_detected and not eyes_visible:
            analysis["suspicious_activity"] = True
            analysis["cheating_probability"] += 0.15
        
        # Cap cheating probability
        analysis["cheating_probability"] = min(1.0, analysis["cheating_probability"])
        
        # Add head pose analysis if available
        if head_pose:
            analysis["head_pose"] = head_pose
            # Extreme head poses indicate suspicious behavior
            if abs(head_pose.get("yaw", 0)) > 45 or abs(head_pose.get("pitch", 0)) > 40:
                analysis["suspicious_activity"] = True
                analysis["cheating_probability"] += 0.1
        
        self.face_detection_history.append(face_count)
        
        return analysis

    def _check_looking_away_threshold(self, duration: float) -> None:
        """Check if looking away duration exceeds threshold."""
        from app.core.config import settings
        
        max_duration = settings.MAX_LOOKING_AWAY_DURATION_SECONDS
        if duration > max_duration:
            self._log_event(
                ProctoringEvent(
                    timestamp=datetime.utcnow(),
                    event_type="excessive_looking_away",
                    severity="high",
                    details={"duration": duration, "threshold": max_duration},
                )
            )

    def _log_event(self, event: ProctoringEvent) -> None:
        """Log a proctoring event."""
        self.events.append(event)

    def get_session_integrity_score(self) -> Dict[str, Any]:
        """
        Calculate overall session integrity score.
        
        Returns:
            Comprehensive integrity assessment
        """
        if self.frames_analyzed == 0:
            return self._get_empty_integrity()
        
        # Face presence score
        face_presence_ratio = self.frames_with_face / self.frames_analyzed
        face_score = face_presence_ratio * 100
        
        # Looking away analysis
        max_looking_away = max(self.looking_away_durations) if self.looking_away_durations else 0
        avg_looking_away = (
            sum(self.looking_away_durations) / len(self.looking_away_durations)
            if self.looking_away_durations
            else 0
        )
        
        # Suspicious activity score
        suspicious_events = len([e for e in self.events if e.event_type in [
            "multiple_faces", "no_face_detected", "excessive_looking_away"
        ]])
        suspicion_score = max(0, 100 - (suspicious_events * 10))
        
        # Overall integrity
        overall_integrity = (
            (face_score * 0.5) +
            (suspicion_score * 0.5)
        )
        
        # Determine risk level
        if overall_integrity >= 80:
            risk_level = "low"
        elif overall_integrity >= 60:
            risk_level = "medium"
        else:
            risk_level = "high"
        
        # Average cheating probability
        cheating_probabilities = [
            0.3 if e.event_type == "multiple_faces" else
            0.2 if e.event_type in ["no_face_detected", "excessive_looking_away"] else
            0.1
            for e in self.events
        ]
        avg_cheating_prob = (
            sum(cheating_probabilities) / len(cheating_probabilities)
            if cheating_probabilities
            else 0.0
        )
        
        return {
            "session_id": self.session_id,
            "total_frames_analyzed": self.frames_analyzed,
            "frames_with_valid_face": self.frames_with_face,
            "face_presence_ratio": round(face_presence_ratio, 3),
            "total_looking_away_duration_seconds": round(sum(self.looking_away_durations), 2),
            "max_looking_away_duration_seconds": round(max_looking_away, 2),
            "average_looking_away_duration_seconds": round(avg_looking_away, 2),
            "looking_away_count": len(self.looking_away_durations),
            "suspicious_events_count": suspicious_events,
            "total_events_logged": len(self.events),
            "average_cheating_probability": round(avg_cheating_prob, 3),
            "face_score": round(face_score, 1),
            "suspicion_score": round(suspicion_score, 1),
            "integrity_score": round(overall_integrity, 1),
            "risk_level": risk_level,
            "flagged_for_review": overall_integrity < 70 or avg_cheating_prob > 0.5,
            "event_timeline": [e.to_dict() for e in self.events],
        }

    def _get_empty_integrity(self) -> Dict[str, Any]:
        """Return empty integrity report."""
        return {
            "session_id": self.session_id,
            "total_frames_analyzed": 0,
            "frames_with_valid_face": 0,
            "face_presence_ratio": 0,
            "total_looking_away_duration_seconds": 0,
            "max_looking_away_duration_seconds": 0,
            "average_looking_away_duration_seconds": 0,
            "looking_away_count": 0,
            "suspicious_events_count": 0,
            "total_events_logged": 0,
            "average_cheating_probability": 0,
            "face_score": 0,
            "suspicion_score": 100,
            "integrity_score": 50,
            "risk_level": "unknown",
            "flagged_for_review": True,
            "event_timeline": [],
        }

    def get_brief_summary(self) -> Dict[str, Any]:
        """Get brief summary for quick reference."""
        integrity = self.get_session_integrity_score()
        
        return {
            "integrity_score": integrity["integrity_score"],
            "risk_level": integrity["risk_level"],
            "frames_analyzed": integrity["total_frames_analyzed"],
            "suspicious_events": integrity["suspicious_events_count"],
            "flagged_for_review": integrity["flagged_for_review"],
        }
